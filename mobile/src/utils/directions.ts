// src/utils/directions.ts
// Kakao Mobility Directions API瑜?Firebase Functions ?꾨줉?쒕? ?듯빐 ?몄텧?섎뒗 ?좏떥由ы떚

export type RouteCoordinate = {
  lat: number;
  lng: number;
};

export type RouteInstruction = {
  distance: number;
  instruction: string;
  mobileGuidance: string;
  announcementDistance: number;
  priority: "high" | "medium" | "low";
  turn: number;
  type: string;
  duration: number;
};

export type RouteSummary = {
  distance: number;
  duration: number;
  toll_fare: number;
  fuel_price: number;
};

export type RouteData = {
  summary: RouteSummary;
  sections: {
    guides: RouteInstruction[];
    roads: any[];
  }[];
};

/**
 * Firebase Functions ?꾨줉?쒕? ?듯빐 Kakao Directions API ?몄텧
 */
export async function fetchRoute(
  origin: [number, number],
  destination: [number, number]
): Promise<RouteData | null> {
  try {
    // Firebase Function ?꾨줉??URL (app.json?먯꽌 媛?몄삤湲?
    const proxyUrl = (require("../../app.json").expo.extra.functionsProxy as string) || 
      `https://asia-northeast3-${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/getKakaoDirections`;
    
    // 醫뚰몴瑜?"寃쎈룄,?꾨룄" ?뺤떇?쇰줈 蹂??    const originStr = `${origin[0]},${origin[1]}`;
    const destStr = `${destination[0]},${destination[1]}`;
    
    const url = `${proxyUrl}?origin=${originStr}&destination=${destStr}`;
    
    console.log("?뿺截?Directions API ?몄텧 (?꾨줈?뺤뀡):", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // ??꾩븘???ㅼ젙 (30珥?
      signal: AbortSignal.timeout(30000),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("??API ?묐떟 ?ㅻ쪟:", response.status, errorText);
      throw new Error(`API ?ㅻ쪟: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.routes || !data.routes.length) {
      console.warn("寃쎈줈瑜?李얠쓣 ???놁뒿?덈떎.");
      return null;
    }
    
    console.log("??寃쎈줈 ?곗씠???섏떊:", data.routes[0]);
    return data.routes[0];
    
  } catch (error) {
    console.error("??寃쎈줈 寃???ㅻ쪟:", error);
    
    // ?ㅽ듃?뚰겕 ?ㅻ쪟??寃쎌슦 ?ъ떆???쒖븞
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("寃쎈줈 寃???쒓컙??珥덇낵?섏뿀?듬땲?? ?ㅼ떆 ?쒕룄?댁＜?몄슂.");
    }
    
    throw error;
  }
}

/**
 * 寃쎈줈 ?곗씠?곗뿉??醫뚰몴 諛곗뿴 異붿텧
 */
export function extractRouteCoordinates(route: RouteData): RouteCoordinate[] {
  const coords: RouteCoordinate[] = [];
  
  route.sections.forEach((section) => {
    section.roads.forEach((road) => {
      for (let i = 0; i < road.vertexes.length; i += 2) {
        coords.push({
          lat: road.vertexes[i + 1],
          lng: road.vertexes[i],
        });
      }
    });
  });
  
  return coords;
}

/**
 * 寃쎈줈 ?곗씠?곗뿉???덈궡 臾몄옣 諛곗뿴 異붿텧
 */
export function extractRouteInstructions(route: RouteData): RouteInstruction[] {
  const instructions: RouteInstruction[] = [];
  
  route.sections.forEach((section) => {
    section.guides.forEach((guide) => {
      instructions.push({
        distance: guide.distance,
        instruction: guide.guidance,
        mobileGuidance: guide.mobileGuidance || guide.guidance.replace(/\./g, "").trim(),
        announcementDistance: guide.announcementDistance || 
          (guide.distance <= 100 ? 50 : guide.distance <= 300 ? 100 : 200),
        priority: guide.priority || 
          (guide.distance <= 50 ? "high" : guide.distance <= 200 ? "medium" : "low"),
        turn: guide.turn_type || 0,
        type: guide.type || "STRAIGHT",
        duration: guide.duration || 0,
      });
    });
  });
  
  return instructions;
}

/**
 * ??醫뚰몴 媛꾩쓽 嫄곕━ 怨꾩궛 (誘명꽣)
 */
export function calculateDistance(
  coord1: RouteCoordinate,
  coord2: RouteCoordinate
): number {
  const R = 6371e3; // 吏援?諛섏?由?(誘명꽣)
  const ?1 = (coord1.lat * Math.PI) / 180;
  const ?2 = (coord2.lat * Math.PI) / 180;
  const ?? = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const ?貫 = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(?? / 2) * Math.sin(?? / 2) +
    Math.cos(?1) * Math.cos(?2) * Math.sin(?貫 / 2) * Math.sin(?貫 / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * ?꾩옱 ?꾩튂?먯꽌 媛??媛源뚯슫 寃쎈줈 醫뚰몴 李얘린
 */
export function findNearestRoutePoint(
  currentLocation: RouteCoordinate,
  routeCoordinates: RouteCoordinate[]
): { index: number; distance: number } {
  let nearestIndex = 0;
  let minDistance = Infinity;
  
  routeCoordinates.forEach((coord, index) => {
    const distance = calculateDistance(currentLocation, coord);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = index;
    }
  });
  
  return { index: nearestIndex, distance: minDistance };
}

/**
 * 寃쎈줈 ?붿빟 ?뺣낫 ?щ㎎?? */
export function formatRouteSummary(summary: RouteSummary): string {
  const distance = Math.round(summary.distance / 1000);
  const duration = Math.round(summary.duration / 60);
  
  let message = `紐⑹쟻吏源뚯? ${distance}?щ줈誘명꽣, ?덉긽 ?쒓컙 ${duration}遺?;
  
  if (summary.toll_fare > 0) {
    message += `, ?듯뻾猷?${summary.toll_fare.toLocaleString()}??;
  }
  
  return message;
}
