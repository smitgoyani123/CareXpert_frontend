import { Send } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type SelectedChat =
  | "ai"
  | { type: "doctor"; data: any }
  | { type: "room"; id: string; name: string; members: any[]; admin: any[] };

interface ChatInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  selectedChat: SelectedChat;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  message,
  onMessageChange,
  onSendMessage,
  selectedChat,
  isLoading = false,
  placeholder = "Type your message...",
}: ChatInputProps) {
  const isDisabled = !message.trim() || (selectedChat === "ai" && isLoading);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={message}
          disabled={selectedChat === "ai" && isLoading}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onMessageChange(e.target.value)
          }
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button onClick={onSendMessage} className="px-6" disabled={isDisabled}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
