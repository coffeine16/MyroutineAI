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