// RBAC (Role-Based Access Control) ê¶Œí•œ ê´€ë¦?

export type Role = 'player' | 'coach' | 'club' | 'facility' | 'referee' | 'trainer' | 'shop' | 'admin';

export type Resource = 'events' | 'facilities' | 'clubs' | 'market' | 'jobs';

export type Action = 
  | 'book_event' | 'create_event' | 'assign_referee' | 'record_match' | 'create_match' | 'create_lesson'
  | 'manage_facility' | 'create_slot_template'
  | 'create_club' | 'join_club' | 'manage_club'
  | 'create_product' | 'sell_product'
  | 'post_job' | 'apply_job';

// ê¶Œí•œ ë§¤íŠ¸ë¦?Š¤ ?•ì˜
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
 * ?¬ìš©?ì˜ ??• ê³?ë¦¬ì†Œ?¤ì— ?€???¡ì…˜ ê¶Œí•œ???•ì¸?©ë‹ˆ??
 * @param role ?¬ìš©????• 
 * @param resource ë¦¬ì†Œ???€??
 * @param action ?˜í–‰?˜ë ¤???¡ì…˜
 * @returns ê¶Œí•œ???ˆìœ¼ë©?true, ?†ìœ¼ë©?false
 */
export function allow(role: Role, resource: Resource, action: Action): boolean {
  return permissions[role]?.[resource]?.includes(action) ?? false;
}

/**
 * ?¬ìš©????• ??ëª¨ë“  ê¶Œí•œ??ë°˜í™˜?©ë‹ˆ??
 * @param role ?¬ìš©????• 
 * @returns ?´ë‹¹ ??• ??ëª¨ë“  ê¶Œí•œ
 */
export function getRolePermissions(role: Role): Record<Resource, Action[]> {
  return permissions[role] ?? {};
}

/**
 * ?¹ì • ë¦¬ì†Œ?¤ì— ?€??ëª¨ë“  ê¶Œí•œ??ê°€ì§???• ?¤ì„ ë°˜í™˜?©ë‹ˆ??
 * @param resource ë¦¬ì†Œ???€??
 * @param action ?¡ì…˜
 * @returns ?´ë‹¹ ê¶Œí•œ??ê°€ì§???• ?¤ì˜ ë°°ì—´
 */
export function getRolesWithPermission(resource: Resource, action: Action): Role[] {
  return Object.entries(permissions)
    .filter(([_, perms]) => perms[resource]?.includes(action))
    .map(([role]) => role as Role);
}
