import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import clsx from "clsx";
import ColorDot from "./ColorDot";
import EventModal from "./EventModal";
import {
  CalendarEvent,
  subscribeSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../../lib/firestore-calendar";

export default function CalendarAdmin() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterTeam, setFilterTeam] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">("dayGridMonth");

  // Firestore ?�시�?구독
  useEffect(() => {
    const unsubscribe = subscribeSchedules(filterTeam, (fetchedEvents) => {
      setEvents(fetchedEvents);
      console.log("?�� ?�정 ?�데?�트:", fetchedEvents.length);
    });

    return () => unsubscribe();
  }, [filterTeam]);

  // FullCalendar???�벤??변??  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    backgroundColor: event.color || "#3b82f6",
    borderColor: event.color || "#3b82f6",
    extendedProps: {
      type: event.type,
      location: event.location,
      description: event.description,
      teamId: event.teamId,
    },
  }));

  // ?�정 ?�릭
  const handleEventClick = (info: any) => {
    const event = events.find((e) => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  };

  // ?�짜 ?�릭 (???�정)
  const handleDateClick = (info: any) => {
    setSelectedEvent({
      title: "",
      start: info.date,
      end: new Date(info.date.getTime() + 2 * 60 * 60 * 1000),
      allDay: info.allDay,
      type: "team",
      location: "",
      description: "",
      color: "#3b82f6",
      teamId: filterTeam || "",
    });
    setIsModalOpen(true);
  };

  // ?�정 ?�래�?& ?�롭 (?�간 변�?
  const handleEventDrop = async (info: any) => {
    const eventId = info.event.id;
    if (!eventId) return;

    try {
      await updateSchedule(eventId, {
        start: info.event.start,
        end: info.event.end || info.event.start,
        allDay: info.event.allDay,
      });
      console.log("???�정 ?�간 변�??�료");
    } catch (error) {
      console.error("???�정 ?�간 변�??�패:", error);
      info.revert();
    }
  };

  // ?�정 리사?�즈 (종료 ?�간 변�?
  const handleEventResize = async (info: any) => {
    const eventId = info.event.id;
    if (!eventId) return;

    try {
      await updateSchedule(eventId, {
        end: info.event.end || info.event.start,
      });
      console.log("???�정 종료 ?�간 변�??�료");
    } catch (error) {
      console.error("???�정 종료 ?�간 변�??�패:", error);
      info.revert();
    }
  };

  // ?�정 ?�??  const handleSave = async (event: Omit<CalendarEvent, "id">) => {
    await createSchedule(event);
  };

  // ?�정 ?�정
  const handleUpdate = async (id: string, event: Partial<CalendarEvent>) => {
    await updateSchedule(id, event);
  };

  // ?�정 ??��
  const handleDelete = async (id: string) => {
    await deleteSchedule(id);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto pb-24">
      {/* ?�더 */}
      <header className="bg-white rounded-2xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">?�� ?�정 캘린??/h1>
            <p className="text-sm text-gray-500">
              ?� ?�련, 경기, ?�???�정???�눈??관리하?�요
            </p>
          </div>

          {/* �??�???�택 */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewType("dayGridMonth")}
              className={clsx(
                "px-4 py-2 rounded-lg transition-colors text-sm font-medium",
                viewType === "dayGridMonth"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              ??            </button>
            <button
              onClick={() => setViewType("timeGridWeek")}
              className={clsx(
                "px-4 py-2 rounded-lg transition-colors text-sm font-medium",
                viewType === "timeGridWeek"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              �?            </button>
            <button
              onClick={() => setViewType("timeGridDay")}
              className={clsx(
                "px-4 py-2 rounded-lg transition-colors text-sm font-medium",
                viewType === "timeGridDay"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              ??            </button>
          </div>
        </div>

        {/* ?�터 & ?�션 */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          {/* ?� ?�터 */}
          <select
            value={filterTeam || ""}
            onChange={(e) => setFilterTeam(e.target.value || null)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">?�체 ?�</option>
            <option value="soheul60">?�흘FC 60</option>
            <option value="soheul88">?�흘FC 88</option>
            <option value="academy">?�카?��?</option>
          </select>

          {/* ???�정 추�? */}
          <button
            onClick={() => {
              setSelectedEvent(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            ?????�정
          </button>

          {/* 범�? */}
          <div className="flex flex-wrap gap-3 ml-auto">
            <div className="flex items-center">
              <ColorDot color="#3b82f6" />
              <span className="text-xs text-gray-600">?� ?�련</span>
            </div>
            <div className="flex items-center">
              <ColorDot color="#8b5cf6" />
              <span className="text-xs text-gray-600">?�카?��?</span>
            </div>
            <div className="flex items-center">
              <ColorDot color="#f59e0b" />
              <span className="text-xs text-gray-600">?�??/span>
            </div>
            <div className="flex items-center">
              <ColorDot color="#6b7280" />
              <span className="text-xs text-gray-600">기�?</span>
            </div>
          </div>
        </div>
      </header>

      {/* 캘린??*/}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={viewType}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          locale="ko"
          events={calendarEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          height="auto"
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventContent={(arg) => {
            const location = arg.event.extendedProps.location;
            return (
              <div className="text-xs p-1">
                <div className="font-semibold truncate">{arg.event.title}</div>
                {location && (
                  <div className="text-[10px] opacity-80 truncate">
                    ?�� {location}
                  </div>
                )}
              </div>
            );
          }}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          slotDuration="01:00:00"
          allDaySlot={true}
          nowIndicator={true}
          businessHours={{
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startTime: "08:00",
            endTime: "20:00",
          }}
        />
      </div>

      {/* ?�계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{events.length}</p>
          <p className="text-sm text-gray-500">?�체 ?�정</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {events.filter((e) => e.type === "team").length}
          </p>
          <p className="text-sm text-gray-500">?� ?�련</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {events.filter((e) => e.type === "tournament").length}
          </p>
          <p className="text-sm text-gray-500">?�??/p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {events.filter((e) => e.type === "academy").length}
          </p>
          <p className="text-sm text-gray-500">?�카?��?</p>
        </div>
      </div>

      {/* ?�벤??모달 */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        initialEvent={selectedEvent}
      />
    </div>
  );
}

