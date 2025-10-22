import {
  collection, query, orderBy, limit, startAfter,
  onSnapshot, getDocs
} from 'firebase/firestore';

const pageSize = 10;

export function watchClubBlog(db: any, clubId: string, onChange: (data: any) => void) {
  const base = collection(db, `clubs/${clubId}/blog`);
  const q = query(base, orderBy('createdAt','desc'), limit(pageSize));
  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onChange({ posts, last: snap.docs.at(-1) });
  });
}

export async function loadMore(db: any, clubId: string, lastDoc: any) {
  const base = collection(db, `clubs/${clubId}/blog`);
  const q = query(base, orderBy('createdAt','desc'), startAfter(lastDoc), limit(pageSize));
  const snap = await getDocs(q);
  return { posts: snap.docs.map(d => ({ id: d.id, ...d.data() })), last: snap.docs.at(-1) };
}
