import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { postToN8N } from "./lib/n8n";

// 마켓 생성 이벤트
export const onMarketCreated = onDocumentCreated("market/{id}", async (event) => {
  try {
    const id = event.params.id;
    const data = event.data?.data();
    
    if (!data) {
      logger.warn("Market document created but no data found", { id });
      return;
    }

    logger.info("Market document created", { id, title: data.title });

    // n8n에 마켓 생성 이벤트 전송
    const webhookUrl = process.env.N8N_WEBHOOK_MARKET_CREATED;
    if (webhookUrl) {
      const success = await postToN8N(webhookUrl, {
        type: "market.created",
        id,
        data: {
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }
      });

      if (success) {
        logger.info("Market creation event sent to n8n", { id });
      } else {
        logger.warn("Failed to send market creation event to n8n", { id });
      }
    } else {
      logger.warn("N8N_WEBHOOK_MARKET_CREATED not configured");
    }
  } catch (error) {
    logger.error("Error in onMarketCreated", { 
      error: error.message, 
      id: event.params.id 
    });
  }
});

// 모임 생성 이벤트
export const onMeetupCreated = onDocumentCreated("meetups/{id}", async (event) => {
  try {
    const id = event.params.id;
    const data = event.data?.data();
    
    if (!data) {
      logger.warn("Meetup document created but no data found", { id });
      return;
    }

    logger.info("Meetup document created", { id, title: data.title });

    // n8n에 모임 생성 이벤트 전송
    const webhookUrl = process.env.N8N_WEBHOOK_MEETUP_CREATED;
    if (webhookUrl) {
      const success = await postToN8N(webhookUrl, {
        type: "meetup.created",
        id,
        data: {
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }
      });

      if (success) {
        logger.info("Meetup creation event sent to n8n", { id });
      } else {
        logger.warn("Failed to send meetup creation event to n8n", { id });
      }
    } else {
      logger.warn("N8N_WEBHOOK_MEETUP_CREATED not configured");
    }
  } catch (error) {
    logger.error("Error in onMeetupCreated", { 
      error: error.message, 
      id: event.params.id 
    });
  }
});

// 일자리 생성 이벤트
export const onJobCreated = onDocumentCreated("jobs/{id}", async (event) => {
  try {
    const id = event.params.id;
    const data = event.data?.data();
    
    if (!data) {
      logger.warn("Job document created but no data found", { id });
      return;
    }

    logger.info("Job document created", { id, title: data.title });

    // n8n에 일자리 생성 이벤트 전송
    const webhookUrl = process.env.N8N_WEBHOOK_JOB_CREATED;
    if (webhookUrl) {
      const success = await postToN8N(webhookUrl, {
        type: "job.created",
        id,
        data: {
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }
      });

      if (success) {
        logger.info("Job creation event sent to n8n", { id });
      } else {
        logger.warn("Failed to send job creation event to n8n", { id });
      }
    } else {
      logger.warn("N8N_WEBHOOK_JOB_CREATED not configured");
    }
  } catch (error) {
    logger.error("Error in onJobCreated", { 
      error: error.message, 
      id: event.params.id 
    });
  }
});

// 신고 생성 이벤트
export const onReportCreated = onDocumentCreated("reports/{id}", async (event) => {
  try {
    const id = event.params.id;
    const data = event.data?.data();
    
    if (!data) {
      logger.warn("Report document created but no data found", { id });
      return;
    }

    logger.info("Report document created", { 
      id, 
      refType: data.refType, 
      refId: data.refId,
      reason: data.reason 
    });

    // n8n에 신고 생성 이벤트 전송
    const webhookUrl = process.env.N8N_WEBHOOK_REPORT_CREATED;
    if (webhookUrl) {
      const success = await postToN8N(webhookUrl, {
        type: "report.created",
        id,
        data: {
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }
      });

      if (success) {
        logger.info("Report creation event sent to n8n", { id });
      } else {
        logger.warn("Failed to send report creation event to n8n", { id });
      }
    } else {
      logger.warn("N8N_WEBHOOK_REPORT_CREATED not configured");
    }
  } catch (error) {
    logger.error("Error in onReportCreated", { 
      error: error.message, 
      id: event.params.id 
    });
  }
});
