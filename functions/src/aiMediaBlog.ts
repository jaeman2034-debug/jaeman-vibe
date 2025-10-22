// functions/src/aiMediaBlog.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import OpenAI from "openai";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

// AI 이미지 생성 함수
async function genImage(client: OpenAI, prompt: string, size: "1024x1024" | "1792x1024") {
  const r = await client.images.generate({
    model: "dall-e-3",
    prompt,
    size,
    quality: "standard",
    n: 1
  });
  
  // URL에서 이미지 다운로드
  const response = await fetch(r.data[0].url!);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

// ffmpeg로 영상 생성
async function createVideo(images: string[], outputPath: string) {
  const tempDir = "/tmp";
  const imagePaths = images.map((img, i) => join(tempDir, `img${i}.jpg`));
  
  // 이미지 다운로드
  for (let i = 0; i < images.length; i++) {
    const file = bucket.file(images[i]);
    await file.download({ destination: imagePaths[i] });
  }

  // ffmpeg 명령어 구성
  const inputs = imagePaths.map(path => `-loop 1 -t 5 -i ${path}`).join(" ");
  const filter = `[0:v][1:v][2:v]concat=n=3:v=1:a=0,format=yuv420p`;
  
  const cmd = `ffmpeg ${inputs} -filter_complex "${filter}" -movflags +faststart ${outputPath}`;
  
  await execAsync(cmd);
  
  // 임시 파일 정리
  imagePaths.forEach(path => {
    try { unlinkSync(path); } catch {}
  });
}

export const aiGenerateClubMedia = onCall({ secrets: [OPENAI_API_KEY] }, async (req) => {
  const { clubId, memo, sport = "soccer", makeVideo = false, autopublish = false } = req.data || {};
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "LOGIN_REQUIRED");
  if (!clubId || !memo) throw new HttpsError("invalid-argument", "MISSING_ARGUMENTS");

  try {
    const client = new OpenAI({ apiKey: OPENAI_API_KEY.value() });
    const sportKo = {
      soccer: "축구", futsal: "풋살", basketball: "농구", baseball: "야구",
      tennis: "테니스", badminton: "배드민턴", tabletennis: "탁구", running: "러닝"
    }[sport] || "스포츠";

    const basePrompt = `스포츠 종목: ${sportKo}. 지역 아마추어 클럽 홍보용 배너. 현장감 있는 사진풍, 한국어 텍스트 없음, 팀 훈련/경기 느낌. 안전하고 긍정적인 분위기. 메모: ${memo}`;

    // 1) 이미지 생성
    const hero = await genImage(client, basePrompt + " / 16:9 넓은 배너", "1792x1024");
    const thumb1 = await genImage(client, basePrompt + " / 1:1 썸네일 A", "1024x1024");
    const thumb2 = await genImage(client, basePrompt + " / 1:1 썸네일 B", "1024x1024");

    // 2) Storage 업로드
    const stamp = Date.now();
    const [f1, f2, f3] = [
      bucket.file(`blogs/${clubId}/hero_${stamp}.jpg`),
      bucket.file(`blogs/${clubId}/thumb1_${stamp}.jpg`),
      bucket.file(`blogs/${clubId}/thumb2_${stamp}.jpg`),
    ];
    
    await Promise.all([
      f1.save(hero, { contentType: "image/jpeg" }),
      f2.save(thumb1, { contentType: "image/jpeg" }),
      f3.save(thumb2, { contentType: "image/jpeg" }),
    ]);
    
    const [u1, u2, u3] = await Promise.all([f1, f2, f3].map(f => f.getSignedUrl({
      action: "read", 
      expires: Date.now() + 1000 * 60 * 60 * 24 * 365 // 1년
    }).then(([url]) => url)));

    const imageUrls = [u1, u2, u3];
    
    // 3. 영상 생성 (ffmpeg) - 선택적
    let videoUrl = null;
    if (makeVideo) {
      try {
        const videoFileName = `blogs/${clubId}/reel.mp4`;
        const videoPath = `/tmp/reel_${Date.now()}.mp4`;
        
        await createVideo(
          images.map(img => img.url),
          videoPath
        );
        
        // 영상을 Storage에 업로드
        const videoFile = bucket.file(videoFileName);
        await videoFile.upload(videoPath, {
          metadata: { contentType: "video/mp4" }
        });
        
        videoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(videoFileName)}?alt=media`;
        
        // 임시 영상 파일 정리
        try { unlinkSync(videoPath); } catch {}
      } catch (videoError) {
        console.warn('Video generation failed, continuing without video:', videoError);
        // 영상 생성 실패해도 이미지는 계속 진행
      }
    }
    
    // 3) 본문에 붙일 HTML 구성
    const title = `[AI 미디어] ${memo}`;
    const contentHtml = `
<h2>${memo}</h2>
<p>${sportKo} 클럽에서 새로운 동료를 찾습니다!</p>

## 🖼 AI 생성 이미지
<p><img src="${u1}" alt="클럽 히어로" style="width:100%;max-width:800px;border-radius:8px;"></p>

## 🎞 훈련 장면
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0;">
  <img src="${u2}" alt="썸네일1" style="width:100%;border-radius:8px;">
  <img src="${u3}" alt="썸네일2" style="width:100%;border-radius:8px;">
</div>

<ul>
  <li>종목: ${sportKo}</li>
  <li>내용: ${memo}</li>
  <li>문의: 클럽 관리자에게 연락주세요</li>
</ul>

<p><strong>지금 바로 참여하세요!</strong></p>
    `.trim();

    // 4) Firestore에 저장
    const blogData = {
      clubId,
      title,
      content: contentHtml,
      content_markdown: contentHtml, // 호환성
      summary: `${memo}에 대한 ${sportKo} 클럽 공지사항입니다.`,
      tags: [sportKo, "모집", "클럽", "운동", "AI생성"],
      authorUid: req.auth.uid,
      published: autopublish,
      pinned: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      generatedByAI: true,
      sport,
      imageUrls,
      videoUrl,
      mediaGenerated: true
    };

    if (autopublish) {
      const ref = await db.collection(`clubs/${clubId}/blog`).add(blogData);
      return { 
        id: ref.id, 
        ...blogData, 
        published: true,
        message: "미디어 블로그가 발행되었습니다!"
      };
    } else {
      const ref = await db.collection(`clubs/${clubId}/blogPending`).add({
        ...blogData,
        status: "pending"
      });
      return { 
        id: ref.id, 
        ...blogData, 
        published: false,
        pending: true,
        message: "미디어 블로그가 대기열에 추가되었습니다!"
      };
    }

  } catch (e: any) {
    console.error("[MEDIA]", e);
    throw new HttpsError("failed-precondition", e?.message || "MEDIA_GENERATION_FAILED");
  }
});

// 네이버 블로그 크로스포스트
export const crossPostToNaver = onCall({ secrets: [OPENAI_API_KEY] }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("UNAUTHENTICATED");
  
  const { clubId, postId, naverAccessToken, categoryNo } = req.data || {};
  if (!clubId || !postId || !naverAccessToken) throw new Error("INVALID_ARGUMENT");

  try {
    // 블로그 포스트 가져오기
    const postSnap = await db.doc(`clubs/${clubId}/blog/${postId}`).get();
    if (!postSnap.exists) throw new Error("POST_NOT_FOUND");
    
    const post = postSnap.data()!;
    
    // 네이버 블로그 API 호출
    const url = "https://openapi.naver.com/blog/writePost.json";
    const body = new URLSearchParams({
      title: post.title,
      contents: post.content || post.content_markdown,
      ...(categoryNo ? { categoryNo: String(categoryNo) } : {})
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${naverAccessToken}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`네이버 블로그 발행 실패: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    // 크로스포스트 기록 저장
    await db.doc(`clubs/${clubId}/blog/${postId}`).update({
      naverPostId: result.postId,
      naverUrl: result.url,
      crossPostedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true, 
      naverPostId: result.postId,
      naverUrl: result.url,
      message: "네이버 블로그에 성공적으로 발행되었습니다!"
    };

  } catch (error) {
    console.error('네이버 크로스포스트 오류:', error);
    throw new Error(`크로스포스트 실패: ${error.message}`);
  }
});
