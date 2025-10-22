/**
 * 🎧 Kakao Mini 스킬 - 야고 브리핑
 * "야고 브리핑 틀어줘" → 최신 AI 음성 리포트 재생
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// Firestore 인스턴스
const db = admin.firestore();
export const kakaoMiniBriefing = functions
    .region("asia-northeast3")
    .https.onRequest(async (req, res) => {
    var _a, _b;
    // CORS 설정
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(200).send("");
        return;
    }
    try {
        console.log("🎧 Kakao Mini 브리핑 요청:", req.body);
        // 최신 리포트 조회
        const snapshot = await db
            .collection("ai_voice_reports")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();
        if (snapshot.empty) {
            const response = {
                version: "2.0",
                template: {
                    outputs: [
                        {
                            simpleText: {
                                text: "오늘은 재생할 AI 브리핑이 없어요. 매일 00:00에 자동으로 생성됩니다. 내일 다시 시도해보세요! 🎧"
                            }
                        }
                    ]
                }
            };
            res.json(response);
            return;
        }
        const latestReport = snapshot.docs[0].data();
        const audioUrl = latestReport.audioUrl;
        const summary = latestReport.summary || latestReport.ttsSummary || "AI 음성 리포트";
        const reportDate = latestReport.reportDate || "오늘";
        const totalCount = ((_a = latestReport.stats) === null || _a === void 0 ? void 0 : _a.totalCount) || 0;
        const totalValue = ((_b = latestReport.stats) === null || _b === void 0 ? void 0 : _b.totalValue) || 0;
        // 오디오 URL이 있는 경우
        if (audioUrl) {
            const title = `🎧 ${reportDate} 야고 브리핑`;
            const description = `총 ${totalCount}건 거래, ${(totalValue / 10000).toFixed(0)}만원 거래액`;
            const response = {
                version: "2.0",
                template: {
                    outputs: [
                        {
                            simpleText: {
                                text: `${title}\n\n${summary.slice(0, 100)}...\n\n${description}\n\n재생을 시작합니다! 🎵`
                            }
                        },
                        {
                            media: {
                                type: "audio",
                                content: {
                                    title: title,
                                    description: description,
                                    url: audioUrl
                                }
                            }
                        }
                    ]
                }
            };
            console.log("✅ Kakao Mini 응답 전송:", title);
            res.json(response);
        }
        else {
            // 오디오 URL이 없는 경우
            const response = {
                version: "2.0",
                template: {
                    outputs: [
                        {
                            simpleText: {
                                text: `🎧 ${reportDate} 야고 브리핑\n\n${summary.slice(0, 150)}...\n\n오디오 파일이 준비되지 않았습니다. 웹 대시보드에서 확인해보세요!`
                            }
                        }
                    ]
                }
            };
            res.json(response);
        }
    }
    catch (error) {
        console.error("❌ Kakao Mini 스킬 오류:", error);
        const errorResponse = {
            version: "2.0",
            template: {
                outputs: [
                    {
                        simpleText: {
                            text: "죄송해요. 브리핑을 불러오는 중 오류가 발생했어요. 잠시 후 다시 시도해보세요. 🎧"
                        }
                    }
                ]
            }
        };
        res.json(errorResponse);
    }
});
// 🗓️ 어제 브리핑 스킬
export const kakaoMiniYesterdayBriefing = functions
    .region("asia-northeast3")
    .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(200).send("");
        return;
    }
    try {
        // 어제 날짜 계산
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        // 어제 리포트 조회
        const snapshot = await db
            .collection("ai_voice_reports")
            .where("reportDate", ">=", yesterdayStr)
            .where("reportDate", "<", new Date().toISOString().split('T')[0])
            .orderBy("reportDate", "desc")
            .limit(1)
            .get();
        if (snapshot.empty) {
            const response = {
                version: "2.0",
                template: {
                    outputs: [
                        {
                            simpleText: {
                                text: "어제는 생성된 브리핑이 없어요. 오늘 브리핑을 들어보시겠어요? 🎧"
                            }
                        }
                    ]
                }
            };
            res.json(response);
            return;
        }
        const yesterdayReport = snapshot.docs[0].data();
        const audioUrl = yesterdayReport.audioUrl;
        const summary = yesterdayReport.summary || yesterdayReport.ttsSummary || "어제 AI 음성 리포트";
        if (audioUrl) {
            const response = {
                version: "2.0",
                template: {
                    outputs: [
                        {
                            simpleText: {
                                text: `🗓️ 어제 야고 브리핑\n\n${summary.slice(0, 100)}...\n\n재생을 시작합니다! 🎵`
                            }
                        },
                        {
                            media: {
                                type: "audio",
                                content: {
                                    title: "🗓️ 어제 야고 브리핑",
                                    description: "어제의 AI 음성 리포트",
                                    url: audioUrl
                                }
                            }
                        }
                    ]
                }
            };
            res.json(response);
        }
        else {
            const response = {
                version: "2.0",
                template: {
                    outputs: [
                        {
                            simpleText: {
                                text: `🗓️ 어제 야고 브리핑\n\n${summary.slice(0, 150)}...\n\n오디오 파일이 준비되지 않았습니다.`
                            }
                        }
                    ]
                }
            };
            res.json(response);
        }
    }
    catch (error) {
        console.error("❌ 어제 브리핑 오류:", error);
        res.json({
            version: "2.0",
            template: {
                outputs: [
                    {
                        simpleText: {
                            text: "어제 브리핑을 불러오는 중 오류가 발생했어요. 🎧"
                        }
                    }
                ]
            }
        });
    }
});
// 📊 일주일 요약 스킬
export const kakaoMiniWeeklySummary = functions
    .region("asia-northeast3")
    .https.onRequest(async (req, res) => {
    var _a;
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(200).send("");
        return;
    }
    try {
        // 최근 7일 리포트 조회
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const snapshot = await db
            .collection("ai_voice_reports")
            .where("createdAt", ">=", weekAgo)
            .orderBy("createdAt", "desc")
            .get();
        if (snapshot.empty) {
            const response = {
                version: "2.0",
                template: {
                    outputs: [
                        {
                            simpleText: {
                                text: "최근 일주일간 생성된 브리핑이 없어요. 매일 00:00에 자동으로 생성됩니다. 🎧"
                            }
                        }
                    ]
                }
            };
            res.json(response);
            return;
        }
        // 통계 계산
        let totalReports = 0;
        let totalTransactions = 0;
        let totalValue = 0;
        const areas = {};
        snapshot.forEach(doc => {
            var _a, _b, _c;
            const data = doc.data();
            totalReports++;
            totalTransactions += ((_a = data.stats) === null || _a === void 0 ? void 0 : _a.totalCount) || 0;
            totalValue += ((_b = data.stats) === null || _b === void 0 ? void 0 : _b.totalValue) || 0;
            const area = ((_c = data.stats) === null || _c === void 0 ? void 0 : _c.topArea) || "기타";
            areas[area] = (areas[area] || 0) + 1;
        });
        const topArea = ((_a = Object.entries(areas)
            .sort(([, a], [, b]) => b - a)[0]) === null || _a === void 0 ? void 0 : _a[0]) || "정보 없음";
        const summary = `📊 일주일 야고 브리핑 요약\n\n` +
            `• 총 브리핑: ${totalReports}개\n` +
            `• 총 거래: ${totalTransactions}건\n` +
            `• 총 거래액: ${(totalValue / 10000).toFixed(0)}만원\n` +
            `• 주요 지역: ${topArea}\n\n` +
            `최근 7일간 활발한 거래가 있었네요! 🎉`;
        const response = {
            version: "2.0",
            template: {
                outputs: [
                    {
                        simpleText: {
                            text: summary
                        }
                    }
                ]
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error("❌ 일주일 요약 오류:", error);
        res.json({
            version: "2.0",
            template: {
                outputs: [
                    {
                        simpleText: {
                            text: "일주일 요약을 불러오는 중 오류가 발생했어요. 🎧"
                        }
                    }
                ]
            }
        });
    }
});
//# sourceMappingURL=kakaoMiniSkill.js.map