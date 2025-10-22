/**
 * 🎧 로컬 캐스트 브릿지 서버
 * Google Cast SDK를 사용하여 스마트 스피커로 음성 재생
 * 
 * 설치: npm install castv2-client express cors
 * 실행: node cast-bridge-server.js
 */

const express = require('express');
const cors = require('cors');
const { Client, DefaultMediaReceiver } = require('castv2-client');

const app = express();
const PORT = 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// 캐스트 가능한 스피커 목록
const SPEAKERS = {
  "living_room": "192.168.1.100", // 거실 Google Nest IP
  "bedroom": "192.168.1.101",     // 침실 Google Home IP
  "kitchen": "192.168.1.102"      // 주방 Google Mini IP
};

// 🎵 스피커로 캐스트하는 함수
function castToSpeaker(host, mediaUrl, metadata = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🎧 ${host}로 캐스트 시작: ${mediaUrl}`);
    
    const client = new Client();
    
    client.connect(host, () => {
      console.log(`✅ ${host} 연결 성공`);
      
      client.launch(DefaultMediaReceiver, (err, player) => {
        if (err) {
          console.error(`❌ ${host} 미디어 리시버 실행 실패:`, err);
          return reject(err);
        }
        
        console.log(`🎵 ${host} 미디어 리시버 실행 성공`);
        
        const media = {
          contentId: mediaUrl,
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
            console.error(`❌ ${host} 미디어 로드 실패:`, err);
            return reject(err);
          }
          
          console.log(`✅ ${host} 미디어 로드 성공:`, status);
          
          // 재생 상태 모니터링
          player.on('status', (status) => {
            console.log(`📊 ${host} 재생 상태:`, status.playerState);
            
            if (status.playerState === 'IDLE' && status.idleReason === 'FINISHED') {
              console.log(`🎉 ${host} 재생 완료`);
              client.close();
              resolve({ success: true, finished: true });
            }
          });
          
          resolve({ success: true, status });
        });
      });
    });
    
    client.on('error', (err) => {
      console.error(`❌ ${host} 연결 오류:`, err);
      reject(err);
    });
    
    // 타임아웃 설정 (30초)
    setTimeout(() => {
      console.log(`⏰ ${host} 연결 타임아웃`);
      client.close();
      reject(new Error('Connection timeout'));
    }, 30000);
  });
}

// 🎧 캐스트 엔드포인트
app.post('/cast', async (req, res) => {
  try {
    const { speakerIP, audioUrl, metadata } = req.body;
    
    if (!speakerIP || !audioUrl) {
      return res.status(400).json({
        error: 'speakerIP와 audioUrl이 필요합니다'
      });
    }
    
    console.log(`📱 캐스트 요청: ${speakerIP} → ${audioUrl}`);
    
    const result = await castToSpeaker(speakerIP, audioUrl, metadata);
    
    res.json({
      success: true,
      message: `${speakerIP}에서 재생 시작`,
      result
    });
    
  } catch (error) {
    console.error('❌ 캐스트 오류:', error);
    res.status(500).json({
      error: '캐스트 실패',
      details: error.message
    });
  }
});

// 📱 사용 가능한 스피커 목록
app.get('/speakers', (req, res) => {
  res.json({
    speakers: SPEAKERS,
    message: '사용 가능한 스피커 목록'
  });
});

// 🎧 특정 스피커로 브리핑 재생
app.post('/cast/:speaker', async (req, res) => {
  try {
    const { speaker } = req.params;
    const { audioUrl, metadata } = req.body;
    
    const speakerIP = SPEAKERS[speaker];
    if (!speakerIP) {
      return res.status(404).json({
        error: '지원하지 않는 스피커입니다',
        available: Object.keys(SPEAKERS)
      });
    }
    
    if (!audioUrl) {
      return res.status(400).json({
        error: 'audioUrl이 필요합니다'
      });
    }
    
    console.log(`🎧 ${speaker}(${speakerIP})로 브리핑 재생: ${audioUrl}`);
    
    const result = await castToSpeaker(speakerIP, audioUrl, metadata);
    
    res.json({
      success: true,
      message: `${speaker} 스피커에서 브리핑 재생 시작`,
      speaker: speaker,
      speakerIP: speakerIP,
      result
    });
    
  } catch (error) {
    console.error(`❌ ${req.params.speaker} 캐스트 오류:`, error);
    res.status(500).json({
      error: '스피커 재생 실패',
      details: error.message
    });
  }
});

// 🔍 상태 확인
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    speakers: Object.keys(SPEAKERS).length,
    message: '캐스트 브릿지 서버 정상 동작 중'
  });
});

// 🛑 서버 종료
app.post('/shutdown', (req, res) => {
  console.log('🛑 서버 종료 요청');
  res.json({ message: '서버를 종료합니다' });
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🎧 캐스트 브릿지 서버 시작: http://localhost:${PORT}`);
  console.log(`📱 사용 가능한 스피커: ${Object.keys(SPEAKERS).join(', ')}`);
  console.log(`🎵 엔드포인트:`);
  console.log(`   POST /cast - 직접 캐스트`);
  console.log(`   POST /cast/:speaker - 특정 스피커로 캐스트`);
  console.log(`   GET /speakers - 스피커 목록`);
  console.log(`   GET /status - 상태 확인`);
});

// 에러 핸들링
process.on('uncaughtException', (err) => {
  console.error('❌ 처리되지 않은 예외:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 처리되지 않은 Promise 거부:', reason);
});

module.exports = app;
