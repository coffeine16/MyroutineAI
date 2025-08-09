import Groq from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROK_API_KEY;

const groq = new Groq({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, 
});

export const runAiTaskParser = async (userInput) => {
  const prompt = `
    You are an intelligent task scheduler for a to-do list app.
    Your job is to parse a user's natural language input and convert it into a structured JSON object for a new task.
    The current date is: ${new Date().toLocaleString()}.
    Analyze the following user input: "${userInput}"
    Extract: "task" (name), "time" (HH:MM format), "category" (from ["personal", "study", "work", "fitness"]), "priority" (from ["low", "medium", "high"]), and an "icon" (single emoji).
    Respond ONLY with the JSON object.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gemma-7b-it',
      response_format: { type: "json_object" },
    });
    const responseContent = chatCompletion.choices[0]?.message?.content;
    return JSON.parse(responseContent);
  } catch (error) {
    console.error("Error calling Grok API:", error);
    return null;
  }
};