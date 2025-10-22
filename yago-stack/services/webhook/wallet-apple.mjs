import fs from 'node:fs/promises';
import path from 'node:path';
import { readTicket } from './utils/tickets.mjs';

/**
 * Apple Wallet (.pkpass) 발급 스텁
 * 
 * 실제 구현을 위해서는:
 * 1. Apple Developer Program 등록
 * 2. Pass Type ID 생성
 * 3. WWDR 인증서 다운로드
 * 4. Pass Signing 인증서 생성
 * 5. passkit-generator 패키지 설치
 */

/**
 * Apple Pass 생성 (스텁)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function applePass(req, res) {
  try {
    const ticketId = req.params.id;
    const ticket = await readTicket(ticketId);
    
    // 인증서 경로 확인
    const wwdrPath = process.env.WWDR_CERT_PATH;
    const signerCertPath = process.env.PASS_SIGNER_CERT_PATH;
    const signerKeyPath = process.env.PASS_SIGNER_KEY_PATH;
    
    if (!wwdrPath || !signerCertPath || !signerKeyPath) {
      return res.status(501).json({
        error: 'Apple Wallet certificates not configured',
        message: 'WWDR_CERT_PATH, PASS_SIGNER_CERT_PATH, PASS_SIGNER_KEY_PATH 환경변수가 필요합니다.'
      });
    }
    
    // TODO: 실제 passkit-generator 사용
    /*
    import { PKPass } from 'passkit-generator';
    
    const modelPath = path.join(process.cwd(), 'assets', 'apple-pass-model');
    const pass = await PKPass.from({
      model: modelPath,
      certificates: {
        wwdr: wwdrPath,
        signerCert: signerCertPath,
        signerKey: {
          keyFile: signerKeyPath,
          passphrase: process.env.PASS_SIGNER_KEY_PASSPHRASE
        }
      }
    }, {
      serialNumber: ticket.id,
      description: `YAGO Ticket ${ticket.meetupId}`,
      organizationName: 'YAGO SPORTS',
      foregroundColor: 'rgb(255,255,255)',
      backgroundColor: 'rgb(0,0,0)',
      barcode: {
        message: `/checkin?id=${ticket.id}&sig=...`,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1'
      }
    });
    
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.send(await pass.asBuffer());
    */
    
    // 스텁 응답
    res.status(501).json({
      error: 'Apple Wallet not implemented',
      message: 'Apple Wallet 발급 기능은 준비 중입니다.',
      ticketId,
      ticket: {
        id: ticket.id,
        meetupId: ticket.meetupId,
        state: ticket.state
      },
      requiredCertificates: {
        wwdr: wwdrPath,
        signerCert: signerCertPath,
        signerKey: signerKeyPath
      }
    });
    
  } catch (e) {
    console.error('[apple-pass]', e);
    res.status(500).json({ error: 'Apple Pass generation failed' });
  }
}

/**
 * Apple Pass 모델 생성 (개발용)
 */
export async function createPassModel() {
  const modelPath = path.join(process.cwd(), 'assets', 'apple-pass-model');
  
  try {
    await fs.mkdir(modelPath, { recursive: true });
    
    // 기본 pass.json 템플릿
    const passTemplate = {
      "formatVersion": 1,
      "passTypeIdentifier": "pass.com.yago.sports.ticket",
      "serialNumber": "{{serialNumber}}",
      "teamIdentifier": "YAGO123456",
      "organizationName": "YAGO SPORTS",
      "description": "{{description}}",
      "logoText": "YAGO",
      "foregroundColor": "rgb(255,255,255)",
      "backgroundColor": "rgb(0,0,0)",
      "labelColor": "rgb(255,255,255)",
      "eventTicket": {
        "primaryFields": [
          {
            "key": "event",
            "label": "EVENT",
            "value": "{{eventName}}"
          }
        ],
        "secondaryFields": [
          {
            "key": "venue",
            "label": "VENUE",
            "value": "{{venue}}"
          }
        ],
        "auxiliaryFields": [
          {
            "key": "date",
            "label": "DATE",
            "value": "{{date}}"
          }
        ],
        "backFields": [
          {
            "key": "terms",
            "label": "TERMS & CONDITIONS",
            "value": "This ticket is non-transferable and non-refundable."
          }
        ]
      },
      "barcode": {
        "message": "{{checkinUrl}}",
        "format": "PKBarcodeFormatQR",
        "messageEncoding": "iso-8859-1"
      }
    };
    
    await fs.writeFile(
      path.join(modelPath, 'pass.json'),
      JSON.stringify(passTemplate, null, 2)
    );
    
    console.log('Apple Pass model created at:', modelPath);
    return modelPath;
  } catch (e) {
    console.error('Failed to create pass model:', e);
    throw e;
  }
}
