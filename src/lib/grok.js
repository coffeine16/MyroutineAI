import Groq from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROK_API_KEY;

const groq = new Groq({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, 
});

export const runAiTaskParser = async (userInput) => {
  const prompt = `
    You are an intelligent task scheduler for a to-do list app. Your job is to parse a user's natural language input and convert it into a structured JSON object.

    The current date is: ${new Date().toLocaleString()}.

    **Instructions:**
    1.  Analyze the user's input to extract the task details.
    2.  If a time range is given (e.g., "11pm to 1am"), use the start time for the "time" field and calculate the "duration".
    3.  Choose the most appropriate category, priority, and a single emoji icon.
    4.  Respond ONLY with a valid JSON object. Do not include any other text, explanations, or markdown formatting like \`\`\`json.

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
    {
      "task": "DSA",
      "time": "23:00",
      "duration": "30min",
      "category": "study",
      "priority": "high",
      "icon": "🎯"
    }

    ---
    **User's Input to process:** "${userInput}"
    ---
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      // --- CHANGE THIS LINE ---
      model: 'llama3-8b-8192', // Use a current, supported model
      // ----------------------
      response_format: { type: "json_object" },
    });

    const responseContent = chatCompletion.choices[0]?.message?.content || "";
    console.log("Raw AI Response:", responseContent);

    const firstBracket = responseContent.indexOf('{');
    const lastBracket = responseContent.lastIndexOf('}');

    if (firstBracket !== -1 && lastBracket !== -1) {
      const jsonString = responseContent.substring(firstBracket, lastBracket + 1);
      return JSON.parse(jsonString);
    } else {
      console.error("No valid JSON object found in the AI response.");
      return null;
    }

  } catch (error) {
    console.error("Error processing AI response:", error);
    return null;
  }
};

export const runChatbotConversation = async (conversationHistory) => {
  const prompt = `
    You are a friendly and helpful productivity assistant for the "Daily Grind" app. Your name is GrindBot.
    You can chat with the user about productivity, help them schedule their day, or perform actions.

    **ACTION COMMANDS:**
    If the user asks you to create a task, your response MUST be a single JSON object with the key "action" set to "createTask", and a "payload" key containing the extracted task details.

    **CONVERSATIONAL RESPONSES:**
    For all other questions or conversational chat, respond naturally as an assistant. Do not use JSON.

    **EXAMPLE 1: User asks to create a task**
    User: "hey can you add a task to go to the gym tomorrow at 5:30 pm"
    Your Response:
    {
      "action": "createTask",
      "payload": {
        "task": "Go to the gym",
        "time": "17:30",
        "duration": "1h",
        "category": "fitness",
        "priority": "medium",
        "icon": "💪"
      }
    }

    **EXAMPLE 2: User asks a question**
    User: "what's a good way to stay focused?"
    Your Response:
    "A great technique is the Pomodoro method! You work in focused 25-minute intervals with short breaks in between. It's excellent for maintaining concentration."

    ---
    Current Conversation History:
    ${JSON.stringify(conversationHistory)}
    ---
    Based on the last user message, provide your response.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
    });
    const responseContent = chatCompletion.choices[0]?.message?.content || "";
    return responseContent;
  } catch (error) {
    console.error("Error calling Grok API:", error);
    return "Sorry, I'm having trouble connecting right now.";
  }
};