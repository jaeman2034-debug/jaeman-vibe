/**
 * ??HeatmapDashboard.tsx
 * Firestore??marketItems / voiceSessions ?�치 ?�이?��? 지??Heatmap?�로 ?�각??
 * - 지?? Kakao Maps JS SDK (heatmap.js library ?�장)
 * - ?�시�??�데?�트 (onSnapshot)
 * - ?�터: 기간, ?�?? ?�그
 * - AI 분석: ?�치 기반 ?�사?�트 ?�공
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
  
  // ?�태 관�?  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
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

  // Kakao Maps 초기??  useEffect(() => {
    if (!mapRef.current) return;

    // Kakao Maps API 로드
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

  // 지??초기??  const initializeMap = () => {
    if (!mapRef.current || !window.kakao) return;

    const mapOption = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780), // ?�울 중심
      level: 7
    };

    mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, mapOption);

    // 지??컨트�?추�?
    const mapTypeControl = new window.kakao.maps.MapTypeControl();
    mapInstanceRef.current.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

    const zoomControl = new window.kakao.maps.ZoomControl();
    mapInstanceRef.current.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
  };

  // ?�트�?초기??  const initializeHeatmap = () => {
    if (!mapInstanceRef.current) return;

    // HeatmapOverlay ?�이브러�?로드
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

  // ?�이??로드 �??�시�?구독
  useEffect(() => {
    if (loading) return;
    loadHeatmapData();
  }, [period, typeFilter, tagFilter, timeFilter, loading]);

  // ?�상 ?��? 로그 ?�시�?구독
  useEffect(() => {
    if (loading) return;
    loadAnomalyAlerts();
  }, [loading]);

  // ?�측 ?�이??로드
  useEffect(() => {
    if (!showForecast || loading) return;
    loadForecastData();
  }, [showForecast, loading]);

  const loadHeatmapData = () => {
    const now = new Date();
    const since = new Date(now);
    
    // 기간 ?�정
    if (period === "day") since.setDate(now.getDate() - 1);
    if (period === "week") since.setDate(now.getDate() - 7);
    if (period === "month") since.setDate(now.getDate() - 30);

    const sinceTimestamp = Timestamp.fromDate(since);
    const allData: LocationData[] = [];

    // marketItems 구독
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

    // voiceSessions 구독
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

  // ?�트�??�이???�데?�트
  const updateHeatmapData = (data: LocationData[]) => {
    let filteredData = [...data];

    // ?�???�터
    if (typeFilter !== "all") {
      filteredData = filteredData.filter(d => d.type === typeFilter);
    }

    // ?�그 ?�터
    if (tagFilter !== "all") {
      filteredData = filteredData.filter(d => 
        d.tags?.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()))
      );
    }

    // ?�간 ?�터
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

  // ?�트�??�데?�트
  const updateHeatmap = (data: LocationData[]) => {
    if (!heatmapRef.current || !data.length) return;

    // ?�치�?집계 (같�? ?�치???�이???�산)
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

  // ?�계 ?�데?�트
  const updateStats = (data: LocationData[]) => {
    // ?�체 ????    const totalPoints = data.length;

    // 지??�� 집계 (간단??그리??기반)
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

    // ?�간?��?집계
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

    // ?�그�?집계
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

    // AI ?�사?�트 ?�성
    generateAIInsights({ totalPoints, topRegions, peakHours, tagDistribution });
  };

  // ?�상 ?��? ?�림 로드
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

  // ?�상 ?��? 마커 ?�데?�트
  const updateAnomalyMarkers = (alerts: any[]) => {
    if (!mapInstanceRef.current || !window.kakao) return;

    // 기존 마커 ?�거
    anomalyMarkers.forEach(marker => marker.setMap(null));
    setAnomalyMarkers([]);

    // 최신 ?�상 ?��? 결과�??�시
    const latestAlert = alerts[0];
    if (!latestAlert?.anomalies?.length) return;

    const newMarkers: any[] = [];

    latestAlert.anomalies.forEach((anomaly: any) => {
      const severityColors = {
        critical: '#FF0000',  // 빨강
        high: '#FF6B35',      // 주황
        medium: '#FFD93D',    // ?�랑
        low: '#6BCF7F'        // 초록
      };

      const severityIcons = {
        critical: '?��',
        high: '?�️',
        medium: '??,
        low: '?��'
      };

      const color = severityColors[anomaly.severity as keyof typeof severityColors] || '#FF0000';
      const icon = severityIcons[anomaly.severity as keyof typeof severityIcons] || '?��';

      // 커스?� ?�버?�이 ?�성
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
          ${icon} ${anomaly.count}�?          <div style="font-size: 10px; margin-top: 2px;">
            ${anomaly.type}
          </div>
          <div style="font-size: 10px; margin-top: 2px;">
            ${(anomaly.ratio * 100).toFixed(0)}% 증�?
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

      // ?�릭 ?�벤??추�?
      marker.getElement().addEventListener('click', () => {
        showAnomalyDetails(anomaly, latestAlert.analysis);
      });
    });

    setAnomalyMarkers(newMarkers);
  };

  // ?�상 ?��? ?�세 ?�보 ?�시
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
          ?�� ?�상 ?��? ?�세
        </h3>
        <div style="margin-bottom: 8px;">
          <strong>?�치:</strong> ${anomaly.location}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>?�??</strong> ${anomaly.type}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>최근 1?�간:</strong> ${anomaly.recentCount}�?        </div>
        <div style="margin-bottom: 8px;">
          <strong>주간 ?�균:</strong> ${anomaly.weekAverage.toFixed(1)}�?        </div>
        <div style="margin-bottom: 8px;">
          <strong>증�???</strong> ${(anomaly.ratio * 100).toFixed(0)}%
        </div>
        <div style="margin-bottom: 12px;">
          <strong>?�각??</strong> 
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
          <strong>AI 분석:</strong><br/>
          ${analysis}
        </div>
      </div>
    `;

    // InfoWindow ?�시
    const infoWindow = new window.kakao.maps.InfoWindow({
      content: detailContent,
      removable: true
    });

    infoWindow.open(mapInstanceRef.current, 
      new window.kakao.maps.LatLng(anomaly.lat, anomaly.lng)
    );
  };

  // ?�측 ?�이??로드
  const loadForecastData = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const targetDate = tomorrow.toISOString().slice(0, 10);

      console.log(`?�� ?�측 ?�이??로드: ${targetDate}`);

      const forecastSnap = await getDocs(collection(db, "forecasts", targetDate, "cells"));
      const forecasts = forecastSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setForecastData(forecasts);
      setForecastCount(forecasts.length);
      updateForecastMarkers(forecasts);

      console.log(`???�측 ?�이??로드 ?�료: ${forecasts.length}�??�`);

    } catch (error) {
      console.error("???�측 ?�이??로드 ?�류:", error);
    }
  };

  // ?�측 마커 ?�데?�트
  const updateForecastMarkers = (forecasts: any[]) => {
    if (!mapInstanceRef.current || !window.kakao) return;

    // 기존 ?�측 마커 ?�거
    forecastMarkers.forEach(marker => marker.setMap(null));
    setForecastMarkers([]);

    if (forecasts.length === 0) return;

    const newMarkers: any[] = [];

    forecasts.forEach((forecast) => {
      // ?�측값에 ?�른 ?�상 결정
      const getForecastColor = (yhat: number) => {
        if (yhat >= 50) return '#FF0000';      // 빨강 - 매우 ?�음
        if (yhat >= 30) return '#FF6B35';      // 주황 - ?�음
        if (yhat >= 15) return '#FFD93D';      // ?�랑 - 보통
        if (yhat >= 5) return '#6BCF7F';       // 초록 - ??��
        return '#E0E0E0';                      // ?�색 - 매우 ??��
      };

      const getForecastIcon = (yhat: number) => {
        if (yhat >= 50) return '?��';           // 매우 ?�음
        if (yhat >= 30) return '??;           // ?�음
        if (yhat >= 15) return '?��';           // 보통
        if (yhat >= 5) return '?��';            // ??��
        return '?��';                           // 매우 ??��
      };

      const color = getForecastColor(forecast.yhat);
      const icon = getForecastIcon(forecast.yhat);

      // ?�측 마커 ?�성
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
            ?�일 ?�측
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
            ?��
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

      // ?�릭 ?�벤??추�?
      marker.getElement().addEventListener('click', () => {
        showForecastDetails(forecast);
      });
    });

    setForecastMarkers(newMarkers);
  };

  // ?�측 ?�세 ?�보 ?�시
  const showForecastDetails = (forecast: any) => {
    const getTrendIcon = (trend: string) => {
      switch (trend) {
        case 'increasing': return '?��';
        case 'decreasing': return '?��';
        case 'stable': return '?�️';
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
          <span style="font-size: 20px; margin-right: 8px;">?��</span>
          <h3 style="margin: 0; color: #333; font-size: 16px;">
            ?�일 ?�동???�측
          </h3>
        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>?�치:</strong> ${forecast.lat.toFixed(4)}, ${forecast.lng.toFixed(4)}
        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>?�측�?</strong> 
          <span style="
            background: ${forecast.yhat >= 30 ? '#FF6B35' : forecast.yhat >= 15 ? '#FFD93D' : '#6BCF7F'};
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: bold;
            margin-left: 4px;
          ">
            ${Math.round(forecast.yhat)}�?          </span>
        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>?�뢰구간:</strong> ${Math.round(forecast.yhat_lower)} ~ ${Math.round(forecast.yhat_upper)}�?        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>?�렌??</strong> 
          <span style="margin-left: 4px;">
            ${getTrendIcon(forecast.trend)} ${forecast.trend === 'increasing' ? '증�?' : 
                                               forecast.trend === 'decreasing' ? '감소' : '?�정'}
          </span>
        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>?�이???�질:</strong> 
          <span style="
            background: ${getQualityColor(forecast.data_quality)};
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            margin-left: 4px;
          ">
            ${forecast.data_quality === 'good' ? '?�수' : 
              forecast.data_quality === 'fair' ? '보통' : '부�?}
          </span>
        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>모델:</strong> ${forecast.model_used}
        </div>
        
        <div style="margin-bottom: 8px;">
          <strong>?�뢰??</strong> ${Math.round(forecast.confidence * 100)}%
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
          <div style="font-weight: bold; margin-bottom: 4px;">?�� AI ?�사?�트</div>
          <div>
            ${forecast.yhat >= 30 ? '매우 ?�발???�동???�상?�니?? ?�버 리소?��? 미리 준비하?�요.' :
              forecast.yhat >= 15 ? '보통 ?��????�동???�상?�니?? 모니?�링??강화?�세??' :
              '??? ?�동?�이 ?�상?�니?? ?�른 지??�� 집중?�세??'}
          </div>
        </div>
      </div>
    `;

    // InfoWindow ?�시
    const infoWindow = new window.kakao.maps.InfoWindow({
      content: detailContent,
      removable: true
    });

    infoWindow.open(mapInstanceRef.current, 
      new window.kakao.maps.LatLng(forecast.lat, forecast.lng)
    );
  };

  // AI ?�사?�트 ?�성
  const generateAIInsights = async (statsData: HeatmapStats) => {
    try {
      const prompt = `
?�음?� ?�고 비서???�치 기반 ?�동 ?�이?�입?�다:

?�� 기본 ?�계:
- �??�동 지?? ${statsData.totalPoints}�?- 분석 기간: ${period === "day" ? "?�늘" : period === "week" ? "최근 7?? : "최근 30??}

?�� ?�위 ?�동 지??
${statsData.topRegions.map((region, i) => `${i + 1}. ${region.name}: ${region.count}�?).join('\n')}

???�크 ?�간?�:
${statsData.peakHours.map(hour => `${hour.hour}?? ${hour.count}�?).join('\n')}

?���??�기 ?�그:
${statsData.tagDistribution.map(tag => `- ${tag.tag}: ${tag.count}�?).join('\n')}

???�이?��? 바탕?�로 관리자???�치 기반 ?�사?�트�?100???�내�??�성?�주?�요.
?�발??지?? ?�간?�, ?�렌?��? 중심?�로 ?�약?�주?�요.
`;

      // OpenAI API ?�출 (?�제 구현?�서??Firebase Function ?�용)
      // ?�시�?간단???�사?�트 ?�성
      const topRegion = statsData.topRegions[0];
      const peakHour = statsData.peakHours[0];
      const topTag = statsData.tagDistribution[0];

      let insight = "";
      if (topRegion) {
        insight += `가???�발??지??? ${topRegion.name} (${topRegion.count}�??�며, `;
      }
      if (peakHour) {
        insight += `${peakHour.hour}?�에 ?�동??최고조에 ?�했?�니?? `;
      }
      if (topTag) {
        insight += `'${topTag.tag}' 관???�동??${topTag.count}건으�?가??많았?�니??`;
      }

      setAiInsights(insight || "?�동 ?�이?��? 분석 중입?�다.");

    } catch (error) {
      console.error("AI ?�사?�트 ?�성 ?�류:", error);
      setAiInsights("?�사?�트 ?�성 �??�류가 발생?�습?�다.");
    }
  };

  const getTimeFilterLabel = (filter: string) => {
    switch (filter) {
      case "morning": return "?�� ?�전 (6-12??";
      case "afternoon": return "?��??�후 (12-18??";
      case "evening": return "?�� ?�??(18-22??";
      case "night": return "?�� �?(22-6??";
      default: return "?�� ?�체 ?�간";
    }
  };

  const getTagFilterLabel = (filter: string) => {
    if (filter === "all") return "?���??�체 ?�그";
    return `?���?${filter}`;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 지???�역 */}
      <div className="w-3/4 h-full relative">
        <div ref={mapRef} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">지??로딩 �?..</p>
            </div>
          </div>
        )}
        
        {/* 지???�버?�이 ?�보 */}
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
          <div className="text-sm font-semibold text-gray-700">
            ?�� �?{stats.totalPoints}�??�동 지??          </div>
          <div className="text-xs text-gray-500 mt-1">
            {period === "day" ? "?�늘" : period === "week" ? "최근 7?? : "최근 30??} 기�?
          </div>
        </div>
      </div>

      {/* ?�이?�바 */}
      <div className="w-1/4 bg-white border-l flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">?�� ?�치 ?�트�?/h1>
          <p className="text-sm text-gray-600 mt-1">
            ?�시�??�동 지???�각??          </p>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* ?�터 ?�정 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700">?�� ?�터 ?�정</h3>
            
            {/* 기간 ?�터 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">기간</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="day">?�� ?�늘</option>
                <option value="week">?�� 최근 7??/option>
                <option value="month">?�� 최근 30??/option>
              </select>
            </div>

            {/* ?�???�터 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">?�??/label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">?�� ?�체</option>
                <option value="market">?�� ?�품 ?�록</option>
                <option value="voice">?���??�성 ?�션</option>
              </select>
            </div>

            {/* ?�간 ?�터 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">?�간?�</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">?�� ?�체 ?�간</option>
                <option value="morning">?�� ?�전 (6-12??</option>
                <option value="afternoon">?��??�후 (12-18??</option>
                <option value="evening">?�� ?�??(18-22??</option>
                <option value="night">?�� �?(22-6??</option>
              </select>
            </div>

            {/* ?�그 ?�터 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">?�그</label>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">?���??�체 ?�그</option>
                <option value="축구">??축구</option>
                <option value="?�구">???�구</option>
                <option value="?�구">?? ?�구</option>
                <option value="배드민턴">?�� 배드민턴</option>
                <option value="?�니??>?�� ?�니??/option>
                <option value="?�소??>?�� ?�소??/option>
              </select>
            </div>

            {/* ?�측 ?�이???��? */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">?�이??/label>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={showForecast} 
                  onChange={(e) => setShowForecast(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">?�� ?�일 ?�측 · {forecastCount}?�</span>
              </div>
            </div>
          </div>

          {/* AI ?�사?�트 */}
          {aiInsights && (
            <div className="bg-blue-50 rounded-lg p-3">
              <h3 className="font-semibold text-blue-800 mb-2">?�� AI ?�사?�트</h3>
              <p className="text-sm text-blue-700">{aiInsights}</p>
            </div>
          )}

          {/* ?�상 ?��? ?�림 */}
          {anomalyAlerts.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3">
              <h3 className="font-semibold text-red-800 mb-2">?�� ?�상 ?��?</h3>
              <div className="space-y-2">
                {anomalyAlerts.slice(0, 3).map((alert, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium text-red-700">
                      {alert.detectedAt?.toLocaleTimeString()}
                    </div>
                    <div className="text-red-600">
                      {alert.summary?.totalAnomalies || 0}�??�상 ?��?
                    </div>
                    {alert.summary?.criticalCount > 0 && (
                      <div className="text-xs text-red-500">
                        Critical: {alert.summary.criticalCount}�?                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => alert('?�상 ?��? ?�세??지?�의 ?�� 마커�??�릭?�세??')}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                ?�세 보기 ??              </button>
            </div>
          )}

          {/* ?�위 지??*/}
          {stats.topRegions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">?�� ?�위 ?�동 지??/h3>
              <div className="space-y-1">
                {stats.topRegions.map((region, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">#{index + 1} {region.name}</span>
                    <span className="font-semibold text-blue-600">{region.count}�?/span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ?�크 ?�간?� */}
          {stats.peakHours.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">???�크 ?�간?�</h3>
              <div className="space-y-1">
                {stats.peakHours.map((hour, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{hour.hour}??/span>
                    <span className="font-semibold text-green-600">{hour.count}�?/span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ?�기 ?�그 */}
          {stats.tagDistribution.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">?���??�기 ?�그</h3>
              <div className="space-y-1">
                {stats.tagDistribution.slice(0, 5).map((tag, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{tag.tag}</span>
                    <span className="font-semibold text-purple-600">{tag.count}�?/span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 범�? */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-semibold text-gray-700 mb-2">?�� ?�트�?범�?</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span>??? ?�동??/span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                <span>중간 ?�동??/span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                <span>?��? ?�동??/span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
