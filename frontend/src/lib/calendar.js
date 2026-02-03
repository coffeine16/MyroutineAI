/* global google */

// ===== Constants =====
const TIME_ZONE = "Asia/Kolkata"; // your preferred TZ
const OFFSET_MINUTES = 330; // +05:30 for IST

let client;

// ----- OAuth init -----
export function initGoogleCalendarClient(callback) {
  if (client) return; // prevent multiple inits

  client = google.accounts.oauth2.initTokenClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: "https://www.googleapis.com/auth/calendar.events",
    callback: (response) => {
      if (response && response.access_token) {
        localStorage.setItem("googleAccessToken", response.access_token);
        if (callback) callback(response.access_token);
      } else {
        console.error("Failed to get Google access token:", response);
      }
    },
  });
}

export function requestAccessToken(callback) {
  if (!client) {
    console.warn("Google client not initialized — running init...");
    initGoogleCalendarClient(callback);
    return;
  }

  client.callback = (response) => {
    if (response && response.access_token) {
      localStorage.setItem("googleAccessToken", response.access_token);
      if (callback) callback(response.access_token);
    } else {
      console.error("Failed to get Google access token:", response);
    }
  };

  client.requestAccessToken();
}

function getAccessToken() {
  const token = localStorage.getItem("googleAccessToken");
  if (!token) console.error("No Google access token found");
  return token;
}

// ----- Helpers -----
function ensureDate(task) {
  return task.date ?? new Date().toISOString().split("T")[0];
}

function parseDuration(durationStr) {
  if (!durationStr) return 30 * 60 * 1000; // default 30 min

  const match = durationStr.match(/(\d+)\s*(min|hour|h)/i);
  if (!match) return 30 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (unit.startsWith("h")) return value * 60 * 60 * 1000;
  return value * 60 * 1000;
}

function buildDateRange(task) {
  const taskDate = ensureDate(task);

  const defaultTime = new Date();
  const currentHHMM = `${String(defaultTime.getHours()).padStart(2, "0")}:${String(
    defaultTime.getMinutes()
  ).padStart(2, "0")}`;

  const time = task.time && task.time.trim() !== "" ? task.time : currentHHMM;

  const [h, m] = time.split(":").map(Number);
  const date = new Date(taskDate);
  date.setHours(h, m, 0, 0);

  const start = date;
  const durationMs = parseDuration(task.duration);
  const end = new Date(start.getTime() + durationMs);

  return { start, end };
}

/**
 * Convert a JS Date to RFC3339 string in IST (+05:30)
 */
function formatRFC3339IST(date) {
  const istDate = new Date(date.getTime());

  const pad = (n) => String(n).padStart(2, "0");

  const yyyy = istDate.getFullYear();
  const mm = pad(istDate.getMonth() + 1);
  const dd = pad(istDate.getDate());
  const hh = pad(istDate.getHours());
  const min = pad(istDate.getMinutes());
  const ss = pad(istDate.getSeconds());

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+05:30`;
}

function buildEventPayload(task) {
  let start, end;

  if (task.start && task.end) {
    // ✅ Respect existing ISO strings
    start = new Date(task.start);
    end = new Date(task.end);
  } else {
    // ❌ Fallback to parsing date/time/duration
    ({ start, end } = buildDateRange(task));
  }

  const payload = {
    summary: task.task,
    description: "Task from MyRoutineAI",
    start: {
      dateTime: formatRFC3339IST(start),
      timeZone: TIME_ZONE,
    },
    end: {
      dateTime: formatRFC3339IST(end),
      timeZone: TIME_ZONE,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 10 },
        { method: "email", minutes: 30 },
      ],
    },
  };

  console.log("Event payload:", JSON.stringify(payload, null, 2));
  return payload;
}

// ----- Calendar Operations -----
export async function createCalendarEvent(task) {
  const token = getAccessToken();
  if (!token) return null;

  const event = buildEventPayload(task);

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    console.error("createCalendarEvent error:", data);
    throw new Error(data?.error?.message || "Failed to create event");
  }

  console.log("Event created:", data);
  return data.id; // ✅ Always return eventId
}

export async function updateCalendarEvent(eventId, task) {
  const token = getAccessToken();
  if (!token) return null;
  if (!eventId) throw new Error("updateCalendarEvent: eventId required");

  const event = buildEventPayload(task);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    console.error("updateCalendarEvent error:", data);
    throw new Error(data?.error?.message || "Failed to update event");
  }

  console.log("Event updated:", data);
  return data.id; // ✅ Always return eventId
}

export async function upsertCalendarEvent(task) {
  try {
    if (task.googleEventId) {
      const id = await updateCalendarEvent(task.googleEventId, task);
      return id || task.googleEventId; // fallback if null
    } else {
      const id = await createCalendarEvent(task);
      return id;
    }
  } catch (err) {
    console.error("upsertCalendarEvent error:", err);
    throw err;
  }
}

export async function deleteCalendarEvent(eventId) {
  const token = getAccessToken();
  if (!token) return;

  if (!eventId) {
    console.warn("deleteCalendarEvent called without eventId");
    return;
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok && res.status !== 404) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error?.message || "Failed to delete event");
    }
    console.log("Event deleted:", eventId);
  } catch (err) {
    console.error("Error deleting event:", err);
  }
}
