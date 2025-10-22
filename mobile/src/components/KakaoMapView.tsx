import React, { useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { View, StyleSheet } from "react-native";
import WebView, { WebViewMessageEvent, WebViewRef } from "react-native-webview";

export type KakaoMapViewRef = {
  updateMarkers: (markers: Marker[]) => void;
  setCenter: (lat: number, lng: number) => void;
  drawPolyline: (path: { lat: number; lng: number }[]) => void;
  clearPolyline: () => void;
};

export type Marker = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  image?: string;
  desc?: string;
};

type Props = {
  appKey: string;
  center?: { lat: number; lng: number };
  markers?: Marker[];
  onMarkerClick?: (id: string) => void;
  style?: any;
};

const KakaoMapView = forwardRef<KakaoMapViewRef, Props>(
  ({ appKey, center, markers = [], onMarkerClick, style }, ref) => {
    const webViewRef = useRef<WebViewRef>(null);

    // ?몃??먯꽌 ?ъ슜?????덈뒗 硫붿꽌?쒕뱾
    useImperativeHandle(ref, () => ({
      updateMarkers: (newMarkers: Marker[]) => {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "update_markers",
            payload: newMarkers,
          })
        );
      },
      setCenter: (lat: number, lng: number) => {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "set_center",
            lat,
            lng,
          })
        );
      },
      drawPolyline: (path: { lat: number; lng: number }[]) => {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "draw_polyline",
            path,
          })
        );
      },
      clearPolyline: () => {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "clear_polyline",
          })
        );
      },
    }));

    // Kakao Maps JS SDK媛 ?ы븿??HTML
    const html = useMemo(
      () => `<!doctype html>
<html>
<head>
  <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta charset="utf-8">
  <title>Kakao Map</title>
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 16px;
      color: #666;
      z-index: 1000;
    }
  </style>
  <script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services"></script>
</head>
<body>
  <div id="loading" class="loading">吏?꾨? 遺덈윭?ㅻ뒗 以?..</div>
  <div id="map"></div>
  <script>
    // 硫붿떆吏 ?꾩넚 ?⑥닔
    const send = (data) => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    };

    // ?꾩뿭 蹂?섎뱾
    let map;
    let markers = {};
    let polyline = null;
    let isMapReady = false;

    // 吏??珥덇린??    const initMap = () => {
      try {
        map = new kakao.maps.Map(document.getElementById('map'), {
          center: new kakao.maps.LatLng(${center?.lat ?? 37.5665}, ${center?.lng ?? 126.9780}),
          level: 6
        });

        // 濡쒕뵫 ?④린湲?        document.getElementById('loading').style.display = 'none';
        isMapReady = true;
        
        send({ type: 'map_ready' });
      } catch (error) {
        console.error('吏??珥덇린???ㅻ쪟:', error);
        send({ type: 'map_error', error: error.message });
      }
    };

    // 留덉빱 ?ㅼ젙 ?⑥닔
    const setMarkers = (markerList) => {
      if (!map) return;
      
      // 湲곗〈 留덉빱???쒓굅
      Object.values(markers).forEach(marker => marker.setMap(null));
      markers = {};

      // ??留덉빱??異붽?
      markerList.forEach(item => {
        const position = new kakao.maps.LatLng(item.lat, item.lng);
        
        // 留덉빱 ?대?吏 ?ㅼ젙 (?덈뒗 寃쎌슦)
        let markerImage = null;
        if (item.image) {
          markerImage = new kakao.maps.MarkerImage(
            item.image,
            new kakao.maps.Size(32, 32),
            { offset: new kakao.maps.Point(16, 16) }
          );
        }

        const marker = new kakao.maps.Marker({
          position: position,
          title: item.title || item.id,
          image: markerImage
        });

        marker.setMap(map);
        markers[item.id] = marker;

        // 留덉빱 ?대┃ ?대깽??        kakao.maps.event.addListener(marker, 'click', () => {
          send({ type: 'marker_click', id: item.id });
        });

        // ?뺣낫李??ㅼ젙 (?덈뒗 寃쎌슦)
        if (item.desc) {
          const infoWindow = new kakao.maps.InfoWindow({
            content: \`<div style="padding: 10px; min-width: 150px;">
              <strong>\${item.title || item.id}</strong><br/>
              <small>\${item.desc}</small>
            </div>\`
          });

          kakao.maps.event.addListener(marker, 'click', () => {
            infoWindow.open(map, marker);
            send({ type: 'marker_click', id: item.id });
          });
        }
      });

      // 留덉빱媛 ?덉쑝硫?吏??踰붿쐞 議곗젙
      if (markerList.length > 0) {
        const bounds = new kakao.maps.LatLngBounds();
        markerList.forEach(item => {
          bounds.extend(new kakao.maps.LatLng(item.lat, item.lng));
        });
        map.setBounds(bounds);
      }
    };

    // ?대━?쇱씤 洹몃━湲??⑥닔
    const drawPolyline = (path) => {
      if (!map) return;
      
      // 湲곗〈 ?대━?쇱씤 ?쒓굅
      if (polyline) {
        polyline.setMap(null);
      }

      // ???대━?쇱씤 ?앹꽦
      const linePath = path.map(point => new kakao.maps.LatLng(point.lat, point.lng));
      
      polyline = new kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 6,
        strokeColor: '#2E7D32',
        strokeOpacity: 0.8,
        strokeStyle: 'solid'
      });

      polyline.setMap(map);

      // 寃쎈줈??留욊쾶 吏??踰붿쐞 議곗젙
      const bounds = new kakao.maps.LatLngBounds();
      linePath.forEach(point => bounds.extend(point));
      map.setBounds(bounds);
    };

    // ?대━?쇱씤 ?쒓굅 ?⑥닔
    const clearPolyline = () => {
      if (polyline) {
        polyline.setMap(null);
        polyline = null;
      }
    };

    // 硫붿떆吏 ?섏떊 泥섎━
    window.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'update_markers':
            setMarkers(message.payload || []);
            break;
          case 'set_center':
            if (map) {
              map.setCenter(new kakao.maps.LatLng(message.lat, message.lng));
            }
            break;
          case 'draw_polyline':
            drawPolyline(message.path || []);
            break;
          case 'clear_polyline':
            clearPolyline();
            break;
          case 'execute_script':
            try {
              eval(message.script);
            } catch (scriptError) {
              console.error('?ㅽ겕由쏀듃 ?ㅽ뻾 ?ㅻ쪟:', scriptError);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'script_error',
                error: scriptError.message
              }));
            }
            break;
        }
      } catch (error) {
        console.error('硫붿떆吏 泥섎━ ?ㅻ쪟:', error);
      }
    });

    // Kakao Maps SDK 濡쒕뱶 ?꾨즺 ??吏??珥덇린??    if (typeof kakao !== 'undefined') {
      initMap();
      setMarkers(${JSON.stringify(markers)});
    } else {
      // SDK 濡쒕뱶 ?湲?      window.addEventListener('load', () => {
        setTimeout(initMap, 100);
        setTimeout(() => setMarkers(${JSON.stringify(markers)}), 200);
      });
    }
  </script>
</body>
</html>`,
      [appKey, center, markers]
    );

    // WebView 硫붿떆吏 泥섎━
    const onMessage = (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        
        switch (data.type) {
          case "marker_click":
            onMarkerClick?.(data.id);
            break;
          case "map_ready":
            console.log("Kakao 吏??以鍮??꾨즺");
            break;
          case "map_error":
            console.error("吏???ㅻ쪟:", data.error);
            break;
        }
      } catch (error) {
        console.error("硫붿떆吏 ?뚯떛 ?ㅻ쪟:", error);
      }
    };

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html }}
          onMessage={onMessage}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
    );
  }
);

KakaoMapView.displayName = "KakaoMapView";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  webview: {
    flex: 1,
  },
});

export default KakaoMapView;
