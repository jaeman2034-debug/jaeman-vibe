import * as admin from 'firebase-admin';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { logAuditEvent } from './audit';

/**
 * 이미지 처리 유틸리티
 * EXIF 제거, 썸네일 생성, 해시 계산
 */

interface ImageProcessingResult {
  hash: string;
  originalSize: number;
  processedSize: number;
  thumbnailSize: number;
  smallSize: number;
}

/**
 * 이미지 처리 메인 함수
 */
export async function processImage(gcsPath: string): Promise<ImageProcessingResult> {
  const bucket = admin.storage().bucket();
  
  try {
    // 원본 파일 다운로드
    const [fileBuffer] = await bucket.file(gcsPath).download();
    const originalSize = fileBuffer.length;
    
    // Sharp를 사용한 이미지 처리 (실제 구현에서는 sharp 패키지 필요)
    const processedImage = await processImageWithSharp(fileBuffer);
    
    // 썸네일 생성
    const thumbnail = await generateThumbnail(processedImage, 800);
    const small = await generateThumbnail(processedImage, 320);
    
    // 해시 계산
    const hash = await calculateImageHash(processedImage);
    
    // 파일 저장
    const dir = gcsPath.replace(/\/([^/]+)$/, '');
    const baseName = gcsPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'image';
    
    await Promise.all([
      bucket.file(`${dir}/thumb_${baseName}.jpg`).save(thumbnail),
      bucket.file(`${dir}/small_${baseName}.jpg`).save(small),
      bucket.file(`${dir}/processed_${baseName}.jpg`).save(processedImage)
    ]);
    
    return {
      hash,
      originalSize,
      processedSize: processedImage.length,
      thumbnailSize: thumbnail.length,
      smallSize: small.length
    };
  } catch (error) {
    console.error('Image processing failed:', error);
    throw error;
  }
}

/**
 * Sharp를 사용한 이미지 처리 (EXIF 제거, 최적화)
 */
async function processImageWithSharp(buffer: Buffer): Promise<Buffer> {
  // 실제 구현에서는 sharp 패키지를 사용
  // const sharp = require('sharp');
  // return await sharp(buffer)
  //   .withMetadata(false) // EXIF 제거
  //   .jpeg({ quality: 82 })
  //   .toBuffer();
  
  // 시뮬레이션 (실제로는 sharp 사용)
  return buffer;
}

/**
 * 썸네일 생성
 */
async function generateThumbnail(buffer: Buffer, size: number): Promise<Buffer> {
  // 실제 구현에서는 sharp 사용
  // const sharp = require('sharp');
  // return await sharp(buffer)
  //   .resize(size, size, { fit: 'inside', withoutEnlargement: true })
  //   .jpeg({ quality: 80 })
  //   .toBuffer();
  
  // 시뮬레이션
  return buffer;
}

/**
 * 이미지 해시 계산 (중복 탐지용)
 */
async function calculateImageHash(buffer: Buffer): Promise<string> {
  // 실제 구현에서는 image-hash 또는 perceptual-hash 패키지 사용
  // const crypto = require('crypto');
  // return crypto.createHash('sha256').update(buffer).digest('hex');
  
  // 시뮬레이션
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * 이미지 업로드 트리거는 index.ts로 이동됨
 */

/**
 * 중복 이미지 검사
 */
export async function checkDuplicateImage(hash: string): Promise<{
  isDuplicate: boolean;
  existingPath?: string;
}> {
  try {
    const db = admin.firestore();
    const snapshot = await db.collectionGroup('market')
      .where('imageHash', '==', hash)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return { isDuplicate: false };
    }
    
    const doc = snapshot.docs[0];
    return {
      isDuplicate: true,
      existingPath: doc.ref.path
    };
  } catch (error) {
    console.error('Duplicate check failed:', error);
    return { isDuplicate: false };
  }
}

/**
 * 이미지 삭제 (원본, 썸네일, 작은 버전 모두)
 */
export async function deleteImageVariants(gcsPath: string): Promise<void> {
  const bucket = admin.storage().bucket();
  const dir = gcsPath.replace(/\/([^/]+)$/, '');
  const baseName = gcsPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'image';
  
  const variants = [
    gcsPath, // 원본
    `${dir}/processed_${baseName}.jpg`,
    `${dir}/thumb_${baseName}.jpg`,
    `${dir}/small_${baseName}.jpg`
  ];
  
  await Promise.all(
    variants.map(async (path) => {
      try {
        await bucket.file(path).delete();
      } catch (error) {
        // 파일이 없어도 에러 무시
        console.log('File not found (ignoring):', path);
      }
    })
  );
}
