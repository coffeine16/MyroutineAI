# main.py (SIMPLIFIED & STABLE)

import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from groq import Groq
import pytz
import dateparser

# ------------------------------------------------------------------
# Setup
# ------------------------------------------------------------------

load_dotenv()

app = FastAPI(title="MyroutineAI Backend", version="1.0")

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

TIMEZONE = pytz.timezone("Asia/Kolkata")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://myroutine-ai.vercel.app",
        "https://routine-5f98e.firebaseapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Models
# ------------------------------------------------------------------

class Prompt(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500)

class ChatHistory(BaseModel):
    history: List[Dict[str, str]]

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def now_ist() -> datetime:
    return datetime.now(TIMEZONE)

def iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = TIMEZONE.localize(dt)
    return dt.isoformat(timespec="seconds")

def smart_category(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["study", "exam", "dsa", "coding"]):
        return "study"
    if any(w in t for w in ["meeting", "work", "office"]):
        return "work"
    if any(w in t for w in ["gym", "run", "workout"]):
        return "fitness"
    return "personal"

def smart_duration(category: str) -> int:
    return {
        "study": 120,
        "work": 60,
        "fitness": 90,
        "personal": 60,
    }.get(category, 60)

# ------------------------------------------------------------------
# Core AI logic (PURE FUNCTION)
# ------------------------------------------------------------------

async def generate_tasks(prompt_text: str):
    now = now_ist()

    system_prompt = f"""
You are a task parser.

Return ONLY valid JSON.
No explanation. No markdown.

Today is {now.strftime('%Y-%m-%d')} ({now.strftime('%A')}).
Timezone: Asia/Kolkata.

Format:
[
  {{
    "task": "Task name",
    "start": "YYYY-MM-DDTHH:MM:SS",
    "category": "personal|study|work|fitness"
  }}
]

User input:
"{prompt_text}"
"""

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        temperature=0.2,
        messages=[{"role": "user", "content": system_prompt}],
    )

    raw = completion.choices[0].message.content.strip()

    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            data = [data]
    except Exception:
        # HARD fallback
        start = dateparser.parse(
            prompt_text,
            settings={"RETURN_AS_TIMEZONE_AWARE": True, "TIMEZONE": "Asia/Kolkata"},
        ) or now

        category = smart_category(prompt_text)
        end = start + timedelta(minutes=smart_duration(category))

        return [{
            "task": prompt_text[:100],
            "start": iso(start),
            "end": iso(end),
            "category": category,
            "priority": "medium",
            "icon": "📝",
            "description": None,
            "location": None,
        }]

    results = []

    for item in data:
        start = dateparser.parse(
            item.get("start"),
            settings={"RETURN_AS_TIMEZONE_AWARE": True, "TIMEZONE": "Asia/Kolkata"},
        ) or now

        category = item.get("category") or smart_category(prompt_text)
        end = start + timedelta(minutes=smart_duration(category))

        results.append({
            "task": item.get("task", prompt_text[:100]),
            "start": iso(start),
            "end": iso(end),
            "category": category,
            "priority": "medium",
            "icon": "📝",
            "description": None,
            "location": None,
        })

    return results

# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "time": iso(now_ist())}

@app.post("/api/ai-task")
async def ai_task(prompt: Prompt):
    return await generate_tasks(prompt.prompt)

@app.post("/api/chatbot")
async def chatbot(chat: ChatHistory):
    last = chat.history[-1]["content"] if chat.history else ""

    if any(w in last.lower() for w in ["create", "add", "schedule", "plan"]):
        tasks = await generate_tasks(last)
        return {
            "action": "createTask",
            "payload": tasks,
            "summary": f"Created {len(tasks)} task(s) for you!"
        }

    # Normal chat
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        temperature=0.6,
        messages=[{"role": "user", "content": last}],
    )

    return {
        "response": completion.choices[0].message.content
    }

# ------------------------------------------------------------------
# Run locally
# ------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
