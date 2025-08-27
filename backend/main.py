import os
import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Union
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Daily Grind API", version="2.0.0")

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

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
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except ValueError:
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

def parse_relative_time(text: str, current_date: datetime) -> str:
    """Enhanced relative time parsing"""
    text_lower = text.lower()
    
    # Handle specific dates
    if "tomorrow" in text_lower:
        tomorrow = current_date + timedelta(days=1)
        return tomorrow.strftime("%Y-%m-%d")
    
    if "today" in text_lower:
        return current_date.strftime("%Y-%m-%d")
    
    # Handle "next week", "this week"
    if "next week" in text_lower:
        days_ahead = 7 - current_date.weekday()
        target_date = current_date + timedelta(days=days_ahead)
        return target_date.strftime("%Y-%m-%d")
    
    # Handle weekdays (next occurrence)
    weekdays = {
        'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
        'friday': 4, 'saturday': 5, 'sunday': 6
    }
    
    for day_name, day_num in weekdays.items():
        if day_name in text_lower:
            days_ahead = day_num - current_date.weekday()
            if days_ahead <= 0:  # Target day already happened this week
                days_ahead += 7
            target_date = current_date + timedelta(days=days_ahead)
            return target_date.strftime("%Y-%m-%d")
    
    # Default to today
    return current_date.strftime("%Y-%m-%d")

def get_smart_duration(category: str, task_text: str) -> int:
    """Get smart duration based on task category and content"""
    task_lower = task_text.lower()
    
    # Specific duration hints
    if any(word in task_lower for word in ['quick', 'brief', 'short']): 
        return 30
    if any(word in task_lower for word in ['long', 'deep', 'intensive', 'thorough']): 
        return 180
    if any(word in task_lower for word in ['2 hour', '2hr', '2 hrs']): 
        return 120
    if any(word in task_lower for word in ['1 hour', '1hr', '1 hrs']): 
        return 60
    if any(word in task_lower for word in ['30 min', 'half hour']): 
        return 30
    
    # Category-based defaults (in minutes)
    durations = {
        "study": 120,    # 2 hours
        "work": 60,      # 1 hour
        "fitness": 90,   # 1.5 hours
        "personal": 60   # 1 hour
    }
    
    return durations.get(category, 60)

def get_smart_time(category: str, time_of_day: str) -> str:
    """Get smart default time based on category and time of day"""
    time_defaults = {
        "morning": {
            "fitness": "07:00",
            "personal": "08:00",
            "work": "09:00",
            "study": "09:00"
        },
        "afternoon": {
            "work": "14:00",
            "study": "13:00",
            "fitness": "15:00",
            "personal": "16:00"
        },
        "evening": {
            "personal": "18:00",
            "study": "19:00",
            "fitness": "17:00",
            "work": "18:00"
        }
    }
    
    return time_defaults.get(time_of_day, {}).get(category, "12:00")

@app.get("/")
def read_root():
    return {"Hello": "From Daily Grind Backend", "status": "active"}

@app.post("/api/ai-task")
async def create_ai_task(prompt_data: Prompt):
    """Enhanced AI task creation with better error handling and multi-task support"""
    try:
        # Use current datetime for accurate date handling
        current_datetime = datetime.now()
        current_date = current_datetime.strftime("%Y-%m-%d")
        current_time = current_datetime.strftime("%H:%M")

        prompt = f"""
        You are an intelligent task scheduler for Daily Grind, a productivity app.
        Parse natural language input and convert it into a valid JSON array of tasks.

        **Current Context:**
        - Today's date: {current_date}
        - Current time: {current_time}
        - Current day: {current_datetime.strftime("%A")}

        **CRITICAL REQUIREMENTS:**
        1. ALWAYS respond with ONLY a valid JSON array - no explanations or extra text
        2. Support multiple tasks in one input
        3. Use ISO 8601 datetime format: "YYYY-MM-DDTHH:MM:SS"
        4. Ensure all required fields are present

        **Date Parsing Rules:**
        - "today" = {current_date}
        - "tomorrow" = {(current_datetime + timedelta(days=1)).strftime('%Y-%m-%d')}
        - Day names = next occurrence of that day
        - No date specified = today

        **Time Parsing Rules:**
        - "morning" = 08:00-11:00
        - "afternoon" = 13:00-17:00  
        - "evening" = 18:00-21:00
        - Specific times: "9am" = "09:00", "2pm" = "14:00"
        - No time = smart default based on category

        **Categories (keyword-based):**
        - "study": study, learn, coding, dsa, programming, homework, exam, research
        - "work": work, meeting, project, deadline, office, client, presentation  
        - "fitness": gym, workout, exercise, run, yoga, sports, cardio
        - "personal": everything else (default)

        **Priorities (keyword-based):**
        - "high": urgent, important, asap, critical, deadline, exam, interview
        - "low": sometime, eventually, maybe, optional, leisure
        - "medium": default

        **Required JSON Structure:**
        [
          {{
            "task": "Clear task name",
            "start": "YYYY-MM-DDTHH:MM:SS",
            "end": "YYYY-MM-DDTHH:MM:SS", 
            "category": "personal|study|work|fitness",
            "priority": "low|medium|high",
            "icon": "emoji",
            "description": "Optional description",
            "location": "Optional location"
          }}
        ]

        **Examples:**

        Input: "gym tomorrow morning and study DSA evening"
        Output: [
          {{
            "task": "Gym Session",
            "start": "{(current_datetime + timedelta(days=1)).strftime('%Y-%m-%d')}T08:00:00",
            "end": "{(current_datetime + timedelta(days=1)).strftime('%Y-%m-%d')}T09:30:00",
            "category": "fitness",
            "priority": "medium", 
            "icon": "💪",
            "description": null,
            "location": null
          }},
          {{
            "task": "DSA Study Session", 
            "start": "{(current_datetime + timedelta(days=1)).strftime('%Y-%m-%d')}T19:00:00",
            "end": "{(current_datetime + timedelta(days=1)).strftime('%Y-%m-%d')}T21:00:00",
            "category": "study",
            "priority": "high",
            "icon": "🎯",
            "description": null,
            "location": null
          }}
        ]

        Input: "urgent meeting 2pm today"
        Output: [
          {{
            "task": "Urgent Meeting",
            "start": "{current_date}T14:00:00",
            "end": "{current_date}T15:00:00", 
            "category": "work",
            "priority": "high",
            "icon": "👥",
            "description": null,
            "location": null
          }}
        ]

        User Input: "{prompt_data.prompt}"
        
        JSON Array:
        """

        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
            temperature=0.1,  # Lower temperature for consistent JSON
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
            
            # Validate each task has required fields
            validated_tasks = []
            for task in result:
                # Ensure all required fields exist
                validated_task = {
                    "task": task.get("task", "Untitled Task"),
                    "start": task.get("start", f"{current_date}T12:00:00"),
                    "end": task.get("end", f"{current_date}T13:00:00"),
                    "category": task.get("category", "personal"),
                    "priority": task.get("priority", "medium"),
                    "icon": task.get("icon", "📝"),
                    "description": task.get("description"),
                    "location": task.get("location")
                }
                validated_tasks.append(validated_task)
            
            return validated_tasks
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Raw response: {response_content}")
            print(f"Cleaned JSON: {clean_json}")
            
            # Fallback: create a simple task from the prompt
            fallback_task = {
                "task": prompt_data.prompt[:50] + "..." if len(prompt_data.prompt) > 50 else prompt_data.prompt,
                "start": f"{current_date}T12:00:00",
                "end": f"{current_date}T13:00:00",
                "category": get_smart_category(prompt_data.prompt),
                "priority": get_smart_priority(prompt_data.prompt),
                "icon": get_smart_icon(get_smart_category(prompt_data.prompt), prompt_data.prompt),
                "description": None,
                "location": None
            }
            return [fallback_task]
            
    except Exception as e:
        print(f"Error in AI task creation: {e}")
        # Return a fallback task instead of error
        fallback_task = {
            "task": prompt_data.prompt[:50] + "..." if len(prompt_data.prompt) > 50 else prompt_data.prompt,
            "start": f"{datetime.now().strftime('%Y-%m-%d')}T12:00:00",
            "end": f"{datetime.now().strftime('%Y-%m-%d')}T13:00:00",
            "category": "personal",
            "priority": "medium",
            "icon": "📝",
            "description": None,
            "location": None
        }
        return [fallback_task]

@app.post("/api/chatbot")
async def chatbot_conversation(chat_data: ChatHistory):
    """Enhanced chatbot with better task creation and error handling"""
    try:
        current_datetime = datetime.now()
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

        **Current Context:**
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
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)