"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const v2_1 = require("firebase-functions/v2");
// 모든 v2 함수에 적용되는 글로벌 설정
(0, v2_1.setGlobalOptions)({
    region: 'us-central1',
    timeoutSeconds: 60,
    maxInstances: 20
});
