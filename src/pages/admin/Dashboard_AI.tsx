/**
 * ??Dashboard_AI.tsx
 * - ?¤ì‹œê°?ì¹´ë“œ ì§€?? ?¤ëŠ˜ ? ê·œ ?í’ˆ, ?¤ëŠ˜ ?Œì„± ?¸ì…˜, ?¤ëŠ˜ ?¸ì‹œ ?„ì†¡, ?ëŸ¬ ?? * - ì°¨íŠ¸: ì§€??7??? ê·œ ?í’ˆ ì¶”ì´, ?Œë¦¼ ?„ì†¡ ì¶”ì´, ?Œì„± ?¸ì…˜ ì¶”ì´
 * - ?Œì´ë¸? ìµœê·¼ AI ë¸Œë¦¬??ë¡œê·¸(?”ì•½ ë¯¸ë¦¬ë³´ê¸°)
 *
 * ?„ìš” ì»¬ë ‰??ê¶Œì¥):
 *  - marketItems (createdAt, autoTags, location, ...)
 *  - voiceSessions (createdAt, createdBy, ...)
 *    - /voiceSessions/{id}/logs (ts, type, ...)
 *  - notificationLogs (createdAt, type: 'push', payload, ...)
 *  - briefingLogs (createdAt, summary, audience, ...)
 *
 * ?¤í??? Tailwind(ê¶Œì¥) ?ëŠ” ê¸°ë³¸ ?´ë˜?? */

import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type Doc = { id: string; [k: string]: any };

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}
function fmtDate(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function toTS(d: Date) {
  return Timestamp.fromDate(d);
}

export default function Dashboard_AI() {
  const [items, setItems] = useState<Doc[]>([]);
  const [sessions, setSessions] = useState<Doc[]>([]);
  const [notifLogs, setNotifLogs] = useState<Doc[]>([]);
  const [briefings, setBriefings] = useState<Doc[]>([]);
  const [errors, setErrors] = useState<Doc[]>([]);

  // === ê¸°ê°„ ===
  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const d7 = useMemo(() => daysAgo(7), []);
  const d30 = useMemo(() => daysAgo(30), []);

  // === Firestore ?¤ì‹œê°?êµ¬ë… ===
  useEffect(() => {
    // marketItems (ìµœê·¼ 30??
    const q1 = query(
      collection(db, "marketItems"),
      where("createdAt", ">=", toTS(d30)),
      orderBy("createdAt", "asc")
    );
    const unsub1 = onSnapshot(q1, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // voiceSessions (ìµœê·¼ 30??
    const q2 = query(
      collection(db, "voiceSessions"),
      where("createdAt", ">=", toTS(d30)),
      orderBy("createdAt", "asc")
    );
    const unsub2 = onSnapshot(q2, (snap) =>
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // notificationLogs (ìµœê·¼ 30?? ???Œë¦¼ ë°œì†¡ ê¸°ë¡??Functions?ì„œ ?ì¬)
    const q3 = query(
      collection(db, "notificationLogs"),
      where("createdAt", ">=", toTS(d30)),
      orderBy("createdAt", "asc")
    );
    const unsub3 = onSnapshot(q3, (snap) =>
      setNotifLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // briefingLogs (ìµœê·¼ 10ê±?
    const q4 = query(
      collection(db, "briefingLogs"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const unsub4 = onSnapshot(q4, (snap) =>
      setBriefings(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    // errors (ìµœê·¼ 30??
    const q5 = query(
      collection(db, "errors"),
      where("createdAt", ">=", toTS(d30)),
      orderBy("createdAt", "asc")
    );
    const unsub5 = onSnapshot(q5, (snap) =>
      setErrors(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, [d30]);

  // === ì¹´ë“œ ì§€??===
  const todayItems = items.filter((x) => x.createdAt?.toDate?.() >= todayStart);
  const todaySessions = sessions.filter(
    (x) => x.createdAt?.toDate?.() >= todayStart
  );
  const todayPushes = notifLogs.filter(
    (x) => x.createdAt?.toDate?.() >= todayStart && x.type === "push"
  );
  const todayErrors = errors.filter(
    (x) => x.createdAt?.toDate?.() >= todayStart
  );

  // === 7??ì°¨íŠ¸??ì§‘ê³„ ===
  const days = [...Array(7)].map((_, i) => daysAgo(6 - i));
  const byDay = (arr: Doc[]) => {
    return days.map((d) => {
      const n = arr.filter((x) => {
        const t = x.createdAt?.toDate?.();
        return !!t && startOfDay(t).getTime() === d.getTime();
      }).length;
      return { day: fmtDate(d), value: n };
    });
  };
  const items7 = byDay(items);
  const sessions7 = byDay(sessions);
  const pushes7 = byDay(notifLogs.filter((x) => x.type === "push"));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">?“Š ?¼ê³  ë¹„ì„œ ê´€ë¦¬ì ?€?œë³´??/h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="?¤ëŠ˜ ? ê·œ ?í’ˆ" value={todayItems.length} />
        <Card title="?¤ëŠ˜ ?Œì„± ?¸ì…˜" value={todaySessions.length} />
        <Card title="?¤ëŠ˜ ?¸ì‹œ ?„ì†¡" value={todayPushes.length} />
        <Card title="?¤ëŠ˜ ?ëŸ¬" value={todayErrors.length} danger={todayErrors.length > 0} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <ChartBlock title="ì§€??7??? ê·œ ?í’ˆ">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={items7}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" />
            </LineChart>
          </ResponsiveContainer>
        </ChartBlock>

        <ChartBlock title="ì§€??7???Œë¦¼ ?„ì†¡">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pushes7}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>

        <ChartBlock title="ì§€??7???Œì„± ?¸ì…˜">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sessions7}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" />
            </LineChart>
          </ResponsiveContainer>
        </ChartBlock>
      </div>

      {/* Recent Briefings */}
      <div className="bg-white border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">?“° ìµœê·¼ AI ë¸Œë¦¬??(10ê±?</h2>
          <span className="text-xs text-gray-500">
            ì´?{briefings.length}ê±?          </span>
        </div>
        <div className="divide-y">
          {briefings.map((b) => {
            const t = b.createdAt?.toDate?.()?.toLocaleString?.() || "";
            return (
              <div key={b.id} className="py-3">
                <div className="text-xs text-gray-500">{t}</div>
                <div className="font-medium line-clamp-2">{b.summary}</div>
                <div className="text-xs text-gray-600 mt-1">
                  ?€?? {b.audience ?? "all"} Â· ?„ì†¡: {b.sentCount ?? "-"}
                </div>
              </div>
            );
          })}
          {briefings.length === 0 && (
            <div className="py-6 text-gray-500">ë¸Œë¦¬??ë¡œê·¸ê°€ ?†ìŠµ?ˆë‹¤.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  danger,
}: {
  title: string;
  value: number | string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        danger ? "border-red-300 bg-red-50" : "bg-white"
      }`}
    >
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function ChartBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}
