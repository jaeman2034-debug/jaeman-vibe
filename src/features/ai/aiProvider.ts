import type { Product, Group, Job } from '@/shared/types/product';

export type AIAnalysisResult = {
  title?: string;
  category?: string;
  price?: number;
  confidence: number;
};

export type GroupAnalysisResult = {
  title?: string;
  category?: string;
  desc?: string;
  maxMembers?: number;
  confidence: number;
};

export type JobAnalysisResult = {
  title?: string;
  company?: string;
  type?: 'fulltime' | 'parttime' | 'coach' | 'etc';
  salaryMin?: number;
  salaryMax?: number;
  desc?: string;
  confidence: number;
};

export type FieldLockStatus = {
  title: boolean;
  category?: boolean;
  price?: boolean;
  desc: boolean;
  company?: boolean;
  type?: boolean;
  salaryMin?: boolean;
  salaryMax?: boolean;
  maxMembers?: boolean;
};

/** AI 분석 실행 (Mock 또는 실제 API) */
export async function analyzeImage(file: File): Promise<AIAnalysisResult> {
  const endpoint = import.meta.env.VITE_AI_ENDPOINT;
  
  if (endpoint) {
    // 실제 AI API 호출
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('AI API 호출 실패:', error);
    }
  }
  
  // Mock 응답 (개발용)
  return mockImageAnalysis(file);
}

/** Mock 이미지 분석 (개발용) */
function mockImageAnalysis(file: File): AIAnalysisResult {
  const fileName = file.name.toLowerCase();
  
  // 파일명 기반 간단한 분석
  if (fileName.includes('soccer') || fileName.includes('축구')) {
    return {
      title: '축구용품',
      category: '축구',
      price: 50000,
      confidence: 0.8
    };
  }
  
  if (fileName.includes('basketball') || fileName.includes('농구')) {
    return {
      title: '농구용품',
      category: '농구',
      price: 30000,
      confidence: 0.7
    };
  }
  
  if (fileName.includes('tennis') || fileName.includes('테니스')) {
    return {
      title: '테니스용품',
      category: '테니스',
      price: 80000,
      confidence: 0.6
    };
  }
  
  // 기본 응답
  return {
    title: '스포츠용품',
    category: '기타',
    price: 25000,
    confidence: 0.5
  };
}

/** 모임 AI 분석 (제목 기반) */
export async function analyzeGroup(title: string): Promise<GroupAnalysisResult> {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('축구') || lowerTitle.includes('soccer')) {
    return {
      title: '축구 모임',
      category: '축구',
      desc: '매주 주말 축구 모임입니다. 초보자도 환영합니다.',
      maxMembers: 22,
      confidence: 0.8
    };
  }
  
  if (lowerTitle.includes('농구') || lowerTitle.includes('basketball')) {
    return {
      title: '농구 모임',
      category: '농구',
      desc: '실내 농구 모임입니다. 체력 단련과 즐거운 시간을 보내세요.',
      maxMembers: 10,
      confidence: 0.7
    };
  }
  
  if (lowerTitle.includes('테니스') || lowerTitle.includes('tennis')) {
    return {
      title: '테니스 모임',
      category: '테니스',
      desc: '테니스 초급/중급 모임입니다. 라켓은 개인 준비입니다.',
      maxMembers: 8,
      confidence: 0.6
    };
  }
  
  // 기본 응답
  return {
    title: '스포츠 모임',
    category: '기타',
    desc: '함께 운동하며 즐거운 시간을 보내는 모임입니다.',
    maxMembers: 15,
    confidence: 0.5
  };
}

/** 구직 AI 분석 (제목 기반) */
export async function analyzeJob(title: string): Promise<JobAnalysisResult> {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('코치') || lowerTitle.includes('coach')) {
    return {
      title: '스포츠 코치',
      company: '스포츠 센터',
      type: 'coach',
      desc: '체계적인 훈련 프로그램을 제공하는 코치를 모집합니다.',
      salaryMin: 3000000,
      salaryMax: 5000000,
      confidence: 0.8
    };
  }
  
  if (lowerTitle.includes('강사') || lowerTitle.includes('instructor')) {
    return {
      title: '스포츠 강사',
      company: '피트니스 클럽',
      type: 'parttime',
      desc: '개인/그룹 레슨을 담당할 강사를 모집합니다.',
      salaryMin: 25000,
      salaryMax: 50000,
      confidence: 0.7
    };
  }
  
  if (lowerTitle.includes('매니저') || lowerTitle.includes('manager')) {
    return {
      title: '스포츠 시설 매니저',
      company: '스포츠 센터',
      type: 'fulltime',
      desc: '시설 운영과 고객 관리를 담당할 매니저를 모집합니다.',
      salaryMin: 3500000,
      salaryMax: 4500000,
      confidence: 0.6
    };
  }
  
  // 기본 응답
  return {
    title: '스포츠 관련 구인',
    company: '스포츠 기업',
    type: 'etc',
    desc: '스포츠 관련 업무를 담당할 인재를 모집합니다.',
    confidence: 0.5
  };
}

/** 필드 잠금 상태 확인 (상품) */
export function getFieldLockStatus(
  currentValues: Partial<Product>,
  userModifiedFields: Set<string>
): FieldLockStatus {
  return {
    title: userModifiedFields.has('title') || !!currentValues.title,
    category: userModifiedFields.has('category') || !!currentValues.category,
    price: userModifiedFields.has('price') || !!currentValues.price,
    desc: userModifiedFields.has('desc') || !!currentValues.desc,
  };
}

/** 필드 잠금 상태 확인 (모임) */
export function getGroupFieldLockStatus(
  currentValues: Partial<Group>,
  userModifiedFields: Set<string>
): FieldLockStatus {
  return {
    title: userModifiedFields.has('title') || !!currentValues.title,
    category: userModifiedFields.has('category') || !!currentValues.category,
    desc: userModifiedFields.has('desc') || !!currentValues.desc,
    maxMembers: userModifiedFields.has('maxMembers') || !!currentValues.maxMembers,
  };
}

/** 필드 잠금 상태 확인 (구직) */
export function getJobFieldLockStatus(
  currentValues: Partial<Job>,
  userModifiedFields: Set<string>
): FieldLockStatus {
  return {
    title: userModifiedFields.has('title') || !!currentValues.title,
    company: userModifiedFields.has('company') || !!currentValues.company,
    type: userModifiedFields.has('type') || !!currentValues.type,
    desc: userModifiedFields.has('desc') || !!currentValues.desc,
    salaryMin: userModifiedFields.has('salaryMin') || !!currentValues.salaryMin,
    salaryMax: userModifiedFields.has('salaryMax') || !!currentValues.salaryMax,
  };
}

/** AI 제안 적용 (잠긴 필드는 건드리지 않음) - 상품 */
export function applyAISuggestions(
  currentValues: Partial<Product>,
  aiResult: AIAnalysisResult,
  fieldLocks: FieldLockStatus
): Partial<Product> {
  const suggestions: Partial<Product> = {};
  
  if (!fieldLocks.title && aiResult.title) {
    suggestions.title = aiResult.title;
  }
  
  if (!fieldLocks.category && aiResult.category) {
    suggestions.category = aiResult.category;
  }
  
  if (!fieldLocks.price && aiResult.price) {
    suggestions.price = aiResult.price;
  }
  
  return { ...currentValues, ...suggestions };
}

/** AI 제안 적용 (잠긴 필드는 건드리지 않음) - 모임 */
export function applyGroupAISuggestions(
  currentValues: Partial<Group>,
  aiResult: GroupAnalysisResult,
  fieldLocks: FieldLockStatus
): Partial<Group> {
  const suggestions: Partial<Group> = {};
  
  if (!fieldLocks.title && aiResult.title) {
    suggestions.title = aiResult.title;
  }
  
  if (!fieldLocks.category && aiResult.category) {
    suggestions.category = aiResult.category;
  }
  
  if (!fieldLocks.desc && aiResult.desc) {
    suggestions.desc = aiResult.desc;
  }
  
  if (!fieldLocks.maxMembers && aiResult.maxMembers) {
    suggestions.maxMembers = aiResult.maxMembers;
  }
  
  return { ...currentValues, ...suggestions };
}

/** AI 제안 적용 (잠긴 필드는 건드리지 않음) - 구직 */
export function applyJobAISuggestions(
  currentValues: Partial<Job>,
  aiResult: JobAnalysisResult,
  fieldLocks: FieldLockStatus
): Partial<Job> {
  const suggestions: Partial<Job> = {};
  
  if (!fieldLocks.title && aiResult.title) {
    suggestions.title = aiResult.title;
  }
  
  if (!fieldLocks.company && aiResult.company) {
    suggestions.company = aiResult.company;
  }
  
  if (!fieldLocks.type && aiResult.type) {
    suggestions.type = aiResult.type;
  }
  
  if (!fieldLocks.desc && aiResult.desc) {
    suggestions.desc = aiResult.desc;
  }
  
  if (!fieldLocks.salaryMin && aiResult.salaryMin) {
    suggestions.salaryMin = aiResult.salaryMin;
  }
  
  if (!fieldLocks.salaryMax && aiResult.salaryMax) {
    suggestions.salaryMax = aiResult.salaryMax;
  }
  
  return { ...currentValues, ...suggestions };
}
