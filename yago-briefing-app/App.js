import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet,
  Alert,
  Linking
} from 'react-native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { format } from 'date-fns';

// 푸시 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [reports, setReports] = useState([]);
  const [currentSound, setCurrentSound] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [soundStatus, setSoundStatus] = useState({});

  // 🔔 푸시 알림 권한 요청
  useEffect(() => {
    registerForPushNotificationsAsync();
    setupAudio();
  }, []);

  // 🎧 오디오 설정
  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false
      });
    } catch (error) {
      console.error('오디오 설정 오류:', error);
    }
  };

  // 📊 Firestore 실시간 구독
  useEffect(() => {
    const q = query(
      collection(db, "ai_voice_reports"), 
      orderBy("createdAt", "desc"), 
      limit(10)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reportsList.push({
          id: doc.id,
          title: data.summary?.slice(0, 50) + "..." || "AI 음성 리포트",
          audioUrl: data.audioUrl || "",
          pdfUrl: data.pdfUrl || "",
          date: data.reportDate || data.createdAt?.toDate?.()?.toISOString(),
          summary: data.ttsSummary || "",
          totalCount: data.stats?.totalCount || 0,
          totalValue: data.stats?.totalValue || 0,
          topArea: data.stats?.topArea || "정보 없음"
        });
      });
      setReports(reportsList);
    });

    return () => unsubscribe();
  }, []);

  // 🎧 오디오 재생 함수
  const playAudio = async (report) => {
    try {
      // 기존 재생 중인 음성 정지
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      }

      if (currentReport?.id === report.id && playing) {
        // 같은 리포트가 재생 중이면 정지
        setPlaying(false);
        setCurrentReport(null);
        return;
      }

      // 새 음성 재생
      const { sound } = await Audio.Sound.createAsync(
        { uri: report.audioUrl },
        { shouldPlay: true }
      );

      setCurrentSound(sound);
      setCurrentReport(report);
      setPlaying(true);

      // 재생 상태 업데이트
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setSoundStatus(prev => ({
            ...prev,
            [report.id]: {
              durationMillis: status.durationMillis,
              positionMillis: status.positionMillis,
              shouldPlay: status.shouldPlay
            }
          }));

          if (status.didJustFinish) {
            setPlaying(false);
            setCurrentReport(null);
          }
        }
      });

    } catch (error) {
      console.error('음성 재생 오류:', error);
      Alert.alert('오류', '음성 파일을 재생할 수 없습니다.');
    }
  };

  // 📄 PDF 열기
  const openPDF = async (pdfUrl) => {
    try {
      await Linking.openURL(pdfUrl);
    } catch (error) {
      Alert.alert('오류', 'PDF 파일을 열 수 없습니다.');
    }
  };

  // 🔔 푸시 알림 등록
  const registerForPushNotificationsAsync = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('알림 권한이 필요합니다.');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('🎧 Expo Push Token:', token);
    
    // 매일 아침 8시 브리핑 알림 설정
    await scheduleMorningBriefing();
  };

  // 🌅 매일 아침 브리핑 예약
  const scheduleMorningBriefing = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌅 아침 브리핑 시간!",
          body: "오늘의 YAGO AI 리포트를 들어보세요 🎧",
          sound: true,
          data: { type: 'morning_briefing' }
        },
        trigger: {
          hour: 8,
          minute: 0,
          repeats: true,
        },
      });
      console.log('✅ 아침 브리핑 알림 설정 완료');
    } catch (error) {
      console.error('알림 설정 오류:', error);
    }
  };

  // 📱 리포트 카드 렌더링
  const renderReportCard = ({ item, index }) => {
    const isCurrentPlaying = currentReport?.id === item.id && playing;
    const progress = soundStatus[item.id]?.positionMillis / soundStatus[item.id]?.durationMillis || 0;

    return (
      <Card style={[styles.card, isCurrentPlaying && styles.playingCard]}>
        <Card.Content>
          <Title style={styles.title}>
            🎧 {item.title}
          </Title>
          
          <Paragraph style={styles.date}>
            📅 {format(new Date(item.date), 'MM월 dd일 HH:mm')}
          </Paragraph>

          {/* 통계 정보 */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{item.totalCount}</Text>
              <Text style={styles.statLabel}>거래</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{(item.totalValue / 10000).toFixed(0)}만원</Text>
              <Text style={styles.statLabel}>거래액</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>📍 {item.topArea}</Text>
            </View>
          </View>

          {/* 재생 진행바 */}
          {isCurrentPlaying && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
          )}

          {/* 액션 버튼 */}
          <View style={styles.actionContainer}>
            <Button
              mode={isCurrentPlaying ? "contained" : "outlined"}
              icon={isCurrentPlaying ? "pause" : "play"}
              onPress={() => playAudio(item)}
              style={styles.playButton}
              color={isCurrentPlaying ? "#ef4444" : "#3b82f6"}
            >
              {isCurrentPlaying ? "정지" : "재생"}
            </Button>
            
            <Button
              mode="outlined"
              icon="file-document"
              onPress={() => openPDF(item.pdfUrl)}
              style={styles.pdfButton}
              disabled={!item.pdfUrl}
            >
              PDF
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎧 야고 브리핑</Text>
        <Text style={styles.headerSubtitle}>
          AI 음성 리포트 {reports.length}개
        </Text>
        <Text style={styles.headerDescription}>
          매일 아침 8시 자동 브리핑 알림 🔔
        </Text>
      </View>

      {/* 리포트 목록 */}
      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📱</Text>
          <Text style={styles.emptyTitle}>아직 생성된 리포트가 없습니다</Text>
          <Text style={styles.emptyDescription}>
            매일 00:00에 AI가 자동으로 리포트를 생성합니다
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderReportCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 현재 재생 중 표시 */}
      {currentReport && (
        <View style={styles.currentPlaying}>
          <Text style={styles.currentPlayingText}>
            🎵 {currentReport.title}
          </Text>
          <Text style={styles.currentPlayingSubtext}>
            {playing ? "재생 중..." : "일시정지"}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#3b82f6',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
    marginTop: 4,
  },
  headerDescription: {
    fontSize: 12,
    color: '#c7d2fe',
    textAlign: 'center',
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  playingCard: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  date: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playButton: {
    flex: 1,
    marginRight: 8,
  },
  pdfButton: {
    flex: 1,
    marginLeft: 8,
  },
  currentPlaying: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  currentPlayingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  currentPlayingSubtext: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
