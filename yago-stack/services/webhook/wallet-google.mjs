import jwt from 'jsonwebtoken';
import { readFile } from 'node:fs/promises';
import { readTicket } from './utils/tickets.mjs';

/**
 * Google Wallet (JWT 링크) 발급 스텁
 * 
 * 실제 구현을 위해서는:
 * 1. Google Pay Console에서 발급자 등록
 * 2. 서비스 계정 생성 및 키 다운로드
 * 3. Pass 클래스 생성 및 등록
 */

/**
 * Google Wallet Save to Google Pay 링크 생성
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function googleWalletLink(req, res) {
  try {
    const ticketId = req.params.id;
    const ticket = await readTicket(ticketId);
    
    // Google Wallet 설정 확인
    const issuerId = process.env.GW_ISSUER;
    const privateKeyPath = process.env.GW_PRIVATE_KEY_PATH;
    
    if (!issuerId || !privateKeyPath) {
      return res.status(501).json({
        error: 'Google Wallet not configured',
        message: 'GW_ISSUER, GW_PRIVATE_KEY_PATH 환경변수가 필요합니다.',
        ticketId,
        ticket: {
          id: ticket.id,
          meetupId: ticket.meetupId,
          state: ticket.state
        }
      });
    }
    
    try {
      // 개인키 파일 읽기
      const privateKey = await readFile(privateKeyPath, 'utf8');
      
      // JWT 페이로드 구성
      const now = Math.floor(Date.now() / 1000);
      const claims = {
        iss: issuerId,
        aud: 'google',
        typ: 'savetowallet',
        iat: now,
        exp: now + 3600, // 1시간 유효
        origins: [process.env.DOMAIN || 'http://localhost'],
        payload: {
          eventTicketObjects: [
            {
              id: `${issuerId}.${ticket.id}`,
              classId: `${issuerId}.YAGO_EVENT_TICKET_CLASS`,
              state: ticket.state === 'cancelled' ? 'INACTIVE' : 'ACTIVE',
              barcode: {
                type: 'QR_CODE',
                value: `/checkin?id=${ticket.id}&sig=...`
              },
              ticketHolderName: ticket.user?.name || 'Guest',
              ticketNumber: ticket.id,
              eventName: `YAGO Meetup ${ticket.meetupId}`,
              eventDateTime: ticket.eventStart ? new Date(ticket.eventStart).toISOString() : undefined,
              venue: {
                name: 'YAGO Sports Venue',
                address: 'Seoul, South Korea'
              }
            }
          ]
        }
      };
      
      // JWT 토큰 생성
      const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });
      
      // Google Pay Save URL 생성
      const saveUrl = `https://pay.google.com/gp/v/save/${token}`;
      
      res.json({
        success: true,
        ticketId,
        saveUrl,
        qrCode: saveUrl, // QR 코드용 URL
        instructions: {
          mobile: '모바일에서 링크를 클릭하면 Google Pay에 추가됩니다.',
          desktop: '데스크톱에서는 QR 코드를 모바일로 스캔하세요.'
        }
      });
      
    } catch (keyError) {
      console.error('Failed to read private key:', keyError);
      res.status(501).json({
        error: 'Private key not found',
        message: 'Google Wallet 개인키 파일을 찾을 수 없습니다.',
        path: privateKeyPath
      });
    }
    
  } catch (e) {
    console.error('[google-wallet]', e);
    res.status(500).json({ error: 'Google Wallet link generation failed' });
  }
}

/**
 * Google Wallet Pass 클래스 생성 (개발용)
 */
export async function createPassClass() {
  const issuerId = process.env.GW_ISSUER;
  const privateKeyPath = process.env.GW_PRIVATE_KEY_PATH;
  
  if (!issuerId || !privateKeyPath) {
    throw new Error('Google Wallet not configured');
  }
  
  try {
    const privateKey = await readFile(privateKeyPath, 'utf8');
    
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      iss: issuerId,
      aud: 'google',
      typ: 'walletobjects',
      iat: now,
      exp: now + 3600,
      payload: {
        eventTicketClass: {
          id: `${issuerId}.YAGO_EVENT_TICKET_CLASS`,
          classTemplateInfo: {
            cardTemplateOverride: {
              cardRowTemplateInfos: [
                {
                  twoItems: {
                    startItem: {
                      firstValue: {
                        fields: [
                          {
                            fieldPath: 'object.textModulesData["eventName"]'
                          }
                        ]
                      }
                    },
                    endItem: {
                      firstValue: {
                        fields: [
                          {
                            fieldPath: 'object.textModulesData["date"]'
                          }
                        ]
                      }
                    }
                  }
                }
              ]
            }
          },
          eventName: {
            defaultValue: {
              language: 'ko-KR',
              value: 'YAGO Sports Event'
            }
          },
          venue: {
            name: {
              defaultValue: {
                language: 'ko-KR',
                value: 'YAGO Sports Venue'
              }
            }
          },
          reviewStatus: 'UNDER_REVIEW'
        }
      }
    };
    
    const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });
    
    // Google Wallet Objects API에 클래스 생성 요청
    const response = await fetch('https://walletobjects.googleapis.com/walletobjects/v1/eventTicketClass', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(claims.payload.eventTicketClass)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Google Wallet Pass Class created:', result.id);
      return result;
    } else {
      const error = await response.text();
      console.error('Failed to create pass class:', error);
      throw new Error(`Pass class creation failed: ${response.status}`);
    }
    
  } catch (e) {
    console.error('Failed to create Google Wallet pass class:', e);
    throw e;
  }
}
