// Automatically detect if you're running locally or in production
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? "http://localhost:8000"  // Local development
  : "https://myroutineai-backend.onrender.com";  // Production

// Alternative using environment variables (if using Vite)
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://myroutineai-backend.onrender.com";

console.log('Using backend URL:', BACKEND_URL); // For debugging

export const runAiTaskParser = async (userInput) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userInput }),
    });
    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
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
      throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.response || JSON.stringify(data);
  } catch (error) {
    console.error("Error communicating with backend for chatbot:", error);
    return "Sorry, I had trouble connecting to the server.";
  }
};