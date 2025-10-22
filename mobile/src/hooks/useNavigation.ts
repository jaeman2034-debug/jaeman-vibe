// src/hooks/useNavigation.ts
// ?ㅼ떆媛?GPS 異붿쟻 諛??대컮?댄꽩 ?덈궡瑜??꾪븳 而ㅼ뒪? ??
import { useState, useRef, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import { RouteInstruction, RouteCoordinate, calculateDistance, findNearestRoutePoint } from "../utils/directions";
import { logVoice } from "../lib/firebase";

export type NavigationState = {
  isNavigating: boolean;
  currentInstruction: RouteInstruction | null;
  currentIndex: number;
  remainingDistance: number;
  totalDistance: number;
  estimatedTime: number;
  currentLocation: RouteCoordinate | null;
};

export type NavigationConfig = {
  announcementDistance: number; // ?덈궡 ?쒖옉 嫄곕━ (誘명꽣)
  highPriorityDistance: number; // 怨좎슦?좎닚???덈궡 嫄곕━
  sessionId: string;
  onArrival?: () => void;
  onError?: (error: string) => void;
};

export function useNavigation(config: NavigationConfig) {
  const [state, setState] = useState<NavigationState>({
    isNavigating: false,
    currentInstruction: null,
    currentIndex: 0,
    remainingDistance: 0,
    totalDistance: 0,
    estimatedTime: 0,
    currentLocation: null,
  });

  const instructionsRef = useRef<RouteInstruction[]>([]);
  const routeCoordinatesRef = useRef<RouteCoordinate[]>([]);
  const watchIdRef = useRef<Location.LocationSubscription | null>(null);
  const lastAnnouncedIndexRef = useRef(-1);
  const lastSpokenTimeRef = useRef(0);

  // === ?뚯꽦 ?덈궡 ===
  const speak = useCallback(async (text: string, priority: "high" | "medium" | "low" = "medium") => {
    try {
      // 以묐났 ?덈궡 諛⑹? (3珥????숈씪???덈궡 湲덉?)
      const now = Date.now();
      if (now - lastSpokenTimeRef.current < 3000) {
        return;
      }
      lastSpokenTimeRef.current = now;

      // ?곗꽑?쒖쐞???곕Ⅸ ?뚯꽦 ?ㅼ젙
      const speechOptions = {
        language: "ko-KR",
        rate: 1.05, // [[memory:5313820]]???곕씪 理쒖쟻 ?띾룄 ?ㅼ젙
        pitch: 1.0,
        volume: priority === "high" ? 1.0 : 0.8,
      };

      await Speech.speak(text, speechOptions);
      
      // ?덈궡 濡쒓퉭
      if (config.sessionId) {
        await logVoice(config.sessionId, {
          type: "tts",
          text,
          meta: { priority, navigation: true },
        });
      }
    } catch (error) {
      console.error("TTS ?ㅻ쪟:", error);
    }
  }, [config.sessionId]);

  // === ?ㅻ퉬寃뚯씠???쒖옉 ===
  const startNavigation = useCallback(async (
    instructions: RouteInstruction[],
    routeCoordinates: RouteCoordinate[],
    totalDistance: number,
    estimatedTime: number
  ) => {
    try {
      // 湲곗〈 異붿쟻 以묒?
      if (watchIdRef.current) {
        watchIdRef.current.remove();
        watchIdRef.current = null;
      }

      instructionsRef.current = instructions;
      routeCoordinatesRef.current = routeCoordinates;
      lastAnnouncedIndexRef.current = -1;

      setState(prev => ({
        ...prev,
        isNavigating: true,
        currentInstruction: instructions[0] || null,
        currentIndex: 0,
        remainingDistance: totalDistance,
        totalDistance,
        estimatedTime,
      }));

      // ?쒖옉 ?덈궡
      if (instructions.length > 0) {
        await speak(`?ㅻ퉬寃뚯씠?섏쓣 ?쒖옉?⑸땲?? ${instructions[0].mobileGuidance}`);
      }

      // GPS 異붿쟻 ?쒖옉
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        config.onError?.("?꾩튂 沅뚰븳???꾩슂?⑸땲??");
        return;
      }

      watchIdRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // 2珥덈쭏???꾩튂 ?낅뜲?댄듃
          distanceInterval: 10, // 10誘명꽣留덈떎 ?꾩튂 ?낅뜲?댄듃
        },
        handleLocationUpdate
      );

    } catch (error) {
      console.error("?ㅻ퉬寃뚯씠???쒖옉 ?ㅻ쪟:", error);
      config.onError?.("?ㅻ퉬寃뚯씠?섏쓣 ?쒖옉?????놁뒿?덈떎.");
    }
  }, [config, speak]);

  // === ?ㅻ퉬寃뚯씠??以묒? ===
  const stopNavigation = useCallback(() => {
    if (watchIdRef.current) {
      watchIdRef.current.remove();
      watchIdRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isNavigating: false,
      currentInstruction: null,
      currentIndex: 0,
      remainingDistance: 0,
    }));

    instructionsRef.current = [];
    routeCoordinatesRef.current = [];
    lastAnnouncedIndexRef.current = -1;
  }, []);

  // === ?꾩튂 ?낅뜲?댄듃 泥섎━ ===
  const handleLocationUpdate = useCallback(async (location: Location.LocationObject) => {
    const currentPos: RouteCoordinate = {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };

    setState(prev => ({ ...prev, currentLocation: currentPos }));

    if (!state.isNavigating || instructionsRef.current.length === 0) {
      return;
    }

    try {
      // ?꾩옱 ?꾩튂?먯꽌 媛??媛源뚯슫 寃쎈줈 醫뚰몴 李얘린
      const nearest = findNearestRoutePoint(currentPos, routeCoordinatesRef.current);
      const currentIndex = nearest.index;
      const distanceToRoute = nearest.distance;

      // 寃쎈줈?먯꽌 踰쀬뼱?ъ쓣 ??(50m ?댁긽)
      if (distanceToRoute > 50) {
        await speak("寃쎈줈瑜?踰쀬뼱?ъ뒿?덈떎. 寃쎈줈瑜??ㅼ떆 ?덈궡?대뱶由ш쿋?듬땲??", "high");
        return;
      }

      // ?꾩옱 ?덈궡 ?몃뜳???낅뜲?댄듃
      setState(prev => ({ ...prev, currentIndex }));

      // ?ㅼ쓬 ?덈궡 ?뺤씤
      const nextInstructionIndex = currentIndex + 1;
      if (nextInstructionIndex >= instructionsRef.current.length) {
        // 紐⑹쟻吏 ?꾩갑
        await speak("紐⑹쟻吏???꾩갑?덉뒿?덈떎!", "high");
        config.onArrival?.();
        stopNavigation();
        return;
      }

      const nextInstruction = instructionsRef.current[nextInstructionIndex];
      const distanceToNextInstruction = calculateDistance(
        currentPos,
        routeCoordinatesRef.current[nextInstructionIndex]
      );

      // ?덈궡 議곌굔 ?뺤씤
      const shouldAnnounce = 
        nextInstructionIndex > lastAnnouncedIndexRef.current &&
        distanceToNextInstruction <= nextInstruction.announcementDistance;

      if (shouldAnnounce) {
        lastAnnouncedIndexRef.current = nextInstructionIndex;
        
        // ?곗꽑?쒖쐞???곕Ⅸ ?덈궡
        if (nextInstruction.priority === "high") {
          await speak(`二쇱쓽! ${nextInstruction.mobileGuidance}`, "high");
        } else if (nextInstruction.priority === "medium") {
          await speak(nextInstruction.mobileGuidance, "medium");
        } else {
          await speak(nextInstruction.mobileGuidance, "low");
        }

        // ?꾩옱 ?덈궡 ?낅뜲?댄듃
        setState(prev => ({
          ...prev,
          currentInstruction: nextInstruction,
          remainingDistance: Math.round(distanceToNextInstruction),
        }));
      }

    } catch (error) {
      console.error("?꾩튂 ?낅뜲?댄듃 泥섎━ ?ㅻ쪟:", error);
    }
  }, [state.isNavigating, config, speak, stopNavigation]);

  // === 而댄룷?뚰듃 ?몃쭏?댄듃 ???뺣━ ===
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        watchIdRef.current.remove();
      }
    };
  }, []);

  // === ?섎룞 ?덈궡 (?ㅼ쓬 ?덈궡濡??대룞) ===
  const nextInstruction = useCallback(async () => {
    if (!state.isNavigating || instructionsRef.current.length === 0) {
      return;
    }

    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= instructionsRef.current.length) {
      await speak("紐⑹쟻吏???꾩갑?덉뒿?덈떎!", "high");
      config.onArrival?.();
      stopNavigation();
      return;
    }

    const nextInstruction = instructionsRef.current[nextIndex];
    setState(prev => ({
      ...prev,
      currentInstruction: nextInstruction,
      currentIndex: nextIndex,
    }));

    await speak(nextInstruction.mobileGuidance, "medium");
  }, [state.isNavigating, state.currentIndex, config, speak, stopNavigation]);

  // === 寃쎈줈 ?ш퀎??===
  const recalculateRoute = useCallback(async (
    newInstructions: RouteInstruction[],
    newRouteCoordinates: RouteCoordinate[]
  ) => {
    if (!state.isNavigating) {
      return;
    }

    instructionsRef.current = newInstructions;
    routeCoordinatesRef.current = newRouteCoordinates;
    lastAnnouncedIndexRef.current = -1;

    setState(prev => ({
      ...prev,
      currentInstruction: newInstructions[0] || null,
      currentIndex: 0,
    }));

    await speak("寃쎈줈瑜??ш퀎?고뻽?듬땲?? ?덈줈??寃쎈줈濡??덈궡?⑸땲??", "high");
  }, [state.isNavigating, speak]);

  return {
    ...state,
    startNavigation,
    stopNavigation,
    nextInstruction,
    recalculateRoute,
    speak,
  };
}
