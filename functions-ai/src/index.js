const functions = require("firebase-functions");
const { analyzeProductImage } = require("./aiAutoTag.js");
const { handleVoiceInput } = require("./aiVoiceHandler.js");
const { evaluateTrustScore } = require("./aiTrustScore.js");
const { generateSellerProfile } = require("./aiSellerProfile.js");
const { generateDashboardReport } = require("./aiDashboardReport.js");
const { resolveDispute } = require("./aiDisputeResolver.js");
const { precheckEscrowRisk } = require("./aiEscrowRisk.js");
const { updateSellerTrust } = require("./aiSellerTrustUpdate.js");

exports.aiAutoTag = functions
  .region("asia-northeast3")
  .https.onRequest(analyzeProductImage);

exports.aiVoiceAuto = functions
  .region("asia-northeast3")
  .https.onRequest(handleVoiceInput);

exports.aiTrustScore = functions
  .region("asia-northeast3")
  .https.onRequest(evaluateTrustScore);

exports.aiSellerProfile = functions
  .region("asia-northeast3")
  .https.onRequest(generateSellerProfile);

exports.aiDashboardReport = functions
  .region("asia-northeast3")
  .https.onRequest(generateDashboardReport);

exports.aiDisputeResolver = functions
  .region("asia-northeast3")
  .https.onRequest(resolveDispute);

exports.aiEscrowRisk = functions
  .region("asia-northeast3")
  .https.onRequest(precheckEscrowRisk);

exports.aiSellerTrustUpdate = functions
  .region("asia-northeast3")
  .https.onRequest(updateSellerTrust);
