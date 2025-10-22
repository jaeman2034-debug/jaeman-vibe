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
exports.naverPost = exports.naverCategories = exports.naverCallback = exports.naverLogin = void 0;
require("./_admin");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const db = admin.firestore();
const NAVER_CLIENT_ID = (0, params_1.defineSecret)("NAVER_CLIENT_ID");
const NAVER_CLIENT_SECRET = (0, params_1.defineSecret)("NAVER_CLIENT_SECRET");
// 네이버 OAuth 로그인 페이지로 리다이렉트
exports.naverLogin = (0, https_1.onRequest)({ secrets: [NAVER_CLIENT_ID, NAVER_CLIENT_SECRET] }, async (req, res) => {
    const clientId = NAVER_CLIENT_ID.value();
    const redirectUri = `${req.protocol}://${req.get('host')}/api/naver/callback`;
    const state = Math.random().toString(36).substring(2, 15);
    // state를 세션에 저장 (실제로는 Redis나 DB에 저장)
    const authUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    res.redirect(authUrl);
});
// 네이버 OAuth 콜백 - code를 access_token으로 교환
exports.naverCallback = (0, https_1.onRequest)({ secrets: [NAVER_CLIENT_ID, NAVER_CLIENT_SECRET] }, async (req, res) => {
    const { code, state } = req.query;
    const clientId = NAVER_CLIENT_ID.value();
    const clientSecret = NAVER_CLIENT_SECRET.value();
    const redirectUri = `${req.protocol}://${req.get('host')}/api/naver/callback`;
    if (!code) {
        return res.status(400).json({ error: 'Authorization code not provided' });
    }
    try {
        // access_token 요청
        const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code: code,
                state: state
            })
        });
        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            return res.status(400).json({ error: 'Failed to get access token', details: tokenData });
        }
        // 사용자 정보 조회
        const userResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        const userData = await userResponse.json();
        // Firestore에 토큰 저장 (실제로는 사용자별로 저장)
        await db.collection('naver_tokens').doc('default').set({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type,
            user_info: userData.response,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: '네이버 블로그 연동이 완료되었습니다!',
            user: userData.response
        });
    }
    catch (error) {
        console.error('Naver callback error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// 네이버 블로그 카테고리 목록 조회
exports.naverCategories = (0, https_1.onRequest)({ secrets: [NAVER_CLIENT_ID, NAVER_CLIENT_SECRET] }, async (req, res) => {
    try {
        // 저장된 토큰 조회
        const tokenDoc = await db.collection('naver_tokens').doc('default').get();
        if (!tokenDoc.exists) {
            return res.status(401).json({ error: 'Not authenticated. Please login first.' });
        }
        const tokenData = tokenDoc.data();
        const accessToken = tokenData?.access_token;
        if (!accessToken) {
            return res.status(401).json({ error: 'No access token found' });
        }
        // 카테고리 목록 조회
        const categoriesResponse = await fetch('https://openapi.naver.com/blog/categoryList.json', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const categoriesData = await categoriesResponse.json();
        res.json(categoriesData);
    }
    catch (error) {
        console.error('Naver categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// 네이버 블로그에 글 발행 (크로스포스트)
exports.naverPost = (0, https_1.onRequest)({ secrets: [NAVER_CLIENT_ID, NAVER_CLIENT_SECRET] }, async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { title, content, categoryNo } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }
    try {
        // 저장된 토큰 조회
        const tokenDoc = await db.collection('naver_tokens').doc('default').get();
        if (!tokenDoc.exists) {
            return res.status(401).json({ error: 'Not authenticated. Please login first.' });
        }
        const tokenData = tokenDoc.data();
        const accessToken = tokenData?.access_token;
        if (!accessToken) {
            return res.status(401).json({ error: 'No access token found' });
        }
        // 네이버 블로그에 글 발행
        const postData = new URLSearchParams({
            title,
            contents: content,
            ...(categoryNo ? { categoryNo: String(categoryNo) } : {})
        });
        const postResponse = await fetch('https://openapi.naver.com/blog/writePost.json', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: postData
        });
        const postResult = await postResponse.json();
        if (!postResponse.ok) {
            return res.status(400).json({ error: 'Failed to post to Naver blog', details: postResult });
        }
        res.json({
            success: true,
            message: '네이버 블로그에 성공적으로 발행되었습니다!',
            result: postResult
        });
    }
    catch (error) {
        console.error('Naver post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
