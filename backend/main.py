import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import json
from datetime import datetime # Import the datetime module

load_dotenv()

app = FastAPI()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Prompt(BaseModel):
    prompt: str

class ChatHistory(BaseModel):
    history: list

@app.get("/")
def read_root():
    return {"Hello": "From Backend"}

@app.post("/api/ai-task")
async def create_ai_task(prompt_data: Prompt):
    # Use Python's datetime to get the current date
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    prompt = f"""
    You are an intelligent task scheduler for a to-do list app. Your job is to parse a user's natural language input and convert it into a structured JSON object.

    The current date is: {current_date}.

    **Instructions:**
    1.  Analyze the user's input to extract the task details.
    2.  If a time range is given (e.g., "11pm to 1am"), use the start time for the "time" field and calculate the "duration".
    3.  Choose the most appropriate category, priority, and a single emoji icon.
    4.  Respond ONLY with a valid JSON object. Do not include any other text, explanations, or markdown formatting like ```json.

    **Fields to extract:**
    - "task": The name or description of the task. (String)
    - "time": The start time in 24-hour HH:MM format. (String, default: "12:00")
    - "duration": The estimated duration. (String, e.g., "1h", "30min", default: "1h")
    - "category": Choose from ["personal", "study", "work", "fitness"]. (String, default: "personal")
    - "priority": Choose from ["low", "medium", "high"]. (String, default: "medium")
    - "icon": A single, appropriate emoji for the task. (String, default: '📝')

    **Example:**
    User Input: "11pm to 11:30pm DSA"
    Expected JSON Output:
    {{
      "task": "DSA",
      "time": "23:00",
      "duration": "30min",
      "category": "study",
      "priority": "high",
      "icon": "🎯"
    }}

    ---
    **User's Input to process:** "{prompt_data.prompt}"
    ---
    """
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
            response_format={"type": "json_object"},
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return {"error": "Failed to process AI request"}


@app.post("/api/chatbot")
async def chatbot_conversation(chat_data: ChatHistory):
    prompt = f"""
    You are a friendly and helpful productivity assistant for the "Daily Grind" app. Your name is GrindBot.
    You can chat with the user about productivity, help them schedule their day, or perform actions.

    **ACTION COMMANDS:**
    If the user asks you to create a task, your response MUST be a single JSON object with the key "action" set to "createTask", and a "payload" key containing the extracted task details.

    **CONVERSATIONAL RESPONSES:**
    For all other questions or conversational chat, respond naturally as an assistant. Do not use JSON.

    **EXAMPLE 1: User asks to create a task**
    User: "hey can you add a task to go to the gym tomorrow at 5:30 pm"
    Your Response:
    {{
      "action": "createTask",
      "payload": {{
        "task": "Go to the gym",
        "time": "17:30",
        "duration": "1h",
        "category": "fitness",
        "priority": "medium",
        "icon": "💪"
      }}
    }}

    **EXAMPLE 2: User asks a question**
    User: "what's a good way to stay focused?"
    Your Response:
    "A great technique is the Pomodoro method! You work in focused 25-minute intervals with short breaks in between. It's excellent for maintaining concentration."

    ---
    Current Conversation History:
    {json.dumps(chat_data.history)}
    ---
    Based on the last user message, provide your response.
    """
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
        )
        return {"response": chat_completion.choices[0].message.content}
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return {"response": "Sorry, I'm having trouble connecting right now."}