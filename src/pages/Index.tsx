import { useEffect } from "react";
import { ChatApp } from "@/components/chat/ChatApp";

const Index = () => {
  useEffect(() => {
    document.title = "AI Chatbot with Voice & Docs | Gemini";
  }, []);
  return (
    <div className="min-h-screen">
      <ChatApp />
    </div>
  );
};

export default Index;
