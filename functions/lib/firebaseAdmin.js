"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminApp = void 0;
const app_1 = require("firebase-admin/app");
exports.adminApp = (0, app_1.getApps)().length ? (0, app_1.getApps)()[0] : (0, app_1.initializeApp)();
