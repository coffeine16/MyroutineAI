const BACKEND_URL = "https://myroutineai-backend.onrender.com";

export const runAiTaskParser = async (userInput) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userInput }),
    });
    if (!response.ok) {
      throw new Error("Backend request failed for task parser");
    }
    return await response.json();
  } catch (error) {
    console.error("Error communicating with backend for task parsing:", error);
    return null;
  }
};

export const runChatbotConversation = async (conversationHistory) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: conversationHistory }),
    });
    if (!response.ok) {
      throw new Error("Backend request failed for chatbot");
    }
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error communicating with backend for chatbot:", error);
    return "Sorry, I had trouble connecting to the server.";
  }
};