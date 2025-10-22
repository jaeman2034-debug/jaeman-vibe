import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { sendLocalNotification } from "../utils/notifications";

interface BriefingLog {
  id: string;
  date: string;
  summary: string;
  itemCount: number;
  teamCount: number;
  totalCount: number;
  createdAt: any;
}

interface BriefingPanelProps {
  onClose: () => void;
}

export default function BriefingPanel({ onClose }: BriefingPanelProps) {
  const [logs, setLogs] = useState<BriefingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingBriefing, setTestingBriefing] = useState(false);

  useEffect(() => {
    loadBriefingLogs();
  }, []);

  const loadBriefingLogs = async () => {
    try {
      const logsRef = collection(db, "briefingLogs");
      const q = query(logsRef, orderBy("date", "desc"), limit(10));
      const snapshot = await getDocs(q);
      
      const briefingLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BriefingLog));
      
      setLogs(briefingLogs);
    } catch (error) {
      console.error("釉뚮━??濡쒓렇 濡쒕뱶 ?ㅻ쪟:", error);
      Alert.alert("?ㅻ쪟", "釉뚮━??濡쒓렇瑜?遺덈윭?????놁뒿?덈떎.");
    } finally {
      setLoading(false);
    }
  };

  const testBriefing = async () => {
    setTestingBriefing(true);
    try {
      // ?뚯뒪?몄슜 釉뚮━??硫붿떆吏
      const testMessage = "?뺣떂! ?뚯뒪??釉뚮━?묒엯?덈떎. 異뺢뎄??2媛쒖? ?뚮땲?ㅽ솕 1媛쒓? ?덈줈 ?깅줉?섏뿀?댁슂. ?ㅻ뒛??醫뗭? ?섎（ ?섏꽭?? ?똿";
      
      await sendLocalNotification(
        "?똿 ?쇨퀬 鍮꾩꽌 ?뚯뒪??釉뚮━??,
        testMessage,
        { type: "daily_briefing", summary: testMessage }
      );
      
      Alert.alert("?깃났", "?뚯뒪??釉뚮━?묒씠 諛쒖넚?섏뿀?듬땲??");
    } catch (error) {
      console.error("?뚯뒪??釉뚮━???ㅻ쪟:", error);
      Alert.alert("?ㅻ쪟", "?뚯뒪??釉뚮━??諛쒖넚???ㅽ뙣?덉뒿?덈떎.");
    } finally {
      setTestingBriefing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short"
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>?똿 釉뚮━??愿由?/Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>??/Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>釉뚮━??濡쒓렇 濡쒕뵫 以?..</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>?똿 釉뚮━??愿由?/Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>??/Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={testBriefing}
          disabled={testingBriefing}
          style={[styles.testButton, testingBriefing && styles.disabledButton]}
        >
          <Text style={styles.testButtonText}>
            {testingBriefing ? "?뚯뒪??以?.." : "?㎦ ?뚯뒪??釉뚮━??}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={loadBriefingLogs} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>?봽 ?덈줈怨좎묠</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logsContainer} showsVerticalScrollIndicator={false}>
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>?꾩쭅 釉뚮━??濡쒓렇媛 ?놁뒿?덈떎</Text>
            <Text style={styles.emptySubtext}>留ㅼ씪 ?ㅼ쟾 9?쒖뿉 ?먮룞?쇰줈 釉뚮━?묒씠 諛쒖넚?⑸땲??/Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logHeader}>
                <Text style={styles.logDate}>{formatDate(log.date)}</Text>
                <View style={styles.statsContainer}>
                  <Text style={styles.statText}>
                    ?곹뭹 {log.itemCount}媛?                  </Text>
                  {log.teamCount > 0 && (
                    <Text style={styles.statText}>
                      ? {log.teamCount}媛?                    </Text>
                  )}
                </View>
              </View>
              
              <Text style={styles.logSummary}>{log.summary}</Text>
              
              <View style={styles.logFooter}>
                <Text style={styles.logTotal}>
                  珥?{log.totalCount}嫄댁쓽 ?덈줈???뚯떇
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          ?뮕 留ㅼ씪 ?ㅼ쟾 9?쒖뿉 ?먮룞?쇰줈 ?ㅻ뒛???ㅽ룷痢??뚯떇???꾪빐?쒕┰?덈떎
        </Text>
      </View>
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#f8f9fa",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  controls: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  testButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  testButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  refreshButton: {
    flex: 1,
    backgroundColor: "#34C759",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  refreshButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  logsContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999999",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#cccccc",
    textAlign: "center",
  },
  logItem: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statText: {
    fontSize: 12,
    color: "#666666",
    backgroundColor: "#e9ecef",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logSummary: {
    fontSize: 16,
    color: "#333333",
    lineHeight: 24,
    marginBottom: 12,
  },
  logFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logTotal: {
    fontSize: 12,
    color: "#999999",
  },
  info: {
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  infoText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 20,
  },
});
