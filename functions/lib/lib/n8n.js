"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postToN8N = postToN8N;
const node_fetch_1 = __importDefault(require("node-fetch"));
const v2_1 = require("firebase-functions/v2");
const token = process.env.N8N_TOKEN || "n8n_default_token_please_change";
async function postToN8N(url, payload) {
    try {
        const response = await (0, node_fetch_1.default)(url, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-n8n-token": token,
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            v2_1.logger.error(`n8n error`, {
                url,
                status: response.status,
                statusText: response.statusText
            });
            return false;
        }
        v2_1.logger.info(`n8n webhook sent successfully`, { url });
        return true;
    }
    catch (error) {
        v2_1.logger.error(`n8n webhook failed`, { url, error: error.message });
        return false;
    }
}
