/**
 * 🎧 YAGO VIBE Google Cast Bridge Server (운영용)
 * n8n Webhook → 로컬 Node 서버 → Google Nest/Home 스피커 캐스트
 */

import express from "express";
import cors from "cors";
import Client from "castv2-client";
const { DefaultMediaReceiver } = Client;

const app = express();
const PORT = 4000;

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 운영 환경 로깅
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
};

// 캐스트 가능한 스피커 목록 (환경변수에서 가져오기)
const SPEAKERS = {
  "living_room": process.env.SPEAKER_LIVING_ROOM || "192.168.1.100",
  "bedroom": process.env.SPEAKER_BEDROOM || "192.168.1.101", 
  "kitchen": process.env.SPEAKER_KITCHEN || "192.168.1.102"
};

// 활성 캐스트 연결 추적
const activeConnections = new Map();

// 🎵 스피커로 캐스트하는 함수
function castToSpeaker(host, audioUrl, metadata = {}) {
  return new Promise((resolve, reject) => {
    log(`🎧 ${host}로 캐스트 시작: ${audioUrl}`);
    
    const connectionId = `${host}-${Date.now()}`;
    const client = new Client();
    
    // 연결 타임아웃 설정
    const connectTimeout = setTimeout(() => {
      log(`⏰ ${host} 연결 타임아웃`, 'error');
      client.close();
      reject(new Error('Connection timeout'));
    }, 10000);
    
    client.connect(host, () => {
      clearTimeout(connectTimeout);
      log(`✅ ${host} 연결 성공`);
      
      // 기존 연결이 있으면 종료
      if (activeConnections.has(host)) {
        const oldConnection = activeConnections.get(host);
        oldConnection.client.close();
        log(`🔄 ${host} 기존 연결 종료`);
      }
      
      // 새 연결 저장
      activeConnections.set(host, { client, connectionId });
      
      client.launch(DefaultMediaReceiver, (err, player) => {
        if (err) {
          log(`❌ ${host} 미디어 리시버 실행 실패: ${err.message}`, 'error');
          activeConnections.delete(host);
          return reject(err);
        }
        
        log(`🎵 ${host} 미디어 리시버 실행 성공`);
        
        const media = {
          contentId: audioUrl,
          contentType: "audio/mpeg",
          streamType: "BUFFERED",
          metadata: {
            metadataType: 0,
            title: metadata.title || "🎧 YAGO 브리핑",
            subtitle: metadata.subtitle || "AI 음성 리포트",
            images: metadata.albumArt ? [{ url: metadata.albumArt }] : []
          }
        };
        
        player.load(media, { autoplay: true }, (err, status) => {
          if (err) {
            log(`❌ ${host} 미디어 로드 실패: ${err.message}`, 'error');
            activeConnections.delete(host);
            return reject(err);
          }
          
          log(`✅ ${host} 미디어 로드 성공: ${status.playerState}`);
          
          // 재생 상태 모니터링
          player.on('status', (status) => {
            log(`📊 ${host} 재생 상태: ${status.playerState}`);
            
            if (status.playerState === 'IDLE' && status.idleReason === 'FINISHED') {
              log(`🎉 ${host} 재생 완료`);
              activeConnections.delete(host);
              client.close();
              resolve({ success: true, finished: true });
            } else if (status.playerState === 'IDLE' && status.idleReason === 'CANCELLED') {
              log(`⏹️ ${host} 재생 취소됨`);
              activeConnections.delete(host);
              client.close();
              resolve({ success: true, cancelled: true });
            }
          });
          
          resolve({ success: true, status });
        });
      });
    });
    
    client.on('error', (err) => {
      clearTimeout(connectTimeout);
      log(`❌ ${host} 연결 오류: ${err.message}`, 'error');
      activeConnections.delete(host);
      reject(err);
    });
    
    client.on('close', () => {
      log(`🔌 ${host} 연결 종료`);
      activeConnections.delete(host);
    });
  });
}

// 🎧 메인 캐스트 엔드포인트
app.post("/", async (req, res) => {
  try {
    const { host, url, metadata } = req.body;
    
    if (!host || !url) {
      log('❌ host와 url이 필요합니다', 'error');
      return res.status(400).json({
        error: 'host와 url이 필요합니다'
      });
    }
    
    log(`📱 캐스트 요청: ${host} → ${url}`);
    
    const result = await castToSpeaker(host, url, metadata);
    
    log(`✅ 캐스트 성공: ${host}`, 'success');
    res.json({
      success: true,
      message: `${host}에서 재생 시작`,
      result
    });
    
  } catch (error) {
    log(`❌ 캐스트 오류: ${error.message}`, 'error');
    res.status(500).json({
      error: '캐스트 실패',
      details: error.message
    });
  }
});

// 📱 사용 가능한 스피커 목록
app.get("/speakers", (req, res) => {
  log('📱 스피커 목록 요청');
  res.json({
    speakers: SPEAKERS,
    activeConnections: Array.from(activeConnections.keys()),
    message: '사용 가능한 스피커 목록'
  });
});

// 🎧 특정 스피커로 브리핑 재생
app.post("/:speaker", async (req, res) => {
  try {
    const { speaker } = req.params;
    const { url, metadata } = req.body;
    
    const speakerIP = SPEAKERS[speaker];
    if (!speakerIP) {
      log(`❌ 지원하지 않는 스피커: ${speaker}`, 'error');
      return res.status(404).json({
        error: '지원하지 않는 스피커입니다',
        available: Object.keys(SPEAKERS)
      });
    }
    
    if (!url) {
      log('❌ url이 필요합니다', 'error');
      return res.status(400).json({
        error: 'url이 필요합니다'
      });
    }
    
    log(`🎧 ${speaker}(${speakerIP})로 브리핑 재생: ${url}`);
    
    const result = await castToSpeaker(speakerIP, url, metadata);
    
    log(`✅ ${speaker} 스피커 재생 성공`, 'success');
    res.json({
      success: true,
      message: `${speaker} 스피커에서 브리핑 재생 시작`,
      speaker: speaker,
      speakerIP: speakerIP,
      result
    });
    
  } catch (error) {
    log(`❌ ${req.params.speaker} 캐스트 오류: ${error.message}`, 'error');
    res.status(500).json({
      error: '스피커 재생 실패',
      details: error.message
    });
  }
});

// 🔍 상태 확인
app.get("/status", (req, res) => {
  const status = {
    status: 'running',
    timestamp: new Date().toISOString(),
    speakers: Object.keys(SPEAKERS).length,
    activeConnections: activeConnections.size,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    message: 'YAGO Cast Bridge 서버 정상 동작 중'
  };
  
  log('📊 상태 확인 요청');
  res.json(status);
});

// 🛑 서버 종료
app.post("/shutdown", (req, res) => {
  log('🛑 서버 종료 요청');
  
  // 모든 활성 연결 종료
  activeConnections.forEach(({ client }, host) => {
    log(`🔌 ${host} 연결 강제 종료`);
    client.close();
  });
  activeConnections.clear();
  
  res.json({ message: '서버를 종료합니다' });
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

// 헬스체크 엔드포인트
app.get("/health", (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  log(`🎧 YAGO Cast Bridge 서버 시작: http://0.0.0.0:${PORT}`);
  log(`📱 사용 가능한 스피커: ${Object.keys(SPEAKERS).join(', ')}`);
  log(`🎵 엔드포인트:`);
  log(`   POST / - 직접 캐스트`);
  log(`   POST /:speaker - 특정 스피커로 캐스트`);
  log(`   GET /speakers - 스피커 목록`);
  log(`   GET /status - 상태 확인`);
  log(`   GET /health - 헬스체크`);
});

// 에러 핸들링
process.on('uncaughtException', (err) => {
  log(`❌ 처리되지 않은 예외: ${err.message}`, 'error');
  console.error(err);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ 처리되지 않은 Promise 거부: ${reason}`, 'error');
  console.error(reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('🛑 SIGTERM 신호 수신, 서버 종료 중...');
  
  activeConnections.forEach(({ client }, host) => {
    log(`🔌 ${host} 연결 종료`);
    client.close();
  });
  
  process.exit(0);
});

process.on('SIGINT', () => {
  log('🛑 SIGINT 신호 수신, 서버 종료 중...');
  
  activeConnections.forEach(({ client }, host) => {
    log(`🔌 ${host} 연결 종료`);
    client.close();
  });
  
  process.exit(0);
});
