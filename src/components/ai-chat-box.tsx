import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Send, Trash2, Bot, User } from "lucide-react";
import axios from "axios";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authstore";
import { notify } from "@/lib/toast";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "ai",
  content: "Hello! I'm your AI health assistant. How can I help you today?",
  timestamp: new Date(),
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2 max-w-[80%]">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mt-1">
          <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-gray-100 dark:bg-gray-800">
          <div className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="inline-block w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="inline-block w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      <div
        className={`flex items-start gap-2 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1 ${
            isUser
              ? "bg-blue-100 dark:bg-blue-900/40"
              : "bg-emerald-100 dark:bg-emerald-900/40"
          }`}
        >
          {isUser ? (
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>

        {/* Bubble + Timestamp */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
              isUser
                ? "bg-blue-600 text-white rounded-tr-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm"
            }`}
          >
            {message.content}
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1 select-none">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AIChatBox() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    // Simulate AI response with delay
    const delay = 1000 + Math.random() * 1500;
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: generateId(),
        role: "ai",
        content:
          "I'm a demo AI assistant. In the full version, I'll be able to help you with health-related questions!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, delay);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleClearChat = async () => {
    if (isClearing) return;
    setIsClearing(true);

    try {
      setMessages([
        {
          ...WELCOME_MESSAGE,
          id: generateId(),
          content: "Chat cleared. How can I assist you now?",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
      setMessage("");

      // Scroll container to top after clearing
      chatContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });

      const isUserLoggedIn = useAuthStore.getState().user !== null;

      if (isUserLoggedIn) {
        await api.delete("/ai-chat/history");
        notify.success("Chat history cleared");
      } else {
        notify.success("Chat cleared");
      }
    } catch (error) {
      console.error("Error clearing backend chat history:", error);
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        notify.error("Failed to clear chat history");
      }
    } finally {
      setIsClearing(false);
    }
  };

  const isSendDisabled = !message.trim() || isLoading;

  return (
    <div className="flex flex-col h-[500px] sm:h-[520px] w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            AI Assistant
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearChat}
          disabled={isClearing}
          className="text-xs h-8"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          {isClearing ? "Clearing..." : "Clear chat"}
        </Button>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoading ? "Waiting for response…" : "Type your message…"
            }
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-shadow"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isSendDisabled}
            className="rounded-full h-10 w-10 shrink-0 transition-opacity disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}