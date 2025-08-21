// 품질 평가 유틸리티
export interface QualityLevel {
  level: 'low' | 'mid' | 'high';
  percentage: number;
  message: string;
}

/**
 * 품질 점수를 레벨과 메시지로 변환
 * @param score 0~1 사이의 품질 점수
 * @returns 품질 레벨 정보
 */
export function getQualityLevel(score: number): QualityLevel {
  // 0~1 점수를 0~100%로 변환
  const percentage = Math.round(score * 100);
  
  // 임계치 기반 레벨 판정
  let level: 'low' | 'mid' | 'high';
  if (score < 0.40) {
    level = 'low';
  } else if (score < 0.70) {
    level = 'mid';
  } else {
    level = 'high';
  }
  
  // 레벨별 메시지
  const messages = {
    low: '품질이 낮습니다. 다시 촬영을 권장합니다.',
    mid: '보통입니다. 재촬영 시 개선될 수 있어요.',
    high: '좋아요! 이 사진을 사용해도 됩니다.'
  };
  
  return {
    level,
    percentage,
    message: messages[level]
  };
}

/**
 * 품질 레벨에 따른 색상 클래스 반환
 */
export function getQualityColorClass(level: 'low' | 'mid' | 'high'): string {
  const colorClasses = {
    low: 'text-red-600 bg-red-50 border-red-200',
    mid: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-green-600 bg-green-50 border-green-200'
  };
  
  return colorClasses[level];
}

/**
 * 품질 레벨에 따른 아이콘 반환
 */
export function getQualityIcon(level: 'low' | 'mid' | 'high'): string {
  const icons = {
    low: '⚠️',
    mid: '😐',
    high: '✅'
  };
  
  return icons[level];
} 