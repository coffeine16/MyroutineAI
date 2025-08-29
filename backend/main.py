# main.py
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Union
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator
from groq import Groq
from dotenv import load_dotenv
import pytz
import dateparser

load_dotenv()

app = FastAPI(title="Daily Grind API", version="2.0.0")

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Set timezone to match your calendar.js
TIMEZONE = pytz.timezone("Asia/Kolkata")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://myroutine-ai.vercel.app",
        "https://routine-5f98e.firebaseapp.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enhanced Pydantic Models
class Task(BaseModel):
    task: str = Field(..., min_length=1, max_length=200)
    start: str = Field(..., description="ISO 8601 datetime string")
    end: str = Field(..., description="ISO 8601 datetime string")
    category: str = Field(..., pattern="^(personal|study|work|fitness)$")
    priority: str = Field(..., pattern="^(low|medium|high)$")
    icon: str = Field(..., min_length=1, max_length=5)
    description: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=100)

    @validator('start', 'end')
    def validate_datetime(cls, v):
        try:
            # Accept ISO strings with or without timezone (we normalize later)
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except Exception:
            raise ValueError('Invalid datetime format. Use ISO 8601 format.')

class Prompt(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)

class ChatHistory(BaseModel):
    history: List[Dict[str, str]] = Field(..., max_items=50)

class TaskCreationResponse(BaseModel):
    action: str = "createTask"
    payload: List[Task]
    summary: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    suggestions: Optional[List[str]] = None

# Enhanced utility functions
def get_current_datetime():
    """Get current datetime in IST timezone"""
    return datetime.now(TIMEZONE)

def get_smart_category(task_text: str) -> str:
    """Enhanced intelligent category detection with better keyword matching"""
    task_lower = task_text.lower()

    # Study-related keywords (expanded)
    study_keywords = [
        'study', 'learn', 'dsa', 'coding', 'programming', 'homework', 'exam',
        'research', 'read book', 'course', 'tutorial', 'practice', 'algorithm',
        'leetcode', 'hackerrank', 'assignment', 'revision', 'notes', 'lecture'
    ]
    if any(word in task_lower for word in study_keywords):
        return "study"

    # Work-related keywords (expanded)
    work_keywords = [
        'work', 'meeting', 'project', 'deadline', 'office', 'client',
        'presentation', 'report', 'conference', 'standup', 'review',
        'interview', 'call', 'email', 'documentation', 'planning'
    ]
    if any(word in task_lower for word in work_keywords):
        return "work"

    # Fitness-related keywords (expanded)
    fitness_keywords = [
        'gym', 'workout', 'exercise', 'run', 'yoga', 'sports', 'cardio',
        'fitness', 'swimming', 'cycling', 'weightlifting', 'stretch', 'jog'
    ]
    if any(word in task_lower for word in fitness_keywords):
        return "fitness"

    return "personal"

def get_smart_priority(task_text: str) -> str:
    """Enhanced intelligent priority detection"""
    task_lower = task_text.lower()

    # High priority keywords
    high_priority_keywords = [
        'urgent', 'important', 'asap', 'critical', 'deadline', 'exam',
        'interview', 'emergency', 'priority', 'crucial'
    ]
    if any(word in task_lower for word in high_priority_keywords):
        return "high"

    # Low priority keywords
    low_priority_keywords = [
        'sometime', 'eventually', 'maybe', 'optional', 'leisure',
        'when possible', 'if time', 'casual'
    ]
    if any(word in task_lower for word in low_priority_keywords):
        return "low"

    return "medium"

def get_smart_icon(category: str, task_text: str) -> str:
    """Get contextually appropriate icon with more variety"""
    task_lower = task_text.lower()

    # Specific task-based icons
    icon_mapping = {
        "meeting": "👥", "call": "📞", "phone": "📞", "email": "📧",
        "deadline": "⏰", "exam": "📝", "interview": "💼", "presentation": "📊",
        "gym": "💪", "workout": "🏋️", "run": "🏃", "yoga": "🧘",
        "study": "📚", "coding": "💻", "programming": "💻", "algorithm": "🧮",
        "read": "📖", "research": "🔬", "project": "📋", "planning": "🗓️"
    }

    for keyword, icon in icon_mapping.items():
        if keyword in task_lower:
            return icon

    # Category-based icons with variety
    category_icons = {
        "study": ["📚", "🎯", "💻", "✏️", "🔬", "📖", "🧮", "📝"],
        "work": ["💼", "📊", "⚡", "📋", "📈", "🎯", "💻", "📧"],
        "fitness": ["💪", "🏃", "🏋️", "🧘", "⚽", "🚴", "🏊", "🤸"],
        "personal": ["📝", "🎨", "🌟", "💡", "📱", "🎵", "🎮", "🍳"]
    }

    icons = category_icons.get(category, ["📝"])
    return icons[hash(task_text) % len(icons)]

def parse_time_from_text(text: str, current_datetime: datetime) -> str:
    """Enhanced time parsing from natural language (returns HH:MM)"""
    text_lower = text.lower()

    # Direct time patterns
    time_patterns = [
        (r'(\d{1,2}):(\d{2})\s*(am|pm)', lambda m: convert_12_to_24(int(m.group(1)), int(m.group(2)), m.group(3))),
        (r'(\d{1,2})\s*(am|pm)', lambda m: convert_12_to_24(int(m.group(1)), 0, m.group(2))),
        (r'(\d{1,2}):(\d{2})', lambda m: f"{int(m.group(1)):02d}:{int(m.group(2)):02d}"),
    ]

    for pattern, converter in time_patterns:
        match = re.search(pattern, text_lower)
        if match:
            return converter(match)

    # Contextual time keywords
    time_contexts = {
        'early morning': '06:00',
        'morning': '09:00',
        'late morning': '11:00',
        'noon': '12:00',
        'afternoon': '14:00',
        'late afternoon': '16:00',
        'evening': '18:00',
        'night': '20:00',
        'late night': '22:00',
    }

    for context, time in time_contexts.items():
        if context in text_lower:
            return time

    # Category-based defaults with current time consideration
    current_hour = current_datetime.hour

    # If it's for today and current time has passed, suggest next available slot
    if 'today' in text_lower and current_hour >= 9:
        if current_hour < 14:
            return '14:00'  # afternoon
        elif current_hour < 18:
            return '18:00'  # evening
        else:
            return f"{(current_hour + 1) % 24:02d}:00"  # next hour (wrap around)

    # Default based on category
    category = get_smart_category(text)
    defaults = {
        "fitness": "07:00",
        "study": "10:00",
        "work": "09:00",
        "personal": "12:00"
    }

    return defaults.get(category, "12:00")

def convert_12_to_24(hour: int, minute: int, period: str) -> str:
    """Convert 12-hour format to 24-hour format"""
    if period.lower() == 'am':
        if hour == 12:
            hour = 0
    else:  # pm
        if hour != 12:
            hour += 12

    return f"{hour:02d}:{minute:02d}"

def parse_relative_date(text: str, current_datetime: datetime) -> datetime:
    """Enhanced relative date parsing with timezone awareness (returns naive date at 00:00)"""
    text_lower = text.lower()
    current_date = current_datetime.date()

    # Handle specific dates
    if "tomorrow" in text_lower:
        return current_datetime.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)

    if "today" in text_lower:
        return current_datetime.replace(hour=0, minute=0, second=0, microsecond=0)

    # Handle "next week", "this week"
    if "next week" in text_lower:
        days_ahead = 7 - current_datetime.weekday()
        return current_datetime.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=days_ahead)

    # Handle weekdays (next occurrence)
    weekdays = {
        'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
        'friday': 4, 'saturday': 5, 'sunday': 6
    }

    for day_name, day_num in weekdays.items():
        if day_name in text_lower:
            days_ahead = day_num - current_datetime.weekday()
            if days_ahead <= 0:  # Target day already happened this week
                days_ahead += 7
            return current_datetime.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=days_ahead)

    # Handle "in X days"
    days_match = re.search(r'in (\d+) days?', text_lower)
    if days_match:
        days = int(days_match.group(1))
        return current_datetime.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=days)

    # Default to today
    return current_datetime.replace(hour=0, minute=0, second=0, microsecond=0)

def get_smart_duration(category: str, task_text: str) -> int:
    """Get smart duration based on task category and content"""
    task_lower = task_text.lower()

    # Specific duration hints
    duration_patterns = [
        (r'(\d+)\s*hours?', lambda m: int(m.group(1)) * 60),
        (r'(\d+)\s*hrs?', lambda m: int(m.group(1)) * 60),
        (r'(\d+)\s*minutes?', lambda m: int(m.group(1))),
        (r'(\d+)\s*mins?', lambda m: int(m.group(1))),
        (r'half\s*hour', lambda m: 30),
        (r'quarter\s*hour', lambda m: 15),
    ]

    for pattern, converter in duration_patterns:
        match = re.search(pattern, task_lower)
        if match:
            return converter(match)

    # Keyword-based duration
    if any(word in task_lower for word in ['quick', 'brief', 'short']):
        return 30
    if any(word in task_lower for word in ['long', 'deep', 'intensive', 'thorough']):
        return 180

    # Category-based defaults (in minutes)
    durations = {
        "study": 120,    # 2 hours
        "work": 60,      # 1 hour
        "fitness": 90,   # 1.5 hours
        "personal": 60   # 1 hour
    }

    return durations.get(category, 60)

# Helper: convert datetime to IST ISO string with offset (e.g., 2025-08-30T17:00:00+05:30)
def to_ist_iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        localized = TIMEZONE.localize(dt)
    else:
        localized = dt.astimezone(TIMEZONE)
    # isoformat() includes the colon in the offset, suitable for RFC3339
    return localized.isoformat(timespec='seconds')

# Helper: robust parsing of a raw start/end string (returns timezone-aware datetime)
def parse_raw_datetime(raw: str, base_date: datetime, prefer_future: bool = True) -> Optional[datetime]:
    if not raw:
        return None

    raw = raw.strip()

    # Time-only e.g. "5:00" or "5pm"
    time_only_match = re.match(r'^(\d{1,2}(:\d{2})?(\s?(am|pm))?)$', raw, flags=re.I)
    if time_only_match:
        # Get HH:MM from parse_time_from_text fallback
        hhmm = parse_time_from_text(raw, base_date)
        dt = base_date.replace(hour=int(hhmm.split(':')[0]), minute=int(hhmm.split(':')[1]), second=0, microsecond=0)
        return TIMEZONE.localize(dt) if dt.tzinfo is None else dt.astimezone(TIMEZONE)

    # Try ISO parse first
    try:
        # Accept "Z" as UTC
        parsed = datetime.fromisoformat(raw.replace('Z', '+00:00'))
        if parsed.tzinfo is None:
            parsed = TIMEZONE.localize(parsed)
        else:
            parsed = parsed.astimezone(TIMEZONE)
        return parsed
    except Exception:
        pass

    # Try dateparser for fuzzy strings
    parsed = dateparser.parse(
        raw,
        settings={
            "TIMEZONE": "Asia/Kolkata",
            "RETURN_AS_TIMEZONE_AWARE": True,
            "PREFER_DATES_FROM": "future" if prefer_future else "current_period",
        }
    )
    if parsed:
        # ensure in TIMEZONE
        if parsed.tzinfo is None:
            return TIMEZONE.localize(parsed)
        return parsed.astimezone(TIMEZONE)

    return None

@app.get("/")
def read_root():
    return {"Hello": "From Daily Grind Backend", "status": "active"}

@app.post("/api/ai-task")
async def create_ai_task(prompt_data: Prompt):
    """Enhanced AI task creation with proper timezone handling"""
    try:
        # Use IST timezone consistently
        current_datetime = get_current_datetime()
        current_date = current_datetime.strftime("%Y-%m-%d")
        current_time = current_datetime.strftime("%H:%M")

        prompt = f"""
        You are an intelligent task scheduler for Daily Grind, a productivity app.
        Parse natural language input and convert it into valid JSON tasks.

        **Current Context (IST timezone):**
        - Today's date: {current_date}
        - Current time: {current_time}
        - Current day: {current_datetime.strftime("%A")}

        **CRITICAL REQUIREMENTS:**
        1. ALWAYS respond with ONLY a valid JSON array - no explanations
        2. Use proper time parsing for natural language times
        3. Use ISO 8601 datetime format: "YYYY-MM-DDTHH:MM:SS"
        4. Ensure dates are in correct timezone

        **Enhanced Time Parsing:**
        - "9am" or "9 AM" → "09:00:00"
        - "2pm" or "2 PM" → "14:00:00"
        - "morning" → "09:00:00"
        - "afternoon" → "14:00:00"
        - "evening" → "18:00:00"
        - "night" → "20:00:00"
        - If no time specified → smart default based on category

        **Enhanced Date Parsing:**
        - "today" → {current_date}
        - "tomorrow" → {(current_datetime + timedelta(days=1)).strftime('%Y-%m-%d')}
        - "monday", "tuesday", etc. → next occurrence of that day
        - "next week" → start of next week

        **Duration Calculation:**
        - Default durations: study(2h), work(1h), fitness(1.5h), personal(1h)
        - Parse "1 hour", "30 minutes", etc. from text

        **Example Outputs:**

        Input: "gym tomorrow morning"
        Output: [{{
            "task": "Gym Session",
            "start": "{(current_datetime + timedelta(days=1)).strftime('%Y-%m-%d')}T07:00:00",
            "end": "{(current_datetime + timedelta(days=1)).strftime('%Y-%m-%d')}T08:30:00",
            "category": "fitness",
            "priority": "medium",
            "icon": "💪",
            "description": null,
            "location": null
        }}]

        Input: "meeting at 2pm today"
        Output: [{{
            "task": "Meeting",
            "start": "{current_date}T14:00:00",
            "end": "{current_date}T15:00:00",
            "category": "work",
            "priority": "medium",
            "icon": "👥",
            "description": null,
            "location": null
        }}]

        Input: "study DSA for 3 hours tomorrow evening"
        Output: [{{
            "task": "DSA Study Session",
            "start": "{(current_datetime + timedelta(days=1)).strftime('%Y-%m-%d')}T18:00:00",
            "end": "{(current_datetime + timedelta(days=1)).strftime('%Y-%m-%d')}T21:00:00",
            "category": "study",
            "priority": "high",
            "icon": "🧮",
            "description": null,
            "location": null
        }}]

        User Input: "{prompt_data.prompt}"

        JSON Array:
        """

        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
            temperature=0.1,
            max_tokens=2048,
            top_p=0.9
        )

        response_content = chat_completion.choices[0].message.content.strip()

        # Clean the response - remove any non-JSON text
        json_start = response_content.find('[')
        json_end = response_content.rfind(']') + 1

        if json_start != -1 and json_end != 0:
            clean_json = response_content[json_start:json_end]
        else:
            clean_json = response_content

        try:
            result = json.loads(clean_json)

            # Ensure it's a list
            if isinstance(result, dict):
                result = [result]
            elif not isinstance(result, list):
                raise ValueError("Response is not a list or dict")

            # Validate and enhance each task
            validated_tasks = []
            for task in result:
                # Basic fields and fallbacks
                raw_task_name = task.get("task", "").strip() or (prompt_data.prompt[:200].strip())
                category = task.get("category", get_smart_category(prompt_data.prompt))
                priority = task.get("priority", get_smart_priority(prompt_data.prompt))
                icon = task.get("icon", get_smart_icon(category, prompt_data.prompt))
                description = task.get("description")
                location = task.get("location")

                # Parse start
                raw_start = task.get("start") or task.get("datetime") or None
                start_dt = parse_raw_datetime(raw_start, current_datetime) if raw_start else None

                # If LLM gave time-only like "14:00" or "14:00:00", parse_raw_datetime handles it.
                # If still not found, try parsing the entire prompt with dateparser
                if not start_dt:
                    parsed_from_prompt = dateparser.parse(
                        prompt_data.prompt,
                        settings={
                            "TIMEZONE": "Asia/Kolkata",
                            "RETURN_AS_TIMEZONE_AWARE": True,
                            "PREFER_DATES_FROM": "future"
                        }
                    )
                    if parsed_from_prompt:
                        # ensure IST tz
                        start_dt = parsed_from_prompt.astimezone(TIMEZONE) if parsed_from_prompt.tzinfo else TIMEZONE.localize(parsed_from_prompt)

                # If still not found, fall back to composed parsing using helpers
                if not start_dt:
                    target_date = parse_relative_date(prompt_data.prompt, current_datetime)
                    time_str = parse_time_from_text(prompt_data.prompt, current_datetime)
                    start_naive = target_date.replace(
                        hour=int(time_str.split(':')[0]),
                        minute=int(time_str.split(':')[1]),
                        second=0,
                        microsecond=0
                    )
                    start_dt = TIMEZONE.localize(start_naive)

                # Parse end
                raw_end = task.get("end")
                end_dt = parse_raw_datetime(raw_end, start_dt) if raw_end else None

                # If no end provided, calculate using duration heuristics
                if not end_dt:
                    duration = get_smart_duration(category, prompt_data.prompt)
                    end_dt = start_dt + timedelta(minutes=duration)

                # Safety: if start >= end, fix using duration
                if start_dt >= end_dt:
                    duration = get_smart_duration(category, prompt_data.prompt)
                    end_dt = start_dt + timedelta(minutes=duration)

                validated_task = {
                    "task": raw_task_name,
                    "start": to_ist_iso(start_dt),
                    "end": to_ist_iso(end_dt),
                    "category": category,
                    "priority": priority,
                    "icon": icon,
                    "description": description,
                    "location": location
                }

                validated_tasks.append(validated_task)

            return validated_tasks

        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Raw response: {response_content}")
            print(f"Cleaned JSON: {clean_json}")

            # Enhanced fallback with proper time parsing using dateparser + helpers
            target_date = parse_relative_date(prompt_data.prompt, current_datetime)
            start_time = parse_time_from_text(prompt_data.prompt, current_datetime)
            category = get_smart_category(prompt_data.prompt)
            duration = get_smart_duration(category, prompt_data.prompt)

            start_datetime = target_date.replace(
                hour=int(start_time.split(':')[0]),
                minute=int(start_time.split(':')[1]),
                second=0,
                microsecond=0
            )
            start_dt = TIMEZONE.localize(start_datetime)
            end_dt = start_dt + timedelta(minutes=duration)

            fallback_task = {
                "task": prompt_data.prompt[:50] + "..." if len(prompt_data.prompt) > 50 else prompt_data.prompt,
                "start": to_ist_iso(start_dt),
                "end": to_ist_iso(end_dt),
                "category": category,
                "priority": get_smart_priority(prompt_data.prompt),
                "icon": get_smart_icon(category, prompt_data.prompt),
                "description": None,
                "location": None
            }
            return [fallback_task]

    except Exception as e:
        print(f"Error in AI task creation: {e}")
        # Enhanced fallback with proper datetime handling
        current_datetime = get_current_datetime()
        start_time = parse_time_from_text(prompt_data.prompt, current_datetime)
        target_date = parse_relative_date(prompt_data.prompt, current_datetime)
        category = get_smart_category(prompt_data.prompt)
        duration = get_smart_duration(category, prompt_data.prompt)

        start_datetime = target_date.replace(
            hour=int(start_time.split(':')[0]),
            minute=int(start_time.split(':')[1]),
            second=0,
            microsecond=0
        )
        start_dt = TIMEZONE.localize(start_datetime)
        end_dt = start_dt + timedelta(minutes=duration)

        fallback_task = {
            "task": prompt_data.prompt[:50] + "..." if len(prompt_data.prompt) > 50 else prompt_data.prompt,
            "start": to_ist_iso(start_dt),
            "end": to_ist_iso(end_dt),
            "category": category,
            "priority": "medium",
            "icon": get_smart_icon(category, prompt_data.prompt),
            "description": None,
            "location": None
        }
        return [fallback_task]

@app.post("/api/chatbot")
async def chatbot_conversation(chat_data: ChatHistory):
    """Enhanced chatbot with better task creation and error handling"""
    try:
        current_datetime = get_current_datetime()
        current_date = current_datetime.strftime("%Y-%m-%d")
        current_time = current_datetime.strftime("%H:%M")

        # Get the latest message
        latest_message = chat_data.history[-1]["content"] if chat_data.history else ""

        # Check if this is a task creation request
        task_keywords = ['add', 'create', 'schedule', 'plan', 'set up', 'book', 'arrange']
        is_task_request = any(keyword in latest_message.lower() for keyword in task_keywords)

        if is_task_request:
            # Use the AI task creation logic
            prompt_data = Prompt(prompt=latest_message)
            tasks = await create_ai_task(prompt_data)

            return {
                "action": "createTask",
                "payload": tasks,
                "summary": f"Created {len(tasks)} task(s) for you!"
            }

        # Regular conversation
        prompt = f"""
        You are "GrindBot", an intelligent productivity assistant for the Daily Grind app.
        Provide helpful, motivational advice about productivity and task management.

        **Current Context (IST timezone):**
        - Today's date: {current_date}
        - Current time: {current_time}
        - Current day: {current_datetime.strftime("%A")}

        **Your Role:**
        - Give practical productivity tips
        - Motivate users to achieve their goals  
        - Help with time management strategies
        - Be encouraging and positive
        - Keep responses concise but helpful

        **Recent Conversation:**
        {json.dumps(chat_data.history[-3:] if len(chat_data.history) >= 3 else chat_data.history)}

        Respond naturally and helpfully to the user's message.
        """

        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
            temperature=0.7,
            max_tokens=512
        )

        response_content = chat_completion.choices[0].message.content

        # Add some motivational suggestions
        suggestions = [
            "💪 Want to add a workout to your schedule?",
            "📚 Ready to plan your study session?",
            "⚡ Need help organizing your day?",
            "🎯 Let's set up your next goal!"
        ]

        return {
            "response": response_content,
            "suggestions": suggestions[:2]  # Limit to 2 suggestions
        }

    except Exception as e:
        print(f"Error in chatbot: {e}")
        return {
            "response": "I'm having trouble connecting right now, but I'm here to help with your productivity journey! Try asking me about time management or creating tasks.",
            "suggestions": ["💪 Add a workout", "📚 Schedule study time"]
        }

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": get_current_datetime().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
