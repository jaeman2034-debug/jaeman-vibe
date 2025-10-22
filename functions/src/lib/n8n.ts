import fetch from "node-fetch";
import { logger } from "firebase-functions/v2";

const token = process.env.N8N_TOKEN || "n8n_default_token_please_change";

export async function postToN8N(url: string, payload: unknown) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-n8n-token": token,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      logger.error(`n8n error`, { 
        url, 
        status: response.status,
        statusText: response.statusText 
      });
      return false;
    }
    
    logger.info(`n8n webhook sent successfully`, { url });
    return true;
  } catch (error) {
    logger.error(`n8n webhook failed`, { url, error: error.message });
    return false;
  }
}
