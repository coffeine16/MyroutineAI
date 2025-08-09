import Groq from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROK_API_KEY;

const groq = new Groq({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, 
});

export const runAiTaskParser = async (userInput) => {
  // This is the new, more detailed prompt.
  const prompt = `
    You are an intelligent task scheduler for a to-do list app. Your job is to parse a user's natural language input and convert it into a structured JSON object.

    The current date is: ${new Date().toLocaleString()}.

    **Instructions:**
    1.  Analyze the user's input to extract the task details.
    2.  If a time range is given (e.g., "11pm to 1am"), use the start time for the "time" field and calculate the "duration".
    3.  Choose the most appropriate category, priority, and a single emoji icon.
    4.  Respond ONLY with a valid JSON object. Do not include any other text, explanations, or markdown formatting.

    **Fields to extract:**
    - "task": The name or description of the task. (String)
    - "time": The start time in 24-hour HH:MM format. (String, default: "12:00")
    - "duration": The estimated duration. (String, e.g., "1h", "30min", "2.5h", default: "1h")
    - "category": Choose from ["personal", "study", "work", "fitness"]. (String, default: "personal")
    - "priority": Choose from ["low", "medium", "high"]. (String, default: "medium")
    - "icon": A single, appropriate emoji for the task. (String, default: '📝')

    **Example:**
    User Input: "11pm to 1am DSA"
    Expected JSON Output:
    {
      "task": "DSA",
      "time": "23:00",
      "duration": "2h",
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
      model: 'gemma-7b-it',
      response_format: { type: "json_object" },
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    
    // For debugging: Let's see what the AI is actually sending back
    console.log("Raw AI Response:", responseContent); 
    
    return JSON.parse(responseContent);
  } catch (error) {
    console.error("Error processing AI response:", error);
    return null;
  }
};