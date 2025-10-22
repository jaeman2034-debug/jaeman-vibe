// RBAC (Role-Based Access Control) 권한 관�?

export type Role = 'player' | 'coach' | 'club' | 'facility' | 'referee' | 'trainer' | 'shop' | 'admin';

export type Resource = 'events' | 'facilities' | 'clubs' | 'market' | 'jobs';

export type Action = 
  | 'book_event' | 'create_event' | 'assign_referee' | 'record_match' | 'create_match' | 'create_lesson'
  | 'manage_facility' | 'create_slot_template'
  | 'create_club' | 'join_club' | 'manage_club'
  | 'create_product' | 'sell_product'
  | 'post_job' | 'apply_job';

// 권한 매트�?�� ?�의
const permissions: Record<Role, Record<Resource, Action[]>> = {
  player: {
    events: ['book_event'],
    facilities: [],
    clubs: ['join_club'],
    market: [],
    jobs: ['apply_job']
  },
  coach: {
    events: ['book_event', 'create_event', 'create_match', 'create_lesson'],
    facilities: [],
    clubs: ['create_club', 'join_club', 'manage_club'],
    market: ['create_product'],
    jobs: ['post_job', 'apply_job']
  },
  club: {
    events: ['create_event', 'create_match', 'create_lesson'],
    facilities: [],
    clubs: ['manage_club'],
    market: ['create_product'],
    jobs: ['post_job']
  },
  facility: {
    events: ['create_event'],
    facilities: ['manage_facility', 'create_slot_template'],
    clubs: [],
    market: [],
    jobs: []
  },
  referee: {
    events: ['book_event', 'assign_referee', 'record_match'],
    facilities: [],
    clubs: [],
    market: [],
    jobs: ['apply_job']
  },
  trainer: {
    events: ['book_event', 'create_event', 'create_lesson'],
    facilities: [],
    clubs: ['join_club'],
    market: ['create_product'],
    jobs: ['post_job', 'apply_job']
  },
  shop: {
    events: [],
    facilities: [],
    clubs: [],
    market: ['create_product', 'sell_product'],
    jobs: []
  },
  admin: {
    events: ['book_event', 'create_event', 'assign_referee', 'record_match', 'create_match', 'create_lesson'],
    facilities: ['manage_facility', 'create_slot_template'],
    clubs: ['create_club', 'join_club', 'manage_club'],
    market: ['create_product', 'sell_product'],
    jobs: ['post_job', 'apply_job']
  }
};

/**
 * ?�용?�의 ??���?리소?�에 ?�???�션 권한???�인?�니??
 * @param role ?�용????��
 * @param resource 리소???�??
 * @param action ?�행?�려???�션
 * @returns 권한???�으�?true, ?�으�?false
 */
export function allow(role: Role, resource: Resource, action: Action): boolean {
  return permissions[role]?.[resource]?.includes(action) ?? false;
}

/**
 * ?�용????��??모든 권한??반환?�니??
 * @param role ?�용????��
 * @returns ?�당 ??��??모든 권한
 */
export function getRolePermissions(role: Role): Record<Resource, Action[]> {
  return permissions[role] ?? {};
}

/**
 * ?�정 리소?�에 ?�??모든 권한??가�???��?�을 반환?�니??
 * @param resource 리소???�??
 * @param action ?�션
 * @returns ?�당 권한??가�???��?�의 배열
 */
export function getRolesWithPermission(resource: Resource, action: Action): Role[] {
  return Object.entries(permissions)
    .filter(([_, perms]) => perms[resource]?.includes(action))
    .map(([role]) => role as Role);
}
