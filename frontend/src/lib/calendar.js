// lib/calendar.js
/* global google */

// ===== Constants =====
const TIME_ZONE = "Asia/Kolkata"; // change if you want another TZ

let client;

// ----- OAuth init -----
export function initGoogleCalendarClient(callback) {
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

export function requestAccessToken() {
  if (!client) {
    console.error("Google client not initialized");
    return;
  }
  client.requestAccessToken();
}

function getAccessToken() {
  const token = localStorage.getItem("googleAccessToken");
  if (!token) console.error("No Google access token found");
  return token;
}

// ----- Helpers -----
function ensureDate(task) {
  // default to "today" (in user local) if task.date is missing
  return task.date ?? new Date().toISOString().split("T")[0];
}

function buildDateRange(task) {
  const taskDate = ensureDate(task);
  const time = task.time ?? "09:00"; // default time if none

  const start = new Date(`${taskDate}T${time}`);
  if (Number.isNaN(start.getTime())) {
    throw new RangeError("Invalid task date/time");
  }
  const end = new Date(start.getTime() + 30 * 60 * 1000); // +30 min
  return { start, end };
}

// Format as local RFC3339 string WITHOUT "Z"
function formatLocalRFC3339(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" + pad(date.getMonth() + 1) +
    "-" + pad(date.getDate()) +
    "T" + pad(date.getHours()) +
    ":" + pad(date.getMinutes()) +
    ":" + pad(date.getSeconds())
  );
}

function buildEventPayload(task) {
  const { start, end } = buildDateRange(task);
  const payload = {
    summary: task.task,
    description: "Task from Daily Grind",
    start: {
      dateTime: formatLocalRFC3339(start),
      timeZone: TIME_ZONE,
    },
    end: {
      dateTime: formatLocalRFC3339(end),
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

  // Debug logs (helpful while testing)
  if (!task.date) {
    console.warn("No date provided, defaulting to today:", ensureDate(task));
  }
  console.log("Event payload:", JSON.stringify(payload, null, 2));
  return payload;
}

// ----- Calendar Operations -----
// Create new Google Calendar event, return event.id
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
  console.log("Event created:", data);
  if (!res.ok) {
    throw new Error(data?.error?.message || "Failed to create event");
  }
  return data.id ?? null;
}

// Update existing event (by id). Returns event.id.
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
  console.log("Event updated:", data);
  if (!res.ok) {
    throw new Error(data?.error?.message || "Failed to update event");
  }
  return data.id ?? null;
}

// If task has googleEventId -> update, else create. Returns final eventId.
export async function upsertCalendarEvent(task) {
  try {
    if (task.googleEventId) {
      const id = await updateCalendarEvent(task.googleEventId, task);
      return id || task.googleEventId;
    } else {
      const id = await createCalendarEvent(task);
      return id;
    }
  } catch (err) {
    console.error("upsertCalendarEvent error:", err);
    throw err;
  }
}

// Delete event by id (no error if missing)
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
