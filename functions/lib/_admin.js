"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
// 단일 초기화 보장
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
