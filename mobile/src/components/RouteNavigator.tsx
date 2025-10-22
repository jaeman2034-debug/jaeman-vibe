import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import KakaoMapView, { KakaoMapViewRef } from "./KakaoMapView";
import { ensureSession, logVoice } from "../lib/firebase";

type RouteNavigatorProps = {
  appKey: string;
  center?: { lat: number; lng: number };
  destination?: { lat: number; lng: number; name: string };
  onRouteComplete?: () => void;
};

type RouteInstruction = {
  distance: number;
  instruction: string;
  turn: number;
  type: string;
  duration: number;
};

export default function RouteNavigator({
  appKey,
  center,
  destination,
  onRouteComplete,
}: RouteNavigatorProps) {
  const [instructions, setInstructions] = useState<RouteInstruction[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState<RouteInstruction | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeSummary, setRouteSummary] = useState<any>(null);
  
  const mapRef = useRef<KakaoMapViewRef>(null);
  const sessionId = useRef<string>("");

  // === 寃쎈줈 寃??===
  const fetchDirections = async (origin: { lat: number; lng: number }, dest: { lat: number; lng: number }) => {
    try {
      setIsNavigating(true);
      
      // Firebase Function ?꾨줉???몄텧 (??踰꾩쟾怨??숈씪)
      const proxyUrl = `https://asia-northeast3-${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/getKakaoDirections`;
      const url = `${proxyUrl}?origin=${origin.lng},${origin.lat}&destination=${dest.lng},${dest.lat}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API ?ㅻ쪟: ${response.status}`);
      }
      
      const json = await response.json();
      
      if (!json.routes || !json.routes.length) {
        Alert.alert("?ㅻ쪟", "寃쎈줈瑜?李얠쓣 ???놁뒿?덈떎.");
        return;
      }

      const route = json.routes[0];
      setRouteSummary(route.summary);

      // 寃쎈줈 醫뚰몴 異붿텧
      const coords: { lat: number; lng: number }[] = [];
      route.sections.forEach((section: any) => {
        section.roads.forEach((road: any) => {
          for (let i = 0; i < road.vertexes.length; i += 2) {
            coords.push({
              lat: road.vertexes[i + 1],
              lng: road.vertexes[i],
            });
          }
        });
      });

      // 吏?꾩뿉 寃쎈줈 ?쒖떆
      mapRef.current?.drawPolyline(coords);

      // ?덈궡 臾몄옣 異붿텧
      const instr: RouteInstruction[] = [];
      route.sections.forEach((section: any) => {
        section.guides.forEach((guide: any) => {
          instr.push({
            distance: guide.distance,
            instruction: guide.guidance,
            turn: guide.turn_type || 0,
            type: guide.type || "STRAIGHT",
            duration: guide.duration || 0,
          });
        });
      });

      setInstructions(instr);
      setCurrentInstruction(instr[0] || null);

      // 濡쒓퉭
      if (sessionId.current) {
        await logVoice(sessionId.current, {
          type: "results",
          resultCount: 1,
          meta: {
            destination: destination?.name,
            distance: route.summary.distance,
            duration: route.summary.duration,
            instructions: instr.length,
          },
        });
      }

      Alert.alert(
        "寃쎈줈 ?덈궡 ?쒖옉",
        `紐⑹쟻吏源뚯? ${Math.round(route.summary.distance / 1000)}km, ?덉긽 ?쒓컙 ${Math.round(route.summary.duration / 60)}遺꾩엯?덈떎.`
      );

    } catch (error) {
      console.error("寃쎈줈 寃???ㅻ쪟:", error);
      Alert.alert("?ㅻ쪟", "寃쎈줈 寃??以?臾몄젣媛 諛쒖깮?덉뒿?덈떎.");
      
      if (sessionId.current) {
        await logVoice(sessionId.current, {
          type: "error",
          text: "寃쎈줈 寃???ㅻ쪟",
          meta: { error: (error as Error).message },
        });
      }
    }
  };

  // === 寃쎈줈 ?덈궡 ?쒖옉 ===
  const startNavigation = async () => {
    if (!center || !destination) {
      Alert.alert("?ㅻ쪟", "異쒕컻吏? 紐⑹쟻吏媛 ?꾩슂?⑸땲??");
      return;
    }

    // ?몄뀡 珥덇린??    const id = await ensureSession();
    sessionId.current = id;

    await fetchDirections(center, destination);
  };

  // === ?ㅼ쓬 ?덈궡 ===
  const nextInstruction = () => {
    const currentIndex = instructions.findIndex(inst => inst === currentInstruction);
    if (currentIndex < instructions.length - 1) {
      const next = instructions[currentIndex + 1];
      setCurrentInstruction(next);
      
      // 濡쒓퉭
      if (sessionId.current) {
        logVoice(sessionId.current, {
          type: "map",
          text: "next_instruction",
          meta: { instruction: next.instruction, distance: next.distance },
        });
      }
    } else {
      // ?꾩갑
      setIsNavigating(false);
      onRouteComplete?.();
      
      if (sessionId.current) {
        logVoice(sessionId.current, {
          type: "tts",
          text: "紐⑹쟻吏 ?꾩갑",
          meta: { destination: destination?.name },
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* 吏??*/}
      <View style={styles.mapContainer}>
        <KakaoMapView
          ref={mapRef}
          appKey={appKey}
          center={center}
          markers={destination ? [{
            id: "destination",
            lat: destination.lat,
            lng: destination.lng,
            title: destination.name,
          }] : []}
        />
      </View>

      {/* 而⑦듃濡??⑤꼸 */}
      <View style={styles.controlPanel}>
        {!isNavigating ? (
          <TouchableOpacity
            onPress={startNavigation}
            style={styles.startButton}
          >
            <Text style={styles.startButtonText}>?슅 寃쎈줈 ?덈궡 ?쒖옉</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.navigationPanel}>
            {/* ?꾩옱 ?덈궡 */}
            {currentInstruction && (
              <View style={styles.instructionCard}>
                <Text style={styles.instructionText}>
                  {currentInstruction.instruction}
                </Text>
                <Text style={styles.instructionDistance}>
                  {currentInstruction.distance}m ??                </Text>
              </View>
            )}

            {/* 寃쎈줈 ?뺣낫 */}
            {routeSummary && (
              <View style={styles.routeInfo}>
                <Text style={styles.routeInfoText}>
                  嫄곕━: {Math.round(routeSummary.distance / 1000)}km
                </Text>
                <Text style={styles.routeInfoText}>
                  ?덉긽 ?쒓컙: {Math.round(routeSummary.duration / 60)}遺?                </Text>
                {routeSummary.toll_fare > 0 && (
                  <Text style={styles.routeInfoText}>
                    ?듯뻾猷? {routeSummary.toll_fare.toLocaleString()}??                  </Text>
                )}
              </View>
            )}

            {/* 而⑦듃濡?踰꾪듉??*/}
            <View style={styles.controlButtons}>
              <TouchableOpacity
                onPress={nextInstruction}
                style={styles.nextButton}
              >
                <Text style={styles.nextButtonText}>?ㅼ쓬 ?덈궡</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setIsNavigating(false);
                  setInstructions([]);
                  setCurrentInstruction(null);
                  setRouteSummary(null);
                  mapRef.current?.clearPolyline();
                }}
                style={styles.stopButton}
              >
                <Text style={styles.stopButtonText}>?덈궡 以묐떒</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  mapContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  controlPanel: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    padding: 16,
  },
  startButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  navigationPanel: {
    gap: 16,
  },
  instructionCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  instructionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  instructionDistance: {
    fontSize: 14,
    color: "#666666",
  },
  routeInfo: {
    backgroundColor: "#e8f4fd",
    padding: 12,
    borderRadius: 8,
  },
  routeInfoText: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 2,
  },
  controlButtons: {
    flexDirection: "row",
    gap: 12,
  },
  nextButton: {
    flex: 1,
    backgroundColor: "#34C759",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  stopButton: {
    flex: 1,
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  stopButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
