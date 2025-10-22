"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.naverPost = exports.naverCategories = exports.naverCallback = exports.naverLogin = exports.ping = void 0;
require("./_admin");
require("./globalOptions");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const NAVER_CLIENT_ID = (0, params_1.defineSecret)("NAVER_CLIENT_ID");
const NAVER_CLIENT_SECRET = (0, params_1.defineSecret)("NAVER_CLIENT_SECRET");
const BASE_URL = (0, params_1.defineSecret)("BASE_URL");
const db = admin.firestore();
/** 내부 유틸 */
async function saveToken(uid, tok) {
    await db.doc(`naverTokens/${uid}`).set({
        access_token: tok.access_token,
        refresh_token: tok.refresh_token,
        expires_at: Date.now() + Number(tok.expires_in || 0) * 1000 - 60000 /*여유*/,
    }, { merge: true });
}
async function getValidAccessToken(uid) {
    const snap = await db.doc(`naverTokens/${uid}`).get();
    if (!snap.exists)
        throw new Error("NO_NAVER_TOKEN");
    const t = snap.data();
    if (Date.now() < t.expires_at)
        return t.access_token;
    const url = new URL("https://nid.naver.com/oauth2.0/token");
    url.searchParams.set("grant_type", "refresh_token");
    url.searchParams.set("client_id", NAVER_CLIENT_ID.value());
    url.searchParams.set("client_secret", NAVER_CLIENT_SECRET.value());
    url.searchParams.set("refresh_token", t.refresh_token);
    const r = await fetch(url, { method: "POST" });
    const j = await r.json();
    if (!r.ok || !j.access_token)
        throw new Error(`REFRESH_FAIL ${r.status} ${JSON.stringify(j)}`);
    await saveToken(uid, j);
    return j.access_token;
}
/** 0) 배포/상태 확인용 */
exports.ping = (0, https_1.onRequest)({ cors: true }, (_req, res) => {
    res.status(200).send("ok");
});
/** 1) 로그인 시작 */
exports.naverLogin = (0, https_1.onRequest)({ secrets: [NAVER_CLIENT_ID, BASE_URL], cors: true }, (req, res) => {
    const uid = String(req.query.u || "demo");
    const state = `${Math.random().toString(36).slice(2)}:${uid}`;
    // Functions 도메인이면 /naverCallback, 로컬 개발이면 /api/naver/callback
    const CALLBACK_PATH = BASE_URL.value().includes('cloudfunctions.net')
        ? '/naverCallback'
        : '/api/naver/callback';
    const redirectUri = `${BASE_URL.value()}${CALLBACK_PATH}`;
    const url = new URL("https://nid.naver.com/oauth2.0/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", NAVER_CLIENT_ID.value());
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    res.redirect(url.toString());
});
/** 2) 콜백 */
exports.naverCallback = (0, https_1.onRequest)({ secrets: [NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, BASE_URL], cors: true }, async (req, res) => {
    try {
        console.log('[NAVER] id=', NAVER_CLIENT_ID.value(), 'secLen=', NAVER_CLIENT_SECRET.value()?.length, 'secPeek=', NAVER_CLIENT_SECRET.value()?.slice(0, 4) + '...' + NAVER_CLIENT_SECRET.value()?.slice(-4));
        console.log("[NAVER_CALLBACK] 시작", { method: req.method, query: req.query, body: req.body });
        // 쿼리 우선, 없으면 바디에서 (네이버는 GET 쿼리로 옴)
        const src = req.method === "GET" ? req.query : req.body || {};
        const code = (src.code || "").toString();
        const state = (src.state || "").toString();
        const oauthErr = src.error;
        console.log("[NAVER_CALLBACK] 파라미터 추출", { code: code ? "있음" : "없음", state: state ? "있음" : "없음", oauthErr });
        if (oauthErr) {
            console.error("[NAVER_CALLBACK] OAuth 에러", { error: oauthErr, description: src.error_description });
            res.status(400).send(`OAUTH_ERR ${oauthErr}: ${src.error_description || ""}`);
            return;
        }
        if (!code || !state) {
            console.error("[NAVER_CALLBACK] 필수 파라미터 누락", { code: !!code, state: !!state });
            res.status(400).send("OAUTH_ERR: missing code or state");
            return;
        }
        const [, uid] = state.split(":");
        if (!uid) {
            console.error("[NAVER_CALLBACK] 잘못된 state 형식", { state });
            res.status(400).send("OAUTH_ERR: invalid state format");
            return;
        }
        console.log("[NAVER_CALLBACK] UID 추출 성공", { uid });
        // Functions 도메인이면 /naverCallback, 로컬 개발이면 /api/naver/callback
        const CALLBACK_PATH = BASE_URL.value().includes('cloudfunctions.net')
            ? '/naverCallback'
            : '/api/naver/callback';
        const redirect_uri = `${BASE_URL.value()}${CALLBACK_PATH}`;
        console.log("[NAVER_CALLBACK] redirect_uri 생성", { redirect_uri });
        const tokenParams = {
            grant_type: "authorization_code",
            client_id: NAVER_CLIENT_ID.value(),
            client_secret: NAVER_CLIENT_SECRET.value(),
            redirect_uri,
            code,
            state,
        };
        console.log("[NAVER_CALLBACK] 토큰 요청 파라미터", { ...tokenParams, client_secret: "***" });
        const tokenResp = await fetch("https://nid.naver.com/oauth2.0/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
            body: new URLSearchParams(tokenParams),
        });
        console.log("[NAVER_CALLBACK] 토큰 응답 상태", { status: tokenResp.status, ok: tokenResp.ok });
        const tokenJson = await tokenResp.json();
        console.log("[NAVER_CALLBACK] 토큰 응답 내용", tokenJson);
        if (!tokenResp.ok || tokenJson.error) {
            console.error("[NAVER_CALLBACK] 토큰 교환 실패", {
                status: tokenResp.status,
                response: tokenJson,
                requestParams: { ...tokenParams, client_secret: "***" }
            });
            res.status(502).json({
                ok: false,
                step: "token",
                status: tokenResp.status,
                error: tokenJson
            });
            return;
        }
        console.log("[NAVER_CALLBACK] 토큰 저장 시작", { uid });
        await saveToken(uid, tokenJson);
        console.log("[NAVER_CALLBACK] 토큰 저장 완료", { uid });
        res.status(200).send("네이버 연동 완료!");
    }
    catch (e) {
        console.error("[NAVER_CALLBACK] 예외 발생", {
            message: e?.message,
            stack: e?.stack,
            response: e?.response?.data,
            cause: e?.cause,
            name: e?.name,
            fullError: e
        });
        res.status(500).json({
            ok: false,
            step: "exception",
            error: {
                message: e?.message || "unknown",
                name: e?.name,
                response: e?.response?.data
            }
        });
    }
});
/** 3) 카테고리 */
exports.naverCategories = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    try {
        const uid = String(req.query.u || "demo");
        console.log("[NAVER_CATEGORIES] 요청 시작", { uid });
        const token = await getValidAccessToken(uid);
        console.log("[NAVER_CATEGORIES] 토큰 획득 성공", { uid });
        const r = await fetch("https://openapi.naver.com/blog/listCategory.json", {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("[NAVER_CATEGORIES] API 응답", { status: r.status, ok: r.ok });
        const j = await r.json();
        console.log("[NAVER_CATEGORIES] 응답 내용", j);
        res.status(r.ok ? 200 : 500).send(j);
    }
    catch (e) {
        console.error("[NAVER_CATEGORIES] 예외 발생", {
            message: e?.message,
            stack: e?.stack,
            name: e?.name,
            fullError: e
        });
        res.status(500).json({
            ok: false,
            error: e?.message || "unknown"
        });
    }
});
/** 4) 포스트 작성 */
exports.naverPost = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    try {
        if (req.method === "OPTIONS") {
            res.set("Access-Control-Allow-Origin", "*").set("Access-Control-Allow-Headers", "*").end();
            return;
        }
        console.log("[NAVER_POST] 요청 시작", { method: req.method, body: req.body });
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const { u, title, html, categoryNo } = body || {};
        console.log("[NAVER_POST] 파라미터 추출", { u, title: title ? "있음" : "없음", html: html ? "있음" : "없음", categoryNo });
        if (!u || !title || !html) {
            console.error("[NAVER_POST] 필수 필드 누락", { u: !!u, title: !!title, html: !!html });
            res.status(400).json({ ok: false, error: "MISSING_FIELDS" });
            return;
        }
        console.log("[NAVER_POST] 토큰 획득 시작", { uid: u });
        const token = await getValidAccessToken(u);
        console.log("[NAVER_POST] 토큰 획득 성공", { uid: u });
        const form = new URLSearchParams();
        form.set("title", title);
        form.set("contents", html);
        if (categoryNo)
            form.set("categoryNo", String(categoryNo));
        console.log("[NAVER_POST] 포스트 작성 요청", { title, categoryNo });
        const r = await fetch("https://openapi.naver.com/blog/writePost.json", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        });
        console.log("[NAVER_POST] API 응답", { status: r.status, ok: r.ok });
        const j = await r.json();
        console.log("[NAVER_POST] 응답 내용", j);
        res.status(r.ok ? 200 : 500).send(j);
    }
    catch (e) {
        console.error("[NAVER_POST] 예외 발생", {
            message: e?.message,
            stack: e?.stack,
            name: e?.name,
            fullError: e
        });
        res.status(500).json({
            ok: false,
            error: e?.message || "unknown"
        });
    }
});
