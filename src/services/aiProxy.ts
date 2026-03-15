// ============================================================
// aiProxy.ts — FIXED VERSION
// 
// Problem: Pehle ye /api/chat/proxy pe fetch karta tha
// jo Vite mein exist hi nahi karta (sirf Next.js mein hota hai)
//
// Fix: Sab calls direct gemini.ts pe redirect kar diye
// ============================================================

export {
  generateProxyResponse,
  generateProxyResponseStream,
} from "./gemini";
