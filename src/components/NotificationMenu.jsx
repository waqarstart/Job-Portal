import { useState, useRef, useEffect } from "react";
import { HiOutlineBell } from "react-icons/hi2";

export default function NotificationMenu({ notifications = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full border p-2 text-gray-500 hover:bg-gray-50 transition"
      >
        <HiOutlineBell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                {unread} new
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className="flex gap-3 border-b px-4 py-3 hover:bg-gray-50 last:border-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm">
                    {n.icon || "🔔"}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
