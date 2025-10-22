import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Linking,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import Voice from "react-native-voice";
import * as Speech from "expo-speech";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import Constants from "expo-constants";
import KakaoMapView, { KakaoMapViewRef, Marker } from "./src/components/KakaoMapView";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, ensureSession, logVoice } from "./src/lib/firebase";
import { 
  fetchRoute, 
  extractRouteCoordinates, 
  extractRouteInstructions, 
  formatRouteSummary,
  RouteCoordinate,
  RouteInstruction 
} from "./src/utils/directions";
import { useNavigation } from "./src/hooks/useNavigation";
import { 
  subscribeToKeyword, 
  unsubscribeFromKeyword,
  setupNotificationListener,
  sendLocalNotification 
} from "./src/utils/notifications";
import BriefingPanel from "./src/components/BriefingPanel";

type Item = {
  id: string;
  title: string;
  autoDescription?: string;
  imageUrls?: string[];
  autoTags?: string[];
  location?: { latitude: number; longitude: number };
};

export default function App() {
  // ?ㅼ젙媛믩뱾
  const kakaoKey = (Constants.expoConfig?.extra as any)?.kakaoAppKey as string;
  
  // ?곹깭 愿由?  const [listening, setListening] = useState(false);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>("?꾩튂 ?뺤씤 以?..");
  const [navigationMode, setNavigationMode] = useState<"search" | "navigate">("search");
  const [destination, setDestination] = useState<{ name: string; pos: { lat: number; lng: number } } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const [showBriefingPanel, setShowBriefingPanel] = useState(false);

  // 李몄“??  const mapRef = useRef<KakaoMapViewRef>(null);

  // ?ㅻ퉬寃뚯씠????  const navigation = useNavigation({
    announcementDistance: 100,
    highPriorityDistance: 50,
    sessionId,
    onArrival: () => {
      Alert.alert("?꾩갑", "紐⑹쟻吏???꾩갑?덉뒿?덈떎!");
      setNavigationMode("search");
      setDestination(null);
      setRouteCoordinates([]);
    },
    onError: (error) => {
      Alert.alert("?ㅻ퉬寃뚯씠???ㅻ쪟", error);
      setNavigationMode("search");
    },
  });

  // === 珥덇린??===
  useEffect(() => {
    initializeApp();
    setupVoice();
    setupNotifications();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // === ??珥덇린??===
  const initializeApp = async () => {
    try {
      // ?몄뀡 珥덇린??      const id = await ensureSession();
      setSessionId(id);
      await logVoice(id, { type: "start", meta: { platform: "mobile" } });

      // ?꾩튂 沅뚰븳 ?붿껌
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenter(pos);
        setCurrentLocation(`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
        
        await logVoice(id, {
          type: "start",
          geo: pos,
          meta: { accuracy: position.coords.accuracy },
        });
      } else {
        setCurrentLocation("?꾩튂 沅뚰븳???꾩슂?⑸땲??);
      }
    } catch (error) {
      console.error("珥덇린???ㅻ쪟:", error);
      Alert.alert("?ㅻ쪟", "??珥덇린??以?臾몄젣媛 諛쒖깮?덉뒿?덈떎.");
    }
  };

  // === ?뚯꽦 ?몄떇 ?ㅼ젙 ===
  const setupVoice = () => {
    Voice.onSpeechResults = (e: any) => {
      const text = e.value?.[0] || "";
      handleQuery(text);
      setListening(false);
    };
    Voice.onSpeechEnd = () => setListening(false);
    Voice.onSpeechError = (e: any) => {
      console.error("?뚯꽦 ?몄떇 ?ㅻ쪟:", e.error);
      setListening(false);
      if (sessionId) {
        logVoice(sessionId, { type: "error", text: "STT ?ㅻ쪟", meta: { error: e.error } });
      }
    };
  };

  // === ?몄떆 ?뚮┝ ?ㅼ젙 ===
  const setupNotifications = () => {
    const cleanup = setupNotificationListener(
      // ?뚮┝ ?섏떊 ??      (notification: Notifications.Notification) => {
        console.log("?벑 ?몄떆 ?뚮┝ ?섏떊:", notification);
        
        // 釉뚮━???뚮┝ ?섏떊 ???먮룞?쇰줈 ?뚯꽦 ?ъ깮
        const data = notification.request.content.data;
        if (data?.type === "daily_briefing" && data?.summary) {
          console.log("?똿 ?쇱씪 釉뚮━???섏떊, ?뚯꽦 ?ъ깮 ?쒖옉");
          speak(data.summary);
        }
      },
      // ?뚮┝ ????      (response: Notifications.NotificationResponse) => {
        const data = response.notification.request.content.data;
        console.log("?뵒 ?뚮┝ ??맖:", data);
        
        if (data?.itemId) {
          // ?곹뭹 ?곸꽭 ?섏씠吏濡??대룞 (異뷀썑 援ы쁽)
          Alert.alert("?뚮┝", `???곹뭹: ${data.itemId}`);
        }
        
        if (data?.type === "daily_summary") {
          // ?쇱씪 ?붿빟 ?붾㈃?쇰줈 ?대룞 (異뷀썑 援ы쁽)
          Alert.alert("?쇱씪 ?붿빟", `${data.keyword} 愿?????곹뭹 ${data.itemCount}媛쒓? ?깅줉?섏뿀?듬땲??`);
        }
        
        if (data?.type === "daily_briefing" && data?.summary) {
          // 釉뚮━???뚮┝ ?????뚯꽦?쇰줈 ?쎌뼱二쇨린
          console.log("?똿 釉뚮━???뚮┝ ??맖, ?뚯꽦 ?ъ깮");
          speak(data.summary);
        }
      }
    );

    return cleanup;
  };

  // === ?뚯꽦 異쒕젰 ===
  const speak = async (text: string) => {
    try {
      await Speech.speak(text, {
        language: "ko-KR",
        rate: 1.05, // [[memory:5313820]]???곕씪 理쒖쟻 ?띾룄 ?ㅼ젙
        pitch: 1.0,
        volume: 0.8,
      });
      
      if (sessionId) {
        await logVoice(sessionId, { type: "tts", text });
      }
    } catch (error) {
      console.error("TTS ?ㅻ쪟:", error);
    }
  };

  // === ?쒓렇 異붿텧 ===
  const extractTags = (text: string): string[] => {
    const stopWords = [
      "洹쇱쿂", "二쇰?", "蹂댁뿬以?, "李얠븘以?, "源뚯?", "?덈궡", "媛??, "濡?, "?쇰줈",
      "?쇨퀬??, "??, "醫", "?닿굅", "?뺣떂", "??, "瑜?, "??, "媛", "?", "??,
      "??, "?먯꽌", "?", "怨?, "?덉뼱", "?덈굹", "?댁쨾", "?댁＜?몄슂", "?뚮젮以?,
      "?뚮젮二쇱꽭??, "??, "??, "??, "洹?, "?", "??, "洹멸쾬", "?닿쾬", "?寃?, "嫄?, "寃?
    ];
    
    return text
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.includes(w));
  };

  // === 寃??泥섎━ ===
  async function handleQuery(text: string) {
    if (!text.trim()) return;
    
    setIsLoading(true);
    
    try {
      // STT 濡쒓퉭
      if (sessionId) {
        await logVoice(sessionId, { type: "stt", text });
      }

      // ?ㅻ퉬寃뚯씠??紐낅졊???뺤씤
      const navigationKeywords = ["?덈궡?댁쨾", "湲몄갼湲?, "媛??, "媛以?, "源뚯?"];
      const isNavigationCommand = navigationKeywords.some(keyword => text.includes(keyword));

      if (isNavigationCommand) {
        await handleNavigationCommand(text);
      } else {
        await handleSearchCommand(text);
      }

    } catch (error) {
      console.error("紐낅졊 泥섎━ ?ㅻ쪟:", error);
      await speak("紐낅졊??泥섎━?섎뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
      
      if (sessionId) {
        await logVoice(sessionId, { type: "error", text: "紐낅졊 泥섎━ ?ㅻ쪟", meta: { error: (error as Error).message } });
      }
    } finally {
      setIsLoading(false);
    }
  }

  // === 寃??紐낅졊 泥섎━ ===
  async function handleSearchCommand(text: string) {
    // 援щ룆 紐낅졊 ?뺤씤
    if (text.includes("?뚮젮以?) || text.includes("?뚮┝")) {
      await handleSubscriptionCommand(text);
      return;
    }

    // ?쒓렇 異붿텧
    const tags = extractTags(text);
    if (tags.length === 0) {
      await speak("寃?됱뼱瑜??댄빐?섏? 紐삵뻽?듬땲??");
      return;
    }

    // Firestore 寃??    const ref = collection(db, "marketItems");
    const q = query(ref, where("autoTags", "array-contains-any", tags.slice(0, 5)));
    const snap = await getDocs(q);
    const items = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Item[];
    
    setResults(items);
    
    // 寃??寃곌낵 濡쒓퉭
    if (sessionId) {
      await logVoice(sessionId, {
        type: "results",
        resultCount: items.length,
        meta: { tags, searchText: text },
      });
    }

    // ?뚯꽦 ?묐떟
    if (items.length > 0) {
      await speak(`${tags[0]} 愿??寃곌낵 ${items.length}媛쒕? 李얠븯?듬땲??`);
    } else {
      await speak("寃??寃곌낵媛 ?놁뒿?덈떎.");
    }
  }

  // === 援щ룆 紐낅졊 泥섎━ ===
  async function handleSubscriptionCommand(text: string) {
    const tags = extractTags(text);
    if (tags.length === 0) {
      await speak("援щ룆???ㅼ썙?쒕? 留먯???二쇱꽭??");
      return;
    }

    const keyword = tags[0];
    
    try {
      // ?꾩옱 ?ъ슜??ID (?꾩떆濡??몄뀡 ID ?ъ슜)
      const uid = sessionId || "anonymous";
      
      const success = await subscribeToKeyword(uid, keyword, center);
      
      if (success) {
        await speak(`'${keyword}' ?뚮┝ 援щ룆???꾨즺?섏뿀?듬땲?? 洹쇱쿂?????곹뭹???깅줉?섎㈃ ?뚮젮?쒕━寃좎뒿?덈떎.`);
      } else {
        await speak("?뚮┝ 援щ룆???ㅽ뙣?덉뒿?덈떎. ?ㅺ린湲곗뿉???ㅼ떆 ?쒕룄??二쇱꽭??");
      }
    } catch (error) {
      console.error("援щ룆 泥섎━ ?ㅻ쪟:", error);
      await speak("援щ룆 泥섎━ 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
    }
  }

  // === ?ㅻ퉬寃뚯씠??紐낅졊 泥섎━ ===
  async function handleNavigationCommand(text: string) {
    if (!center) {
      await speak("?꾩옱 ?꾩튂瑜??뺤씤?????놁뒿?덈떎.");
      return;
    }

    // 紐⑹쟻吏 異붿텧
    const cleanedText = text.replace(/源뚯?|濡??덈궡?댁쨾|湲몄갼湲?媛??媛以?李얠븘以?gi, "").trim();
    
    if (!cleanedText) {
      await speak("紐⑹쟻吏瑜?留먯???二쇱꽭??");
      return;
    }

    // Kakao Places濡?紐⑹쟻吏 寃??    const dest = await searchDestination(cleanedText);
    if (!dest) {
      await speak("紐⑹쟻吏瑜?李얠쓣 ???놁뒿?덈떎.");
      return;
    }

    setDestination(dest);
    await startNavigation(dest);
  }

  // === 紐⑹쟻吏 寃??===
  async function searchDestination(query: string): Promise<{ name: string; pos: { lat: number; lng: number } } | null> {
    return new Promise((resolve) => {
      // WebView??Kakao Places ?쒕퉬???ъ슜
      const script = `
        (function() {
          if (typeof kakao === 'undefined' || !kakao.maps.services) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'places_search_error',
              error: 'Kakao Maps not loaded'
            }));
            return;
          }
          
          const places = new kakao.maps.services.Places();
          places.keywordSearch('${query}', function(data, status) {
            if (status === kakao.maps.services.Status.OK && data.length > 0) {
              const result = data[0];
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'places_search_result',
                data: {
                  name: result.place_name,
                  lat: parseFloat(result.y),
                  lng: parseFloat(result.x)
                }
              }));
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'places_search_error',
                error: 'No results found'
              }));
            }
          });
        })();
      `;
      
      mapRef.current?.postMessage(JSON.stringify({
        type: 'execute_script',
        script: script
      }));
      
      // 寃곌낵 ?湲?(??꾩븘??10珥?
      const timeout = setTimeout(() => {
        resolve(null);
      }, 10000);
      
      // 硫붿떆吏 由ъ뒪???깅줉 (?꾩떆)
      const handleMessage = (event: any) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === 'places_search_result') {
            clearTimeout(timeout);
            resolve({
              name: data.data.name,
              pos: { lat: data.data.lat, lng: data.data.lng }
            });
          } else if (data.type === 'places_search_error') {
            clearTimeout(timeout);
            resolve(null);
          }
        } catch (error) {
          console.error('硫붿떆吏 ?뚯떛 ?ㅻ쪟:', error);
        }
      };
      
      // ?꾩떆濡??대깽??由ъ뒪???깅줉 (?ㅼ젣濡쒕뒗 WebView 而댄룷?뚰듃?먯꽌 泥섎━)
      setTimeout(() => {
        clearTimeout(timeout);
        resolve(null);
      }, 10000);
    });
  }

  // === ?ㅻ퉬寃뚯씠???쒖옉 ===
  async function startNavigation(dest: { name: string; pos: { lat: number; lng: number } }) {
    if (!center) return;

    try {
      await speak(`紐⑹쟻吏 ${dest.name}濡?寃쎈줈瑜?怨꾩궛?섍퀬 ?덉뒿?덈떎.`);
      
      // Kakao Directions API ?몄텧
      const route = await fetchRoute(
        [center.lng, center.lat],
        [dest.pos.lng, dest.pos.lat]
      );

      if (!route) {
        await speak("寃쎈줈瑜?李얠쓣 ???놁뒿?덈떎.");
        return;
      }

      // 寃쎈줈 ?곗씠??異붿텧
      const coordinates = extractRouteCoordinates(route);
      const instructions = extractRouteInstructions(route);
      const summary = formatRouteSummary(route.summary);

      setRouteCoordinates(coordinates);

      // 吏?꾩뿉 寃쎈줈 ?쒖떆
      mapRef.current?.drawPolyline(coordinates);

      // ?ㅻ퉬寃뚯씠???쒖옉
      await navigation.startNavigation(
        instructions,
        coordinates,
        route.summary.distance,
        route.summary.duration
      );

      setNavigationMode("navigate");
      await speak(`${summary}?낅땲?? ?ㅻ퉬寃뚯씠?섏쓣 ?쒖옉?⑸땲??`);

    } catch (error) {
      console.error("?ㅻ퉬寃뚯씠???쒖옉 ?ㅻ쪟:", error);
      await speak("?ㅻ퉬寃뚯씠?섏쓣 ?쒖옉?????놁뒿?덈떎.");
    }
  }

  // === ?뚯꽦 ?낅젰 ?쒖옉 ===
  const startVoice = async () => {
    try {
      setListening(true);
      await Voice.start("ko-KR");
    } catch (error) {
      console.error("?뚯꽦 ?몄떇 ?쒖옉 ?ㅻ쪟:", error);
      setListening(false);
      Alert.alert("?ㅻ쪟", "?뚯꽦 ?몄떇???쒖옉?????놁뒿?덈떎.");
    }
  };

  // === 移댁뭅?ㅻ궡鍮??닿린 ===
  const openKakaoNavi = (item: Item) => {
    if (!item.location) {
      Alert.alert("?뚮┝", "?꾩튂 ?뺣낫媛 ?녿뒗 ?곹뭹?낅땲??");
      return;
    }

    const name = encodeURIComponent(item.title || "紐⑹쟻吏");
    const x = item.location.longitude; // 寃쎈룄
    const y = item.location.latitude;  // ?꾨룄
    const url = `kakaonavi://navigate?name=${name}&x=${x}&y=${y}`;
    
    Linking.openURL(url).catch(() => {
      // 移댁뭅?ㅻ궡鍮꾧? ?놁쑝硫??ㅽ넗?대줈 ?대룞
      const storeUrl = Platform.OS === "ios" 
        ? "https://apps.apple.com/app/kakaonavi/id304608425"
        : "https://play.google.com/store/apps/details?id=net.daum.android.map";
      Linking.openURL(storeUrl);
    });
  };

  // === 吏??留덉빱 ?대┃ 泥섎━ ===
  const handleMarkerClick = async (id: string) => {
    const item = results.find(r => r.id === id);
    if (item) {
      await speak(`${item.title}. 紐⑹쟻吏濡??덈궡?좉퉴??`);
      
      // 吏???대┃ 濡쒓퉭
      if (sessionId) {
        await logVoice(sessionId, {
          type: "map",
          text: "marker_click",
          meta: { itemId: id, title: item.title },
        });
      }
    }
  };

  // === 吏??留덉빱 ?앹꽦 ===
  const mapMarkers: Marker[] = results
    .filter(r => r.location)
    .map(r => ({
      id: r.id,
      lat: r.location!.latitude,
      lng: r.location!.longitude,
      title: r.title,
      desc: r.autoDescription,
    }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* ?ㅻ뜑 */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {navigationMode === "navigate" ? "?슅 ?ㅻ퉬寃뚯씠?? : "?럺截??쇨퀬 鍮꾩꽌"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {navigationMode === "navigate" ? "?ㅼ떆媛??꾨줈 ?덈궡" : "?뚯꽦 + 吏??+ ?대퉬寃뚯씠??}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowBriefingPanel(true)}
          style={styles.briefingButton}
        >
          <Text style={styles.briefingButtonText}>?똿</Text>
        </TouchableOpacity>
      </View>

      {/* ?꾩옱 ?꾩튂 ?쒖떆 */}
      <View style={styles.locationBar}>
        <Text style={styles.locationText}>?뱧 {currentLocation}</Text>
        {navigationMode === "navigate" && destination && (
          <Text style={styles.destinationText}>?렞 {destination.name}</Text>
        )}
      </View>

      {/* ?낅젰 ?곸뿭 */}
      <View style={styles.inputSection}>
        <TouchableOpacity
          onPress={startVoice}
          disabled={listening || isLoading}
          style={[
            styles.voiceButton,
            { backgroundColor: listening ? "#ff4444" : isLoading ? "#999" : "#000" }
          ]}
        >
          <Text style={styles.voiceButtonText}>
            {listening ? "?렒 ?ｋ뒗 以?.." : isLoading ? "??泥섎━ 以?.." : "?렎 留먰븯湲?}
          </Text>
        </TouchableOpacity>
        
        <TextInput
          placeholder={navigationMode === "navigate" ? "?? ?뚰쓽 泥댁쑁怨듭썝源뚯? ?덈궡?댁쨾" : "?? 洹쇱쿂 異뺢뎄??蹂댁뿬以?}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => {
            handleQuery(input);
            setInput("");
          }}
          style={styles.textInput}
          editable={!isLoading}
        />
      </View>

      {/* 吏???곸뿭 */}
      <View style={styles.mapContainer}>
        <KakaoMapView
          ref={mapRef}
          appKey={kakaoKey}
          center={center ?? undefined}
          markers={navigationMode === "navigate" ? [] : mapMarkers}
          onMarkerClick={handleMarkerClick}
        />
      </View>

      {/* ?ㅻ퉬寃뚯씠??紐⑤뱶????*/}
      {navigationMode === "navigate" && (
        <View style={styles.navigationPanel}>
          {navigation.currentInstruction && (
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>?뱼 ?꾩옱 ?덈궡</Text>
              <Text style={styles.instructionText}>
                {navigation.currentInstruction.mobileGuidance}
              </Text>
              <Text style={styles.instructionDistance}>
                {navigation.remainingDistance}m ??              </Text>
            </View>
          )}
          
          <View style={styles.navigationControls}>
            <TouchableOpacity
              onPress={navigation.nextInstruction}
              style={styles.nextButton}
            >
              <Text style={styles.nextButtonText}>?ㅼ쓬 ?덈궡</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                navigation.stopNavigation();
                setNavigationMode("search");
                setDestination(null);
                setRouteCoordinates([]);
                mapRef.current?.clearPolyline();
              }}
              style={styles.stopButton}
            >
              <Text style={styles.stopButtonText}>?덈궡 以묐떒</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 寃??紐⑤뱶????*/}
      {navigationMode === "search" && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>
            ?뵇 寃??寃곌낵 ({results.length}媛?
          </Text>
          
          <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
            {results.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.resultItem}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.autoDescription && (
                    <Text style={styles.resultDesc} numberOfLines={2}>
                      {item.autoDescription}
                    </Text>
                  )}
                  {item.location && (
                    <Text style={styles.resultLocation}>
                      ?뱧 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity
                  onPress={() => openKakaoNavi(item)}
                  style={styles.naviButton}
                >
                  <Text style={styles.naviButtonText}>?대퉬</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {results.length === 0 && !isLoading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>寃??寃곌낵媛 ?놁뒿?덈떎</Text>
                <Text style={styles.emptySubtext}>?뚯꽦?쇰줈 留먰븯嫄곕굹 ?띿뒪?몃줈 寃?됲빐蹂댁꽭??/Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* 釉뚮━???⑤꼸 */}
      {showBriefingPanel && (
        <BriefingPanel onClose={() => setShowBriefingPanel(false)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerContent: {
    flex: 1,
  },
  briefingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  briefingButtonText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  locationBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  locationText: {
    fontSize: 12,
    color: "#666666",
  },
  destinationText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  inputSection: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  voiceButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    alignItems: "center",
  },
  voiceButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  mapContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  resultsSection: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    maxHeight: 200,
  },
  resultsTitle: {
    padding: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  resultInfo: {
    flex: 1,
    marginRight: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  resultDesc: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  resultLocation: {
    fontSize: 12,
    color: "#999999",
  },
  naviButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  naviButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999999",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#cccccc",
    textAlign: "center",
  },
  navigationPanel: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    padding: 16,
  },
  instructionCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 8,
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
  navigationControls: {
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
