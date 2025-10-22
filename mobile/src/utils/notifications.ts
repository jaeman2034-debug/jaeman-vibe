import { setDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Location from "expo-location";

/**
 * ?뵒 ?몄떆 ?뚮┝ 援щ룆 愿由??좏떥由ы떚
 */

// ?뚮┝ ?몃뱾???ㅼ젙
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface SubscriptionData {
  uid: string;
  keyword: string;
  geo: {
    lat: number;
    lng: number;
  };
  fcmToken: string;
  createdAt: any;
  radius?: number; // ?뚮┝ 諛섍꼍 (km, 湲곕낯媛? 5)
}

/**
 * ?ㅼ썙??援щ룆 ?깅줉
 */
export async function subscribeToKeyword(
  uid: string, 
  keyword: string, 
  geo?: { lat: number; lng: number },
  radius: number = 5
): Promise<boolean> {
  try {
    // ?ㅺ린湲??뺤씤
    if (!Device.isDevice) {
      console.warn("?몄떆 ?뚮┝? ?ㅺ린湲곗뿉?쒕쭔 媛?ν빀?덈떎.");
      return false;
    }

    // ?뚮┝ 沅뚰븳 ?붿껌
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.error("?뚮┝ 沅뚰븳???꾩슂?⑸땲??");
      return false;
    }

    // ?꾩옱 ?꾩튂 媛?몄삤湲?(geo媛 ?쒓났?섏? ?딆? 寃쎌슦)
    let currentGeo = geo;
    if (!currentGeo) {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        currentGeo = {
          lat: location.coords.latitude,
          lng: location.coords.longitude
        };
      } else {
        console.error("?꾩튂 沅뚰븳???꾩슂?⑸땲??");
        return false;
      }
    }

    // Expo ?몄떆 ?좏겙 媛?몄삤湲?    const tokenData = await Notifications.getExpoPushTokenAsync();
    const fcmToken = tokenData.data;

    // 援щ룆 ?곗씠?????    const subscriptionId = `${uid}_${keyword}`;
    const subscriptionData: SubscriptionData = {
      uid,
      keyword,
      geo: currentGeo,
      fcmToken,
      createdAt: serverTimestamp(),
      radius
    };

    await setDoc(doc(db, "subscriptions", subscriptionId), subscriptionData);

    console.log(`?뵒 '${keyword}' ?뚮┝ 援щ룆 ?꾨즺`);
    return true;

  } catch (error) {
    console.error("援щ룆 ?깅줉 ?ㅽ뙣:", error);
    return false;
  }
}

/**
 * ?ㅼ썙??援щ룆 ?댁젣
 */
export async function unsubscribeFromKeyword(
  uid: string, 
  keyword: string
): Promise<boolean> {
  try {
    const subscriptionId = `${uid}_${keyword}`;
    await deleteDoc(doc(db, "subscriptions", subscriptionId));
    
    console.log(`?뵓 '${keyword}' ?뚮┝ 援щ룆 ?댁젣 ?꾨즺`);
    return true;

  } catch (error) {
    console.error("援щ룆 ?댁젣 ?ㅽ뙣:", error);
    return false;
  }
}

/**
 * ?ъ슜?먯쓽 紐⑤뱺 援щ룆 議고쉶
 */
export async function getUserSubscriptions(uid: string): Promise<SubscriptionData[]> {
  try {
    const { getDocs, collection, query, where } = await import("firebase/firestore");
    const subscriptionsRef = collection(db, "subscriptions");
    const q = query(subscriptionsRef, where("uid", "==", uid));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SubscriptionData & { id: string }));

  } catch (error) {
    console.error("援щ룆 議고쉶 ?ㅽ뙣:", error);
    return [];
  }
}

/**
 * ?뚮┝ ?섏떊 由ъ뒪???ㅼ젙
 */
export function setupNotificationListener(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
) {
  // ?ш렇?쇱슫???뚮┝ ?섏떊
  const receivedListener = Notifications.addNotificationReceivedListener(onNotificationReceived);
  
  // ?뚮┝ ???대┃ ?묐떟
  const responseListener = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

  // ?뺣━ ?⑥닔 諛섑솚
  return () => {
    receivedListener.remove();
    responseListener.remove();
  };
}

/**
 * 濡쒖뺄 ?뚮┝ 諛쒖넚 (?뚯뒪?몄슜)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // 利됱떆 諛쒖넚
  });
}

/**
 * 嫄곕━ 怨꾩궛 (Haversine formula)
 */
export function calculateDistance(
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number {
  const R = 6371; // 吏援?諛섏?由?(km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * ?꾩튂 湲곕컲 援щ룆 留ㅼ묶 (?쒕쾭?먯꽌 ?ъ슜)
 */
export function isWithinRadius(
  userGeo: { lat: number; lng: number },
  itemGeo: { lat: number; lng: number },
  radiusKm: number = 5
): boolean {
  const distance = calculateDistance(
    userGeo.lat, userGeo.lng,
    itemGeo.lat, itemGeo.lng
  );
  return distance <= radiusKm;
}
