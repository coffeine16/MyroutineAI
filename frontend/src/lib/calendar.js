// lib/calendar.js

/* global google */

let client;

// Initialize the Google OAuth Client
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

// Request Access Token when user signs in or wants to sync
export function requestAccessToken() {
  if (!client) {
    console.error("Google client not initialized");
    return;
  }
  client.requestAccessToken();
}

// ✅ Get today's date in local IST (Asia/Kolkata)
function getLocalDateString() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000; // UTC offset in ms
  const local = new Date(now.getTime() - offsetMs);
  return local.toISOString().split("T")[0]; // YYYY-MM-DD (local)
}

// Create Calendar Event
export async function createCalendarEvent(task) {
  const token = localStorage.getItem("googleAccessToken");
  if (!token) {
    console.error("No Google access token found");
    return;
  }

  // ✅ Ensure date exists, default to today in IST
  let taskDate = task.date;
  if (!taskDate) {
    taskDate = getLocalDateString();
    console.warn("No date provided, defaulting to today:", taskDate);
  }

  // Build start and end times in Asia/Kolkata
  const startDateTime = new Date(taskDate + "T" + task.time);
  if (isNaN(startDateTime.getTime())) {
    console.error("Invalid task time/date:", task);
    return;
  }

  const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // +30 min

  // ✅ Format date-time as local RFC3339 (no UTC conversion)
  const formatDateTime = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes()) +
      ":" +
      pad(date.getSeconds())
    ); // ✅ No "Z", stays local
  };

  const event = {
    summary: task.task,
    description: `Task from Daily Grind`,
    start: {
      dateTime: formatDateTime(startDateTime),
      timeZone: "Asia/Kolkata", // 🔑 ensures IST
    },
    end: {
      dateTime: formatDateTime(endDateTime),
      timeZone: "Asia/Kolkata",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 10 },
        { method: "email", minutes: 30 },
      ],
    },
  };

  console.log("Event payload:", event);

  try {
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
    alert("Event added to Google Calendar ✅");
  } catch (err) {
    console.error("Error creating event:", err);
  }
}
