import React from "react";
import { cn } from "@/lib/utils";

export type MessageBubbleProps = {
  role: "user" | "assistant";
  text: string;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, text }) => {
  const isUser = role === "user";
  return (
    <div
      className={cn(
        "w-full flex",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] md:max-w-[70%] rounded-lg px-4 py-3 shadow-sm border",
          isUser
            ? "bg-primary text-primary-foreground border-transparent"
            : "bg-card text-foreground border-border"
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
      </div>
    </div>
  );
};
