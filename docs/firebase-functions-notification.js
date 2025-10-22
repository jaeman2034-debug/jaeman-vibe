// Firebase Functions - 자동 알림 시스템
// 실제 배포 시에는 functions/index.js에 추가

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Firebase Admin 초기화 (이미 초기화된 경우 제외)
if (!admin.apps.length) {
  admin.initializeApp();
}

// 📢 수강 신청 완료 알림
exports.notifyEnrollment = functions.firestore
  .document("academyCourses/{courseId}/enrollments/{enrollId}")
  .onCreate(async (snap, context) => {
    const enrollmentData = snap.data();
    const courseId = context.params.courseId;
    
    try {
      // 강좌 정보 로드
      const courseDoc = await admin.firestore()
        .collection("academyCourses")
        .doc(courseId)
        .get();
      
      if (!courseDoc.exists) {
        console.error(`강좌 정보를 찾을 수 없습니다: ${courseId}`);
        return;
      }
      
      const course = courseDoc.data();
      
      // 알림 데이터 구성
      const notificationData = {
        type: "enrollment_confirmation",
        studentName: enrollmentData.name,
        studentPhone: enrollmentData.phone,
        courseTitle: course.title,
        courseCoach: course.coach,
        startDate: course.startDate,
        endDate: course.endDate,
        timestamp: new Date().toISOString()
      };
      
      // 실제 알림 발송 (예시: 이메일/SMS API 호출)
      await sendNotification(notificationData);
      
      console.log(`📢 수강 신청 알림 발송: ${enrollmentData.name}님 → ${course.title}`);
      
    } catch (error) {
      console.error("수강 신청 알림 오류:", error);
    }
  });

// 💰 결제 완료 알림
exports.notifyPayment = functions.firestore
  .document("academyCourses/{courseId}/enrollments/{enrollId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // 결제 상태가 변경된 경우만 처리
    if (before.paid === false && after.paid === true) {
      const courseId = context.params.courseId;
      
      try {
        // 강좌 정보 로드
        const courseDoc = await admin.firestore()
          .collection("academyCourses")
          .doc(courseId)
          .get();
        
        if (!courseDoc.exists) {
          console.error(`강좌 정보를 찾을 수 없습니다: ${courseId}`);
          return;
        }
        
        const course = courseDoc.data();
        
        // 알림 데이터 구성
        const notificationData = {
          type: "payment_confirmation",
          studentName: after.name,
          studentPhone: after.phone,
          courseTitle: course.title,
          courseCoach: course.coach,
          startDate: course.startDate,
          endDate: course.endDate,
          timestamp: new Date().toISOString()
        };
        
        // 실제 알림 발송
        await sendNotification(notificationData);
        
        console.log(`💰 결제 완료 알림 발송: ${after.name}님 → ${course.title}`);
        
      } catch (error) {
        console.error("결제 완료 알림 오류:", error);
      }
    }
  });

// 📧 실제 알림 발송 함수 (예시)
async function sendNotification(data) {
  // 예시 1: 이메일 발송 (SendGrid, Nodemailer 등)
  if (data.type === "enrollment_confirmation") {
    const emailContent = `
      안녕하세요 ${data.studentName}님!
      
      "${data.courseTitle}" 강좌 신청이 접수되었습니다.
      
      강좌 정보:
      - 강좌명: ${data.courseTitle}
      - 코치: ${data.courseCoach}
      - 기간: ${data.startDate} ~ ${data.endDate}
      
      결제 완료 후 수강이 확정됩니다.
      문의사항이 있으시면 연락주세요.
      
      감사합니다.
    `;
    
    console.log(`📧 이메일 발송 예정: ${data.studentPhone}`);
    console.log(`내용: ${emailContent}`);
  }
  
  // 예시 2: SMS 발송 (Twilio, AWS SNS 등)
  if (data.type === "payment_confirmation") {
    const smsContent = `[${data.courseTitle}] 결제가 확인되었습니다. 수강이 확정되었습니다!`;
    
    console.log(`📱 SMS 발송 예정: ${data.studentPhone}`);
    console.log(`내용: ${smsContent}`);
  }
  
  // 예시 3: Slack 알림 (관리자용)
  const slackMessage = {
    text: `🎓 새로운 ${data.type === "enrollment_confirmation" ? "수강 신청" : "결제 완료"}`,
    attachments: [{
      color: data.type === "enrollment_confirmation" ? "good" : "warning",
      fields: [
        { title: "학생", value: data.studentName, short: true },
        { title: "전화번호", value: data.studentPhone, short: true },
        { title: "강좌", value: data.courseTitle, short: false },
        { title: "코치", value: data.courseCoach, short: true }
      ]
    }]
  };
  
  console.log(`💬 Slack 알림 발송 예정:`, slackMessage);
}

// n8n Webhook 연동 (대안)
exports.notifyViaN8n = functions.firestore
  .document("academyCourses/{courseId}/enrollments/{enrollId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const courseId = context.params.courseId;
    
    try {
      // n8n Webhook 호출
      const webhookUrl = "http://your-n8n-instance.com/webhook/academy-notifications";
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "enrollment",
          courseId: courseId,
          studentName: data.name,
          studentPhone: data.phone,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log(`✅ n8n 알림 전송 성공: ${data.name}님`);
      } else {
        console.error(`❌ n8n 알림 전송 실패: ${response.status}`);
      }
      
    } catch (error) {
      console.error("n8n 알림 전송 오류:", error);
    }
  });

module.exports = {
  notifyEnrollment,
  notifyPayment,
  notifyViaN8n
};
