import React, { useState, useEffect } from "react";
import { CalendarEvent } from "../../lib/firestore-calendar";
import { X } from "lucide-react";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, "id">) => Promise<void>;
  onUpdate?: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialEvent?: CalendarEvent | null;
}

const EVENT_TYPES = [
  { value: "team", label: "?� ?�련", color: "#3b82f6" },
  { value: "academy", label: "?�카?��?", color: "#8b5cf6" },
  { value: "tournament", label: "?�??, color: "#f59e0b" },
  { value: "other", label: "기�?", color: "#6b7280" },
];

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  initialEvent,
}: EventModalProps) {
  const [form, setForm] = useState<Omit<CalendarEvent, "id">>({
    title: "",
    start: new Date(),
    end: new Date(),
    allDay: false,
    type: "team",
    location: "",
    description: "",
    color: "#3b82f6",
    teamId: "",
  });

  useEffect(() => {
    if (initialEvent) {
      setForm({
        title: initialEvent.title,
        start: initialEvent.start,
        end: initialEvent.end,
        allDay: initialEvent.allDay || false,
        type: initialEvent.type || "team",
        location: initialEvent.location || "",
        description: initialEvent.description || "",
        color: initialEvent.color || "#3b82f6",
        teamId: initialEvent.teamId || "",
      });
    } else {
      // ???�정????초기??      const now = new Date();
      now.setMinutes(0, 0, 0);
      const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      setForm({
        title: "",
        start: now,
        end,
        allDay: false,
        type: "team",
        location: "",
        description: "",
        color: "#3b82f6",
        teamId: "",
      });
    }
  }, [initialEvent, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      alert("?�목???�력?�세??");
      return;
    }

    try {
      if (initialEvent?.id && onUpdate) {
        await onUpdate(initialEvent.id, form);
      } else {
        await onSave(form);
      }
      onClose();
    } catch (error) {
      console.error("?�정 ?�???�류:", error);
      alert("?�정 ?�??�??�류가 발생?�습?�다.");
    }
  };

  const handleDelete = async () => {
    if (!initialEvent?.id || !onDelete) return;
    
    if (confirm("?�말 ??��?�시겠습?�까?")) {
      try {
        await onDelete(initialEvent.id);
        onClose();
      } catch (error) {
        console.error("?�정 ??�� ?�류:", error);
        alert("?�정 ??�� �??�류가 발생?�습?�다.");
      }
    }
  };

  const handleTypeChange = (type: string) => {
    const eventType = EVENT_TYPES.find((t) => t.value === type);
    setForm({
      ...form,
      type: type as any,
      color: eventType?.color || "#3b82f6",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">
            {initialEvent ? "?�정 ?�정" : "???�정 추�?"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* ?�목 */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              ?�목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="?�정 ?�목"
              required
            />
          </div>

          {/* 종류 */}
          <div>
            <label className="block text-sm font-semibold mb-2">종류</label>
            <select
              value={form.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* ?�루 종일 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={form.allDay}
              onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="allDay" className="text-sm font-medium">
              ?�루 종일
            </label>
          </div>

          {/* ?�작 */}
          <div>
            <label className="block text-sm font-semibold mb-2">?�작</label>
            <input
              type={form.allDay ? "date" : "datetime-local"}
              value={
                form.allDay
                  ? form.start.toISOString().split("T")[0]
                  : form.start.toISOString().slice(0, 16)
              }
              onChange={(e) =>
                setForm({ ...form, start: new Date(e.target.value) })
              }
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 종료 */}
          <div>
            <label className="block text-sm font-semibold mb-2">종료</label>
            <input
              type={form.allDay ? "date" : "datetime-local"}
              value={
                form.allDay
                  ? form.end.toISOString().split("T")[0]
                  : form.end.toISOString().slice(0, 16)
              }
              onChange={(e) =>
                setForm({ ...form, end: new Date(e.target.value) })
              }
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* ?�소 */}
          <div>
            <label className="block text-sm font-semibold mb-2">?�소</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="?? ?�흘 체육공원"
            />
          </div>

          {/* ?� ID (?�택) */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              ?� ID (?�택)
            </label>
            <input
              type="text"
              value={form.teamId}
              onChange={(e) => setForm({ ...form, teamId: e.target.value })}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="?? soheul60"
            />
          </div>

          {/* ?�명 */}
          <div>
            <label className="block text-sm font-semibold mb-2">?�명</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="?�정 ?�세 ?�명"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            {initialEvent && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                ??��
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {initialEvent ? "?�?? : "추�?"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

