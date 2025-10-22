/**
 * ??HeatmapDashboard.tsx
 * Firestore??marketItems / voiceSessions ?„ì¹˜ ?°ì´?°ë? ì§€??Heatmap?¼ë¡œ ?œê°??
 * - ì§€?? Kakao Maps JS SDK (heatmap.js library ?´ì¥)
 * - ?¤ì‹œê°??…ë°?´íŠ¸ (onSnapshot)
 * - ?„í„°: ê¸°ê°„, ?€?? ?œê·¸
 * - AI ë¶„ì„: ?„ì¹˜ ê¸°ë°˜ ?¸ì‚¬?´íŠ¸ ?œê³µ
 */

import React, { useEffect, useRef, useState } from "react";
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  Timestamp,
  orderBy,
  limit 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

declare global {
  interface Window {
    kakao: any;
    HeatmapOverlay: any;
  }
}

type LocationData = { 
  lat: number; 
  lng: number; 
  type: string;
  tags?: string[];
  timestamp?: Date;
  count?: number;
};

type HeatmapStats = {
  totalPoints: number;
  topRegions: Array<{ name: string; count: number }>;
  peakHours: Array<{ hour: number; count: number }>;
  tagDistribution: Array<{ tag: string; count: number }>;
};

export default function HeatmapDashboard() {
  const mapRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  
  // ?íƒœ ê´€ë¦?  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [typeFilter, setTypeFilter] = useState<"all" | "market" | "voice">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "morning" | "afternoon" | "evening" | "night">("all");
  const [heatmapData, setHeatmapData] = useState<LocationData[]>([]);
  const [stats, setStats] = useState<HeatmapStats>({
    totalPoints: 0,
    topRegions: [],
    peakHours: [],
    tagDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [anomalyAlerts, setAnomalyAlerts] = useState<any[]>([]);
  const [anomalyMarkers, setAnomalyMarkers] = useState<any[]>([]);
  const [showForecast, setShowForecast] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [forecastMarkers, setForecastMarkers] = useState<any[]>([]);
  const [forecastCount, setForecastCount] = useState(0);

  // Kakao Maps ì´ˆê¸°??  useEffect(() => {
    if (!mapRef.current) return;

    // Kakao Maps API ë¡œë“œ
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_API_KEY}&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(() => {
        initializeMap();
        initializeHeatmap();
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // ì§€??ì´ˆê¸°??  const initializeMap = () => {
    if (!mapRef.current || !window.kakao) return;

    const mapOption = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780), // ?œìš¸ ì¤‘ì‹¬
      level: 7
    };

    mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, mapOption);

    // ì§€??ì»¨íŠ¸ë¡?ì¶”ê?
    const mapTypeControl = new window.kakao.maps.MapTypeControl();
    mapInstanceRef.current.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

    const zoomControl = new window.kakao.maps.ZoomControl();
    mapInstanceRef.current.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
  };

  // ?ˆíŠ¸ë§?ì´ˆê¸°??  const initializeHeatmap = () => {
    if (!mapInstanceRef.current) return;

    // HeatmapOverlay ?¼ì´ë¸ŒëŸ¬ë¦?ë¡œë“œ
    const heatmapScript = document.createElement("script");
    heatmapScript.src = "https://developers.kakao.com/libs/heatmap/1.3.0/heatmap.min.js";
    heatmapScript.onload = () => {
      heatmapRef.current = new window.HeatmapOverlay(mapInstanceRef.current, {
        radius: 30,
        maxOpacity: 0.8,
        scaleRadius: true,
        useLocalExtrema: true,
        latField: "lat",
        lngField: "lng",
        valueField: "count",
        gradient: {
          0.4: 'blue',
          0.6: 'cyan',
          0.7: 'lime',
          0.8: 'yellow',
          1.0: 'red'
        }
      });
      
      setLoading(false);
      loadHeatmapData();
    };
    document.head.appendChild(heatmapScript);
  };

  // ?°ì´??ë¡œë“œ ë°??¤ì‹œê°?êµ¬ë…
  useEffect(() => {
    if (loading) return;
    loadHeatmapData();
  }, [period, typeFilter, tagFilter, timeFilter, loading]);

  // ?´ìƒ ?ì? ë¡œê·¸ ?¤ì‹œê°?êµ¬ë…
  useEffect(() => {
    if (loading) return;
    loadAnomalyAlerts();
  }, [loading]);

  // ?ˆì¸¡ ?°ì´??ë¡œë“œ
  useEffect(() => {
    if (!showForecast || loading) return;
    loadForecastData();
  }, [showForecast, loading]);

  const loadHeatmapData = () => {
    const now = new Date();
    const since = new Date(now);
    
    // ê¸°ê°„ ?¤ì •
    if (period === "day") since.setDate(now.getDate() - 1);
    if (period === "week") since.setDate(now.getDate() - 7);
    if (period === "month") since.setDate(now.getDate() - 30);

    const sinceTimestamp = Timestamp.fromDate(since);
    const allData: LocationData[] = [];

    // marketItems êµ¬ë…
    const marketQuery = query(
      collection(db, "marketItems"),
      where("createdAt", ">=", sinceTimestamp),
      orderBy("createdAt", "desc")
    );

    const unsubscribeMarket = onSnapshot(marketQuery, (snapshot) => {
      const marketData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          lat: data.location?.latitude || data.geo?.lat,
          lng: data.location?.longitude || data.geo?.lng,
          type: "market",
          tags: data.autoTags || [],
          timestamp: data.createdAt?.toDate(),
          count: 1
        };
      }).filter(item => item.lat && item.lng);

      updateHeatmapData([...allData.filter(d => d.type !== "market"), ...marketData]);
    });

    // voiceSessions êµ¬ë…
    const voiceQuery = query(
      collection(db, "voiceSessions"),
      where("createdAt", ">=", sinceTimestamp),
      orderBy("createdAt", "desc")
    );

    const unsubscribeVoice = onSnapshot(voiceQuery, (snapshot) => {
      const voiceData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          lat: data.geo?.lat || data.location?.latitude,
          lng: data.geo?.lng || data.location?.longitude,
          type: "voice",
          tags: [],
          timestamp: data.createdAt?.toDate(),
          count: 1
        };
      }).filter(item => item.lat && item.lng);

      updateHeatmapData([...allData.filter(d => d.type !== "voice"), ...voiceData]);
    });

    return () => {
      unsubscribeMarket();
      unsubscribeVoice();
    };
  };

  // ?ˆíŠ¸ë§??°ì´???…ë°?´íŠ¸
  const updateHeatmapData = (data: LocationData[]) => {
    let filteredData = [...data];

    // ?€???„í„°
    if (typeFilter !== "all") {
      filteredData = filteredData.filter(d => d.type === typeFilter);
    }

    // ?œê·¸ ?„í„°
    if (tagFilter !== "all") {
      filteredData = filteredData.filter(d => 
        d.tags?.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()))
      );
    }

    // ?œê°„ ?„í„°
    if (timeFilter !== "all") {
      filteredData = filteredData.filter(d => {
        if (!d.timestamp) return false;
        const hour = d.timestamp.getHours();
        switch (timeFilter) {
          case "morning": return hour >= 6 && hour < 12;
          case "afternoon": return hour >= 12 && hour < 18;
          case "evening": return hour >= 18 && hour < 22;
          case "night": return hour >= 22 || hour < 6;
          default: return true;
        }
      });
    }

    setHeatmapData(filteredData);
    updateHeatmap(filteredData);
    updateStats(filteredData);
  };

  // ?ˆíŠ¸ë§??…ë°?´íŠ¸
  const updateHeatmap = (data: LocationData[]) => {
    if (!heatmapRef.current || !data.length) return;

    // ?„ì¹˜ë³?ì§‘ê³„ (ê°™ì? ?„ì¹˜???°ì´???©ì‚°)
    const aggregatedData = data.reduce((acc, item) => {
      const key = `${item.lat.toFixed(4)},${item.lng.toFixed(4)}`;
      if (!acc[key]) {
        acc[key] = { ...item, count: 0 };
      }
      acc[key].count += item.count || 1;
      return acc;
    }, {} as Record<string, LocationData>);

    const heatmapData = Object.values(aggregatedData).map(item => ({
      lat: item.lat,
      lng: item.lng,
      count: item.count
    }));

    heatmapRef.current.setData({ data: heatmapData });
  };

  // ?µê³„ ?…ë°?´íŠ¸
  const updateStats = (data: LocationData[]) => {
    // ?„ì²´ ????    const totalPoints = data.length;

    // ì§€??³„ ì§‘ê³„ (ê°„ë‹¨??ê·¸ë¦¬??ê¸°ë°˜)
    const regionCounts: Record<string, number> = {};
    data.forEach(item => {
      const gridLat = Math.floor(item.lat * 100) / 100;
      const gridLng = Math.floor(item.lng * 100) / 100;
      const key = `${gridLat},${gridLng}`;
      regionCounts[key] = (regionCounts[key] || 0) + 1;
    });

    const topRegions = Object.entries(regionCounts)
      .map(([region, count]) => ({ name: region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ?œê°„?€ë³?ì§‘ê³„
    const hourCounts: Record<number, number> = {};
    data.forEach(item => {
      if (item.timestamp) {
        const hour = item.timestamp.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ?œê·¸ë³?ì§‘ê³„
    const tagCounts: Record<string, number> = {};
    data.forEach(item => {
      item.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const tagDistribution = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setStats({
      totalPoints,
      topRegions,
      peakHours,
      tagDistribution
    });

    // AI ?¸ì‚¬?´íŠ¸ ?ì„±
    generateAIInsights({ totalPoints, topRegions, peakHours, tagDistribution });
  };

  // ?´ìƒ ?ì? ?Œë¦¼ ë¡œë“œ
  const loadAnomalyAlerts = () => {
    const anomalyQuery = query(
      collection(db, "anomalyLogs"),
      orderBy("detectedAt", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(anomalyQuery, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        detectedAt: doc.data().detectedAt?.toDate()
      }));
      
      setAnomalyAlerts(alerts);
      updateAnomalyMarkers(alerts);
    });

    return unsubscribe;
  };

  // ?´ìƒ ?ì? ë§ˆì»¤ ?…ë°?´íŠ¸
  const updateAnomalyMarkers = (alerts: any[]) => {
    if (!mapInstanceRef.current || !window.kakao) return;

    // ê¸°ì¡´ ë§ˆì»¤ ?œê±°
    anomalyMarkers.forEach(marker => marker.setMap(null));
    setAnomalyMarkers([]);

    // ìµœì‹  ?´ìƒ ?ì? ê²°ê³¼ë§??œì‹œ
    const latestAlert = alerts[0];
    if (!latestAlert?.anomalies?.length) return;

    const newMarkers: any[] = [];

    latestAlert.anomalies.forEach((anomaly: any) => {
      const severityColors = {
        critical: '#FF0000',  // ë¹¨ê°•
        high: '#FF6B35',      // ì£¼í™©
        medium: '#FFD93D',    // ?¸ë‘
        low: '#6BCF7F'        // ì´ˆë¡
      };

      const severityIcons = {
        critical: '?š¨',
        high: '? ï¸',
        medium: '??,
        low: '?“ˆ'
      };

      const color = severityColors[anomaly.severity as keyof typeof severityColors] || '#FF0000';
      const icon = severityIcons[anomaly.severity as keyof typeof severityIcons] || '?š¨';

      // ì»¤ìŠ¤?€ ?¤ë²„?ˆì´ ?ì„±
      const markerContent = `
        <div style="
          background: ${color};
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
          min-width: 80px;
          text-align: center;
        ">
          ${icon} ${anomaly.count}ê±?          <div style="font-size: 10px; margin-top: 2px;">
            ${anomaly.type}
          </div>
          <div style="font-size: 10px; margin-top: 2px;">
            ${(anomaly.ratio * 100).toFixed(0)}% ì¦ê?
          </div>
        </div>
      `;

      const marker = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(anomaly.lat, anomaly.lng),
        content: markerContent,
        yAnchor: 1.2,
        xAnchor: 0.5
      });

      marker.setMap(mapInstanceRef.current);
      newMarkers.push(marker);

      // ?´ë¦­ ?´ë²¤??ì¶”ê?
      marker.getElement().addEventListener('click', () => {
        showAnomalyDetails(anomaly, latestAlert.analysis);
      });
    });

    setAnomalyMarkers(newMarkers);
  };

  // ?´ìƒ ?ì? ?ì„¸ ?•ë³´ ?œì‹œ
  const showAnomalyDetails = (anomaly: any, analysis: string) => {
    const detailContent = `
      <div style="
        background: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      ">
        <h3 style="margin: 0 0 12px 0; color: #333; font-size: 16px;">
          ?š¨ ?´ìƒ ?ì? ?ì„¸
        </h3>
        <div style="margin-bottom: 8px;">
          <strong>?„ì¹˜:</strong> ${anomaly.location}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>?€??</strong> ${anomaly.type}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>ìµœê·¼ 1?œê°„:</strong> ${anomaly.recentCount}ê±?        </div>
        <div style="margin-bottom: 8px;">
          <strong>ì£¼ê°„ ?‰ê· :</strong> ${anomaly.weekAverage.toFixed(1)}ê±?        </div>
        <div style="margin-bottom: 8px;">
          <strong>ì¦ê???</strong> ${(anomaly.ratio * 100).toFixed(0)}%
        </div>
        <div style="margin-bottom: 12px;">
          <strong>?¬ê°??</strong> 
          <span style="
            background: ${anomaly.severity === 'critical' ? '#FF0000' : 
                        anomaly.severity === 'high' ? '#FF6B35' :
                        anomaly.severity === 'medium' ? '#FFD93D' : '#6BCF7F'};
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            margin-left: 4px;
          ">
            ${anomaly.severity.toUpperCase()}
          </span>
        </div>
        <div style="
          background: #f5f5f5;
          padding: 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
        ">
          <strong>AI ë¶„ì„:</strong><br/>
          ${analysis}
        </div>
      </div>
    `;

    // InfoWindow ?œì‹œ
    const infoWindow = new window.kakao.maps.InfoWindow({
      content: detailContent,
      removable: true
    });

    infoWindow.open(mapInstanceRef.current, 
      new window.kakao.maps.LatLng(anomaly.lat, anomaly.lng)
    );
  };

  // ?ˆì¸¡ ?°ì´??ë¡œë“œ
  const loadForecastData = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const targetDate = tomorrow.toISOString().slice(0, 10);

      console.log(`?”® ?ˆì¸¡ ?°ì´??ë¡œë“œ: ${targetDate}`);

      const forecastSnap = await getDocs(collection(db, "forecasts", targetDate, "cells"));
      const forecasts = forecastSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setForecastData(forecasts);
      setForecastCount(forecasts.length);
      updateForecastMarkers(forecasts);

      console.log(`???ˆì¸¡ ?°ì´??ë¡œë“œ ?„ë£Œ: ${forecasts.length}ê°??€`);

    } catch (error) {
      console.error("???ˆì¸¡ ?°ì´??ë¡œë“œ ?¤ë¥˜:", error);
    }
  };

  // ?ˆì¸¡ ë§ˆì»¤ ?…ë°?´íŠ¸
  const updateForecastMarkers = (forecasts: any[]) => {
    if (!mapInstanceRef.current || !window.kakao) return;

    // ê¸°ì¡´ ?ˆì¸¡ ë§ˆì»¤ ?œê±°
    forecastMarkers.forEach(marker => marker.setMap(null));
    setForecastMarkers([]);

    if (forecasts.length === 0) return;

    const newMarkers: any[] = [];

    forecasts.forEach((forecast) => {
      // ?ˆì¸¡ê°’ì— ?°ë¥¸ ?‰ìƒ ê²°ì •
      const getForecastColor = (yhat: number) => {
        if (yhat >= 50) return '#FF0000';      // ë¹¨ê°• - ë§¤ìš° ?’ìŒ
        if (yhat >= 30) return '#FF6B35';      // ì£¼í™© - ?’ìŒ
        if (yhat >= 15) return '#FFD93D';      // ?¸ë‘ - ë³´í†µ
        if (yhat >= 5) return '#6BCF7F';       // ì´ˆë¡ - ??Œ
        return '#E0E0E0';                      // ?Œìƒ‰ - ë§¤ìš° ??Œ
      };

      const getForecastIcon = (yhat: number) => {
        if (yhat >= 50) return '?”¥';           // ë§¤ìš° ?’ìŒ
        if (yhat >= 30) return '??;           // ?’ìŒ
        if (yhat >= 15) return '?“ˆ';           // ë³´í†µ
        if (yhat >= 5) return '?“';            // ??Œ
        return '?”¹';                           // ë§¤ìš° ??Œ
      };

      const color = getForecastColor(forecast.yhat);
      const icon = getForecastIcon(forecast.yhat);

      // ?ˆì¸¡ ë§ˆì»¤ ?ì„±
      const markerContent = `
        <div style="
          background: ${color};
          color: white;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          border: 2px solid white;
          min-width: 80px;
          text-align: center;
          position: relative;
        ">
          <div style="font-size: 14px; margin-bottom: 2px;">${icon}</div>
          <div style="font-size: 11px;">${Math.round(forecast.yhat)}</div>
          <div style="font-size: 9px; opacity: 0.9;">
            ?´ì¼ ?ˆì¸¡
          </div>
          <div style="
            position: absolute;
            top: -5px;
            right: -5px;
            background: rgba(255,255,255,0.9);
            color: #333;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            font-weight: bold;
          ">
            ?”®
          </div>
        </div>
      `;

      const marker = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(forecast.lat, forecast.lng),
        content: markerContent,
        yAnchor: 1.2,
        xAnchor: 0.5
      });

      marker.setMap(mapInstanceRef.current);
      newMarkers.push(marker);

      // ?´ë¦­ ?´ë²¤??ì¶”ê?
      marker.getElement().addEventListener('click', () => {
        showForecastDetails(forecast);
      });
    });

    setForecastMarkers(newMarkers);
  };

  // ?ˆì¸¡ ?ì„¸ ?•ë³´ ?œì‹œ
  const showForecastDetails = (forecast: any) => {
    const getTrendIcon = (trend: string) => {
      switch (trend) {
        case 'increasing': return '?“ˆ';
        case 'decreasing': return '?“‰';
        case 'stable': return '?¡ï¸';
        default: return '??;
      }
    };

    const getQualityColor = (quality: string) => {
      switch (quality) {
        case 'good': return '#4CAF50';
        case 'fair': return '#FF9800';
        case 'poor': return '#F44336';
        default: return '#9E9E9E';
      }
    };

    const detailContent = `
      <div style="
        background: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        max-width: 320px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      ">
        <div style="
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #f0f0f0;
        ">
          <span style="font-size: 20px; margin-right: 8px;">?”®</span>
          <h3 style="margin: 0; color: #333; font-size: 16px;">
            ?´ì¼ ?œë™???ˆì¸¡
          </h3>
        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>?„ì¹˜:</strong> ${forecast.lat.toFixed(4)}, ${forecast.lng.toFixed(4)}
        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>?ˆì¸¡ê°?</strong> 
          <span style="
            background: ${forecast.yhat >= 30 ? '#FF6B35' : forecast.yhat >= 15 ? '#FFD93D' : '#6BCF7F'};
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: bold;
            margin-left: 4px;
          ">
            ${Math.round(forecast.yhat)}ê±?          </span>
        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>? ë¢°êµ¬ê°„:</strong> ${Math.round(forecast.yhat_lower)} ~ ${Math.round(forecast.yhat_upper)}ê±?        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>?¸ë Œ??</strong> 
          <span style="margin-left: 4px;">
            ${getTrendIcon(forecast.trend)} ${forecast.trend === 'increasing' ? 'ì¦ê?' : 
                                               forecast.trend === 'decreasing' ? 'ê°ì†Œ' : '?ˆì •'}
          </span>
        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>?°ì´???ˆì§ˆ:</strong> 
          <span style="
            background: ${getQualityColor(forecast.data_quality)};
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            margin-left: 4px;
          ">
            ${forecast.data_quality === 'good' ? '?°ìˆ˜' : 
              forecast.data_quality === 'fair' ? 'ë³´í†µ' : 'ë¶€ì¡?}
          </span>
        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>ëª¨ë¸:</strong> ${forecast.model_used}
        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>? ë¢°??</strong> ${Math.round(forecast.confidence * 100)}%
        </div>
        
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 8px;
          border-radius: 8px;
          margin-top: 12px;
          text-align: center;
          font-size: 12px;
        ">
          <div style="font-weight: bold; margin-bottom: 4px;">?’¡ AI ?¸ì‚¬?´íŠ¸</div>
          <div>
            ${forecast.yhat >= 30 ? 'ë§¤ìš° ?œë°œ???œë™???ˆìƒ?©ë‹ˆ?? ?œë²„ ë¦¬ì†Œ?¤ë? ë¯¸ë¦¬ ì¤€ë¹„í•˜?¸ìš”.' :
              forecast.yhat >= 15 ? 'ë³´í†µ ?˜ì????œë™???ˆìƒ?©ë‹ˆ?? ëª¨ë‹ˆ?°ë§??ê°•í™”?˜ì„¸??' :
              '??? ?œë™?‰ì´ ?ˆìƒ?©ë‹ˆ?? ?¤ë¥¸ ì§€??— ì§‘ì¤‘?˜ì„¸??'}
          </div>
        </div>
      </div>
    `;

    // InfoWindow ?œì‹œ
    const infoWindow = new window.kakao.maps.InfoWindow({
      content: detailContent,
      removable: true
    });

    infoWindow.open(mapInstanceRef.current, 
      new window.kakao.maps.LatLng(forecast.lat, forecast.lng)
    );
  };

  // AI ?¸ì‚¬?´íŠ¸ ?ì„±
  const generateAIInsights = async (statsData: HeatmapStats) => {
    try {
      const prompt = `
?¤ìŒ?€ ?¼ê³  ë¹„ì„œ???„ì¹˜ ê¸°ë°˜ ?œë™ ?°ì´?°ì…?ˆë‹¤:

?“Š ê¸°ë³¸ ?µê³„:
- ì´??œë™ ì§€?? ${statsData.totalPoints}ê°?- ë¶„ì„ ê¸°ê°„: ${period === "day" ? "?¤ëŠ˜" : period === "week" ? "ìµœê·¼ 7?? : "ìµœê·¼ 30??}

?† ?ìœ„ ?œë™ ì§€??
${statsData.topRegions.map((region, i) => `${i + 1}. ${region.name}: ${region.count}ê±?).join('\n')}

???¼í¬ ?œê°„?€:
${statsData.peakHours.map(hour => `${hour.hour}?? ${hour.count}ê±?).join('\n')}

?·ï¸??¸ê¸° ?œê·¸:
${statsData.tagDistribution.map(tag => `- ${tag.tag}: ${tag.count}ê±?).join('\n')}

???°ì´?°ë? ë°”íƒ•?¼ë¡œ ê´€ë¦¬ì???„ì¹˜ ê¸°ë°˜ ?¸ì‚¬?´íŠ¸ë¥?100???´ë‚´ë¡??‘ì„±?´ì£¼?¸ìš”.
?œë°œ??ì§€?? ?œê°„?€, ?¸ë Œ?œë? ì¤‘ì‹¬?¼ë¡œ ?”ì•½?´ì£¼?¸ìš”.
`;

      // OpenAI API ?¸ì¶œ (?¤ì œ êµ¬í˜„?ì„œ??Firebase Function ?¬ìš©)
      // ?„ì‹œë¡?ê°„ë‹¨???¸ì‚¬?´íŠ¸ ?ì„±
      const topRegion = statsData.topRegions[0];
      const peakHour = statsData.peakHours[0];
      const topTag = statsData.tagDistribution[0];

      let insight = "";
      if (topRegion) {
        insight += `ê°€???œë°œ??ì§€??? ${topRegion.name} (${topRegion.count}ê±??´ë©°, `;
      }
      if (peakHour) {
        insight += `${peakHour.hour}?œì— ?œë™??ìµœê³ ì¡°ì— ?¬í–ˆ?µë‹ˆ?? `;
      }
      if (topTag) {
        insight += `'${topTag.tag}' ê´€???œë™??${topTag.count}ê±´ìœ¼ë¡?ê°€??ë§ì•˜?µë‹ˆ??`;
      }

      setAiInsights(insight || "?œë™ ?°ì´?°ë? ë¶„ì„ ì¤‘ì…?ˆë‹¤.");

    } catch (error) {
      console.error("AI ?¸ì‚¬?´íŠ¸ ?ì„± ?¤ë¥˜:", error);
      setAiInsights("?¸ì‚¬?´íŠ¸ ?ì„± ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  };

  const getTimeFilterLabel = (filter: string) => {
    switch (filter) {
      case "morning": return "?Œ… ?¤ì „ (6-12??";
      case "afternoon": return "?€ï¸??¤í›„ (12-18??";
      case "evening": return "?Œ† ?€??(18-22??";
      case "night": return "?Œ™ ë°?(22-6??";
      default: return "?• ?„ì²´ ?œê°„";
    }
  };

  const getTagFilterLabel = (filter: string) => {
    if (filter === "all") return "?·ï¸??„ì²´ ?œê·¸";
    return `?·ï¸?${filter}`;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* ì§€???ì—­ */}
      <div className="w-3/4 h-full relative">
        <div ref={mapRef} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">ì§€??ë¡œë”© ì¤?..</p>
            </div>
          </div>
        )}
        
        {/* ì§€???¤ë²„?ˆì´ ?•ë³´ */}
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
          <div className="text-sm font-semibold text-gray-700">
            ?”¥ ì´?{stats.totalPoints}ê°??œë™ ì§€??          </div>
          <div className="text-xs text-gray-500 mt-1">
            {period === "day" ? "?¤ëŠ˜" : period === "week" ? "ìµœê·¼ 7?? : "ìµœê·¼ 30??} ê¸°ì?
          </div>
        </div>
      </div>

      {/* ?¬ì´?œë°” */}
      <div className="w-1/4 bg-white border-l flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">?Œ ?„ì¹˜ ?ˆíŠ¸ë§?/h1>
          <p className="text-sm text-gray-600 mt-1">
            ?¤ì‹œê°??œë™ ì§€???œê°??          </p>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* ?„í„° ?¤ì • */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700">?”§ ?„í„° ?¤ì •</h3>
            
            {/* ê¸°ê°„ ?„í„° */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ê¸°ê°„</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="day">?“… ?¤ëŠ˜</option>
                <option value="week">?“Š ìµœê·¼ 7??/option>
                <option value="month">?“ˆ ìµœê·¼ 30??/option>
              </select>
            </div>

            {/* ?€???„í„° */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">?€??/label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">?”„ ?„ì²´</option>
                <option value="market">?›’ ?í’ˆ ?±ë¡</option>
                <option value="voice">?™ï¸??Œì„± ?¸ì…˜</option>
              </select>
            </div>

            {/* ?œê°„ ?„í„° */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">?œê°„?€</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">?• ?„ì²´ ?œê°„</option>
                <option value="morning">?Œ… ?¤ì „ (6-12??</option>
                <option value="afternoon">?€ï¸??¤í›„ (12-18??</option>
                <option value="evening">?Œ† ?€??(18-22??</option>
                <option value="night">?Œ™ ë°?(22-6??</option>
              </select>
            </div>

            {/* ?œê·¸ ?„í„° */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">?œê·¸</label>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">?·ï¸??„ì²´ ?œê·¸</option>
                <option value="ì¶•êµ¬">??ì¶•êµ¬</option>
                <option value="?¼êµ¬">???¼êµ¬</option>
                <option value="?êµ¬">?? ?êµ¬</option>
                <option value="ë°°ë“œë¯¼í„´">?¸ ë°°ë“œë¯¼í„´</option>
                <option value="?Œë‹ˆ??>?¾ ?Œë‹ˆ??/option>
                <option value="? ì†Œ??>?‘¶ ? ì†Œ??/option>
              </select>
            </div>

            {/* ?ˆì¸¡ ?ˆì´??? ê? */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">?ˆì´??/label>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={showForecast} 
                  onChange={(e) => setShowForecast(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">?”® ?´ì¼ ?ˆì¸¡ Â· {forecastCount}?€</span>
              </div>
            </div>
          </div>

          {/* AI ?¸ì‚¬?´íŠ¸ */}
          {aiInsights && (
            <div className="bg-blue-50 rounded-lg p-3">
              <h3 className="font-semibold text-blue-800 mb-2">?§  AI ?¸ì‚¬?´íŠ¸</h3>
              <p className="text-sm text-blue-700">{aiInsights}</p>
            </div>
          )}

          {/* ?´ìƒ ?ì? ?Œë¦¼ */}
          {anomalyAlerts.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3">
              <h3 className="font-semibold text-red-800 mb-2">?š¨ ?´ìƒ ?ì?</h3>
              <div className="space-y-2">
                {anomalyAlerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium text-red-700">
                      {alert.detectedAt?.toLocaleTimeString()}
                    </div>
                    <div className="text-red-600">
                      {alert.summary?.totalAnomalies || 0}ê°??´ìƒ ?ì?
                    </div>
                    {alert.summary?.criticalCount > 0 && (
                      <div className="text-xs text-red-500">
                        Critical: {alert.summary.criticalCount}ê°?                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => alert('?´ìƒ ?ì? ?ì„¸??ì§€?„ì˜ ?š¨ ë§ˆì»¤ë¥??´ë¦­?˜ì„¸??')}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                ?ì„¸ ë³´ê¸° ??              </button>
            </div>
          )}

          {/* ?ìœ„ ì§€??*/}
          {stats.topRegions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">?† ?ìœ„ ?œë™ ì§€??/h3>
              <div className="space-y-1">
                {stats.topRegions.map((region, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">#{index + 1} {region.name}</span>
                    <span className="font-semibold text-blue-600">{region.count}ê±?/span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ?¼í¬ ?œê°„?€ */}
          {stats.peakHours.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">???¼í¬ ?œê°„?€</h3>
              <div className="space-y-1">
                {stats.peakHours.map((hour, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{hour.hour}??/span>
                    <span className="font-semibold text-green-600">{hour.count}ê±?/span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ?¸ê¸° ?œê·¸ */}
          {stats.tagDistribution.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">?·ï¸??¸ê¸° ?œê·¸</h3>
              <div className="space-y-1">
                {stats.tagDistribution.slice(0, 5).map((tag, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{tag.tag}</span>
                    <span className="font-semibold text-purple-600">{tag.count}ê±?/span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ë²”ë? */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-semibold text-gray-700 mb-2">?¨ ?ˆíŠ¸ë§?ë²”ë?</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span>??? ?œë™??/span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                <span>ì¤‘ê°„ ?œë™??/span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                <span>?’ì? ?œë™??/span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
