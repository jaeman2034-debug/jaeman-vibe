"use strict";
const PID = 'jaeman-vibe-platform'; // ?�제 ?�로?�트 IDconst REGION = 'us-central1';export const FUNCTIONS_BASE =  location.hostname === 'localhost'    ? `http://localhost:5001/${PID}/${REGION}`    : `https://${REGION}-${PID}.cloudfunctions.net`;// ?�용 ?�시:// import { FUNCTIONS_BASE } from '@/lib/functionsUrl';// await fetch(`${FUNCTIONS_BASE}/analyzeProduct`, { /* ... */ }); 
