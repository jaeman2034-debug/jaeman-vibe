// Firebase Functions Entry Point
import { summarizeChat } from "./summarizeChat.js";
import { sendAdminPush } from "./sendAdminPush.js";

// ✅ 채팅 알림 시스템
const chatNotifications = require("./lib/chatNotificationTrigger");

// ✅ n8n Webhook 연동
const n8nChatWebhook = require("./lib/n8nChatWebhook");

// 🤖 AI 자동 답변 시스템
const aiChatReply = require("./lib/aiChatReply");

// 🔥 AI + FCM + Slack 통합 알림 시스템
const aiNotificationSystem = require("./aiNotificationSystem");

// 📊 일일 AI 채팅 통계 자동 보고서
const dailyChatReport = require("./dailyChatReport");

// 🔥 끝판왕 버전: Slack + Google Sheets + 주간 요약 완전 자동화
const enhancedDailyReport = require("./enhancedDailyReport");

// 채팅 알림 exports
const chatNotificationExports = chatNotifications;

// n8n Webhook exports  
const n8nWebhookExports = n8nChatWebhook;

// AI 자동 답변 exports
const aiChatReplyExports = aiChatReply;

// AI 알림 시스템 exports
const aiNotificationExports = aiNotificationSystem;

// 일일 보고서 exports
const dailyReportExports = dailyChatReport;

// 끝판왕 보고서 exports
const enhancedReportExports = enhancedDailyReport;

// 🔥 AI 리포트 자동 발송 시스템
const aiReportExports = require('./sendAIPushReport');
const saveAIReportExports = require('./saveAIReport');

export { 
  summarizeChat, 
  sendAdminPush,
};

// CommonJS exports for compatibility
module.exports = {
  summarizeChat, 
  sendAdminPush,
  ...chatNotificationExports,
  ...n8nWebhookExports,
  ...aiChatReplyExports,
  ...aiNotificationExports,
  ...dailyReportExports,
  ...enhancedReportExports,
  ...aiReportExports,
  ...saveAIReportExports,
};
