import { Sport, Branch, Leaf } from '@/types/meetups';

// 가지(Branch) 라벨 매핑
export const BRANCH_LABEL: Record<Branch, string> = {
  scrimmage: '경기/스파링',
  academy: '아카데미',
  women_teams: '여성·팀 구성',
  referees: '심판',
  training: '훈련/클리닉',
  league: '리그/대회',
  flash: '번개',
  all: '전체'
};

// 모든 가지 목록
export const BRANCHES: Branch[] = ['all', 'scrimmage', 'academy', 'women_teams', 'referees', 'training', 'league', 'flash'];

// 종목별 택소노미 구조
export const TAXONOMY: Record<Sport, Record<Branch, Leaf[]>> = {
  soccer: {
    all: [],
    scrimmage: ['5v5', '7v7', '11v11', '포지션별', '혼성팀', '남성팀'],
    academy: ['U10', 'U12', 'U15', 'U18', '성인입문', '성인중급', '성인고급', '엘리트'],
    women_teams: ['여성전용', '혼성팀빌딩', '초보환영', '중급이상'],
    referees: ['자격교육', '배정신청', '심판모임', '규칙학습'],
    training: ['드리블', '슛', '패스', '수비', '골키퍼', '체력훈련'],
    league: ['3x3컵', '5v5리그', '11v11리그', '토너먼트', '친선경기'],
    flash: ['점심번개', '저녁번개', '주말번개', '야간번개']
  },
  basketball: {
    all: [],
    scrimmage: ['3v3', '5v5', '하프코트', '풀코트', '혼성팀', '남성팀'],
    academy: ['U10', 'U12', 'U15', 'U18', '성인입문', '성인중급', '성인고급'],
    women_teams: ['여성전용', '혼성팀빌딩', '초보환영', '중급이상'],
    referees: ['자격교육', '배정신청', '심판모임', '규칙학습'],
    training: ['슛', '드리블', '패스', '수비', '체력훈련', '개인기술'],
    league: ['3x3컵', '5v5리그', '토너먼트', '친선경기'],
    flash: ['점심번개', '저녁번개', '주말번개', '야간번개']
  },
  tennis: {
    all: [],
    scrimmage: ['싱글', '더블', '혼성더블', '초보자', '중급자', '고급자'],
    academy: ['입문반', '초급반', '중급반', '고급반', '개인레슨', '그룹레슨'],
    women_teams: ['여성전용', '혼성팀', '초보환영', '중급이상'],
    referees: ['자격교육', '배정신청', '심판모임', '규칙학습'],
    training: ['포핸드', '백핸드', '서브', '발리', '스매시', '체력훈련'],
    league: ['싱글리그', '더블리그', '토너먼트', '친선경기'],
    flash: ['점심번개', '저녁번개', '주말번개', '야간번개']
  },
  badminton: {
    all: [],
    scrimmage: ['싱글', '더블', '혼성더블', '초보자', '중급자', '고급자'],
    academy: ['입문반', '초급반', '중급반', '고급반', '개인레슨', '그룹레슨'],
    women_teams: ['여성전용', '혼성팀', '초보환영', '중급이상'],
    referees: ['자격교육', '배정신청', '심판모임', '규칙학습'],
    training: ['포핸드', '백핸드', '서브', '스매시', '드롭', '체력훈련'],
    league: ['싱글리그', '더블리그', '토너먼트', '친선경기'],
    flash: ['점심번개', '저녁번개', '주말번개', '야간번개']
  },
  volleyball: {
    all: [],
    scrimmage: ['6v6', '4v4', '2v2', '혼성팀', '남성팀', '여성팀'],
    academy: ['입문반', '초급반', '중급반', '고급반', '개인레슨', '그룹레슨'],
    women_teams: ['여성전용', '혼성팀', '초보환영', '중급이상'],
    referees: ['자격교육', '배정신청', '심판모임', '규칙학습'],
    training: ['서브', '리시브', '세팅', '스파이크', '블로킹', '체력훈련'],
    league: ['6v6리그', '4v4리그', '토너먼트', '친선경기'],
    flash: ['점심번개', '저녁번개', '주말번개', '야간번개']
  },
  baseball: {
    all: [],
    scrimmage: ['9v9', '7v7', '5v5', '혼성팀', '남성팀', '여성팀'],
    academy: ['입문반', '초급반', '중급반', '고급반', '개인레슨', '그룹레슨'],
    women_teams: ['여성전용', '혼성팀', '초보환영', '중급이상'],
    referees: ['자격교육', '배정신청', '심판모임', '규칙학습'],
    training: ['타격', '투구', '수비', '주루', '체력훈련', '개인기술'],
    league: ['9v9리그', '7v7리그', '토너먼트', '친선경기'],
    flash: ['점심번개', '저녁번개', '주말번개', '야간번개']
  },
  swimming: {
    all: [],
    scrimmage: ['자유형', '배영', '평영', '접영', '혼영', '릴레이'],
    academy: ['입문반', '초급반', '중급반', '고급반', '개인레슨', '그룹레슨'],
    women_teams: ['여성전용', '혼성팀', '초보환영', '중급이상'],
    referees: ['자격교육', '배정신청', '심판모임', '규칙학습'],
    training: ['자유형', '배영', '평영', '접영', '스타트', '턴', '체력훈련'],
    league: ['자유형리그', '혼영리그', '토너먼트', '친선경기'],
    flash: ['점심번개', '저녁번개', '주말번개', '야간번개']
  },
  running: {
    all: [],
    scrimmage: ['5K', '10K', '하프마라톤', '마라톤', '트레일러닝', '트랙'],
    academy: ['입문반', '초급반', '중급반', '고급반', '개인코칭', '그룹코칭'],
    women_teams: ['여성전용', '혼성팀', '초보환영', '중급이상'],
    referees: ['자격교육', '배정신청', '심판모임', '규칙학습'],
    training: ['인터벌', '템포런', '장거리', '스피드', '체력훈련', '폼교정'],
    league: ['5K리그', '10K리그', '하프마라톤리그', '토너먼트', '친선경기'],
    flash: ['점심번개', '저녁번개', '주말번개', '야간번개']
  },
  cycling: {
    all: [],
    scrimmage: ['로드', 'MTB', 'BMX', '트랙', '혼성팀', '남성팀'],
    academy: ['입문반', '초급반', '중급반', '고급반', '개인레슨', '그룹레슨'],
    women_teams: ['여성전용', '혼성팀', '초보환영', '중급이상'],
    referees: ['자격교육', '배정신청', '심판모임', '규칙학습'],
    training: ['클라이밍', '스프린트', '인터벌', '체력훈련', '기술훈련'],
    league: ['로드리그', 'MTB리그', '토너먼트', '친선경기'],
    flash: ['점심번개', '저녁번개', '주말번개', '야간번개']
  },
  climbing: {
    all: [],
    scrimmage: ['볼더링', '리드', '스피드', '초보자', '중급자', '고급자'],
    academy: ['입문반', '초급반', '중급반', '고급반', '개인레슨', '그룹레슨'],
    women_teams: ['여성전용', '혼성팀', '초보환영', '중급이상'],
    referees: ['자격교육', '배정신청', '심판모임', '규칙학습'],
    training: ['볼더링', '리드', '스피드', '체력훈련', '기술훈련', '안전교육'],
    league: ['볼더링리그', '리드리그', '스피드리그', '토너먼트', '친선경기'],
    flash: ['점심번개', '저녁번개', '주말번개', '야간번개']
  },
  golf: {
    all: [],
    scrimmage: ['9홀', '18홀', '초보자', '중급자', '고급자', '혼성팀'],
    academy: ['입문반', '초급반', '중급반', '고급반', '개인레슨', '그룹레슨'],
    women_teams: ['여성전용', '혼성팀', '초보환영', '중급이상'],
    referees: ['자격교육', '배정신청', '심판모임', '규칙학습'],
    training: ['드라이버', '아이언', '웨지', '퍼팅', '체력훈련', '기술훈련'],
    league: ['9홀리그', '18홀리그', '토너먼트', '친선경기'],
    flash: ['점심번개', '저녁번개', '주말번개', '야간번개']
  },
  etc: {
    all: [],
    scrimmage: ['일반', '초보자', '중급자', '고급자', '혼성팀', '남성팀'],
    academy: ['입문반', '초급반', '중급반', '고급반', '개인레슨', '그룹레슨'],
    women_teams: ['여성전용', '혼성팀', '초보환영', '중급이상'],
    referees: ['자격교육', '배정신청', '심판모임', '규칙학습'],
    training: ['기본기', '고급기', '체력훈련', '기술훈련', '전략훈련'],
    league: ['일반리그', '토너먼트', '친선경기'],
    flash: ['점심번개', '저녁번개', '주말번개', '야간번개']
  }
};

// 종목별 라벨 매핑
export const SPORT_LABEL: Record<Sport, string> = {
  soccer: '축구/풋살',
  basketball: '농구',
  tennis: '테니스',
  badminton: '배드민턴',
  volleyball: '배구',
  baseball: '야구',
  swimming: '수영',
  running: '러닝',
  cycling: '사이클링',
  climbing: '클라이밍',
  golf: '골프',
  etc: '기타'
};

// 모든 종목 목록
export const SPORTS: Sport[] = ['soccer', 'basketball', 'tennis', 'badminton', 'volleyball', 'baseball', 'swimming', 'running', 'cycling', 'climbing', 'golf', 'etc'];

// 특정 종목의 가지에 따른 소가지 목록을 가져오는 헬퍼 함수
export function getLeavesForSportAndBranch(sport: Sport, branch: Branch): Leaf[] {
  return TAXONOMY[sport]?.[branch] || [];
}

// 특정 종목의 모든 소가지 목록을 가져오는 헬퍼 함수
export function getAllLeavesForSport(sport: Sport): Leaf[] {
  const allLeaves: Leaf[] = [];
  Object.values(TAXONOMY[sport] || {}).forEach(leaves => {
    allLeaves.push(...leaves);
  });
  return [...new Set(allLeaves)]; // 중복 제거
}
