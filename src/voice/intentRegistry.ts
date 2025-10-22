// 바이브(음성) 명령 레지스트리 v1
export type Intent = {
  name: string;
  patterns: (string|RegExp)[];
  action: (ctx: { navigate: (p:string)=>void; jobId?: string }) => void;
};

export const intents: Intent[] = [
  { 
    name: 'goto_market', 
    patterns: ['마켓', /마켓(으로)?/], 
    action: ({navigate})=>navigate('/market') 
  },
  { 
    name: 'search_market', 
    patterns: [/마켓.*(찾아|검색)/], 
    action: ({navigate})=>navigate('/market?tab=search') 
  },
  { 
    name: 'goto_meetups', 
    patterns: ['모임', '클럽'], 
    action: ({navigate})=>navigate('/meetups') 
  },
  { 
    name: 'create_meetup', 
    patterns: [/모임.*(만들|생성)/], 
    action: ({navigate})=>navigate('/meetups/new') 
  },
  { 
    name: 'club_create', 
    patterns: ['우리팀 블로그 만들어', /클럽.*(생성|만들)/], 
    action: ({navigate})=>navigate('/clubs') 
  },
  { 
    name: 'club_post', 
    patterns: [/블로그.*(발행|올려)/], 
    action: ({navigate})=>navigate('/clubs') 
  },
  { 
    name: 'club_member_approve', 
    patterns: ['회원 승인'], 
    action: ({navigate})=>navigate('/clubs') 
  },
  { 
    name: 'academy_list', 
    patterns: ['아카데미', '유소년'], 
    action: ({navigate})=>navigate('/academies') 
  },
  { 
    name: 'att_start', 
    patterns: ['출석 시작', /U\d+ 출석/], 
    action: ({navigate})=>navigate('/academies') 
  },
  { 
    name: 'mark_late', 
    patterns: [/지각 (.+)/], 
    action: ({navigate})=>navigate('/academies') 
  },
  { 
    name: 'save_note', 
    patterns: [/훈련 노트 (.+)/], 
    action: ({navigate})=>navigate('/academies') 
  },
  { 
    name: 'goto_jobs', 
    patterns: ['구인구직', '일자리'], 
    action: ({navigate})=>navigate('/jobs') 
  },
  { 
    name: 'make_application', 
    patterns: ['취업 신청서', /지원서.*(만들|작성)/], 
    action: ({navigate})=>navigate('/jobs/apply') 
  },
  { 
    name: 'apply_this_job', 
    patterns: ['여기 지원', '이 공고 지원'], 
    action: ({navigate, jobId})=>navigate(`/jobs/${jobId||''}/apply`) 
  },
  { 
    name: 'goto_admin', 
    patterns: ['관리자 모드', /관리자(페이지)?/], 
    action: ({navigate})=>navigate('/admin') 
  },
];

// 음성 명령 처리 함수
export function processVoiceCommand(text: string, context: { navigate: (p:string)=>void; jobId?: string }): boolean {
  const normalizedText = text.toLowerCase().trim();
  
  for (const intent of intents) {
    for (const pattern of intent.patterns) {
      if (typeof pattern === 'string') {
        if (normalizedText.includes(pattern.toLowerCase())) {
          intent.action(context);
          return true;
        }
      } else if (pattern.test(normalizedText)) {
        intent.action(context);
        return true;
      }
    }
  }
  
  return false;
}

// 음성 명령 등록 (전역에서 사용)
export function registerVoiceCommands(context: { navigate: (p:string)=>void; jobId?: string }) {
  (window as any).processVoiceCommand = (text: string) => {
    return processVoiceCommand(text, context);
  };
}
