import { useEffect, useState, useRef } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Bot, Trash2, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ChatSidebar } from "../components/ChatSidebar";
import { MessageContainer } from "../components/MessageContainer";
import { ChatInput } from "../components/ChatInput";
import { api } from "@/lib/api";
import { formatAiResponse, sendAiMessage } from "@/lib/ChatService";
import { toast } from "sonner";
import {
  joinRoom,
  joinCommunityRoom,
  sendMessage,
  SendMessageToRoom,
  loadOneOnOneChatHistory,
  loadCityChatHistory,
  FormattedMessage,
} from "@/sockets/socket";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useAuthStore } from "@/store/authstore";
import { relativeTime } from "@/lib/utils";

type DoctorData = {
  id: string;
  specialty: string;
  clinicLocation: string;
  user: {
    name: string;
    profilePicture: string;
  };
  userId: string;
};

type UserData = {
  id: string;
  name: string;
  profilePicture: string;
};

type SelectedChat =
  | "ai"
  | { type: "doctor"; data: DoctorData }
  | { type: "room"; id: string; name: string; members: UserData[]; admin: UserData[] };

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const [selectedChat, setSelectedChat] = useState<SelectedChat>("ai");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<FormattedMessage[]>([]);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [communityMembers, setCommunityMembers] = useState<any[]>([]);
  const [dmConversations, setDmConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(() =>
    localStorage.getItem("ai-chat-language") || "en"
  );

  const languageOptions = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
    { code: "gu", name: "ગુજરાતી", flag: "🇮🇳" },
    { code: "pa", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
    { code: "mr", name: "मराठी", flag: "🇮🇳" },
    { code: "bn", name: "বাংলা", flag: "🇮🇳" },
    { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
    { code: "te", name: "తెలుగు", flag: "🇮🇳" },
  ];

  // Initialize socket subscription (stable, reusable handler)
  const { subscribe } = useChatSocket();

  // Fetch DM conversations for doctors
  useEffect(() => {
    if (user?.role === "DOCTOR") {
      (async () => {
        try {
          const res = await api.get(`/chat/doctor/conversations`);
          if (res.data.success) {
            setDmConversations(res.data.data.conversations);
          }
        } catch (err) {
          console.error("Error fetching DM conversations:", err);
        }
      })();
    }
  }, [user]);

  // Load AI chat history when AI tab is selected
  useEffect(() => {
    if (selectedChat === "ai") {
      loadAiChatHistoryInternal();
    }
  }, [selectedChat]);

  // Load chat history when selected chat changes
  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      if (!user) return;

      try {
        if (typeof selectedChat === "object" && selectedChat.type === "doctor") {
          const roomId = generateRoomId(user.id, selectedChat.data.userId);
          joinRoom(roomId);
          const historyRes = await loadOneOnOneChatHistory(selectedChat.data.userId);

          if (isMounted && historyRes.success) {
            setMessages(
              historyRes.data.messages.map((msg: any) => ({
                roomId,
                senderId: msg.senderId,
                receiverId: msg.receiverId,
                username: msg.sender.name,
                text: msg.message,
                time: relativeTime(msg.timestamp),
                messageType: msg.messageType,
                imageUrl: msg.imageUrl,
              }))
            );
          }
        } else if (typeof selectedChat === "object" && selectedChat.type === "room") {
          const historyRes = await loadCityChatHistory(selectedChat.name);

          if (isMounted && historyRes.success) {
            const roomId = historyRes.data?.room?.id || selectedChat.id;
            setActiveRoomId(roomId);

            if (user) {
              joinCommunityRoom(roomId, user.id, user.name);
            }

            setMessages(
              historyRes.data.messages.map((msg: any) => ({
                roomId,
                senderId: msg.senderId,
                receiverId: null,
                username: msg.sender.name,
                text: msg.message,
                time: relativeTime(msg.timestamp),
                messageType: msg.messageType,
                imageUrl: msg.imageUrl,
              }))
            );

            await fetchCommunityMembers(selectedChat.id);
          }
        } else if (selectedChat === "ai") {
          setMessages([]);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error loading chat history:", error);
          setMessages([]);
        }
      }
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [selectedChat, user]);

  // Socket message listener (stable subscription)
  useEffect(() => {
    const selectedChatRef = useRef(selectedChat);
    const userRef = useRef(user);

    selectedChatRef.current = selectedChat;
    userRef.current = user;

    const handler = (msg: FormattedMessage) => {
      const curUser = userRef.current;
      const curSelected = selectedChatRef.current;

      if (msg.senderId === curUser?.id) return;

      if (
        typeof curSelected === "object" &&
        curSelected.type === "doctor" &&
        generateRoomId(curUser?.id || "", curSelected.data.userId) === msg.roomId
      ) {
        setMessages((prev) => [...prev, msg]);
      } else if (
        typeof curSelected === "object" &&
        curSelected.type === "room" &&
        (curSelected.id === msg.roomId || (activeRoomId && activeRoomId === msg.roomId))
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const unsubscribe = subscribe(handler);
    return () => unsubscribe();
  }, [subscribe, activeRoomId]);

  // Helper functions
  function generateRoomId(id1: string, id2: string) {
    return [id1, id2].sort().join("_");
  }

  async function loadAiChatHistoryInternal() {
    try {
      const response = await api.get(`/ai-chat/history`);
      if (response?.data?.success) {
        const chats = response.data.data.chats || [];
        if (chats.length === 0) {
          setAiMessages([
            {
              id: "welcome",
              type: "ai",
              message:
                "Hello! I'm CareXpert AI. Describe your symptoms and I'll analyze them.",
              time: "Just now",
            },
          ]);
        } else {
          setAiMessages(
            chats
              .map((chat: any) => [
                {
                  id: `${chat.id}-user`,
                  type: "user",
                  message: chat.userMessage,
                  time: relativeTime(chat.createdAt),
                },
                {
                  id: `${chat.id}-ai`,
                  type: "ai",
                  message: formatAiResponse(chat),
                  time: relativeTime(chat.createdAt),
                  aiData: chat,
                },
              ])
              .flat()
          );
        }
      }
    } catch (error) {
      console.error("Error loading AI chat:", error);
      setAiMessages([
        {
          id: "welcome",
          type: "ai",
          message: "Hello! I'm CareXpert AI. Describe your symptoms.",
          time: "Just now",
        },
      ]);
    }
  }

  async function fetchCommunityMembers(roomId: string) {
    try {
      const res = await api.get(`/user/communities/${roomId}/members`);
      if (res.data.success) {
        setCommunityMembers(res.data.data.members);
      }
    } catch (error) {
      console.error("Error fetching community members:", error);
    }
  }

  async function sendAiMessageInternal(userMessage: string) {
    try {
      setIsAiLoading(true);
      setAiMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          type: "user",
          message: userMessage,
          time: relativeTime(new Date()),
        },
      ]);
      setMessage("");

      const response = await sendAiMessage(userMessage, selectedLanguage);
      if (response?.success) {
        setAiMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            type: "ai",
            message: formatAiResponse(response.data),
            time: relativeTime(new Date()),
            aiData: response.data,
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending AI message:", error);
      toast.error("Failed to get AI response");
      setAiMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          type: "ai",
          message: "Sorry, I'm having trouble processing your request.",
          time: relativeTime(new Date()),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!message.trim() || !selectedChat || !user) return;

    if (typeof selectedChat === "object" && selectedChat.type === "doctor") {
      const roomId = generateRoomId(user.id, selectedChat.data.userId);
      sendMessage({
        roomId,
        senderId: user.id,
        receiverId: selectedChat.data.userId,
        username: user.name,
        text: message.trim(),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}`,
          type: "user",
          roomId,
          senderId: user.id,
          username: user.name,
          text: message.trim(),
          time: relativeTime(new Date()),
        } as FormattedMessage,
      ]);
      setMessage("");
    } else if (selectedChat === "ai") {
      await sendAiMessageInternal(message.trim());
    } else if (typeof selectedChat === "object" && selectedChat.type === "room") {
      if (!activeRoomId) {
        toast.error("Connecting to room... please try again");
        return;
      }
      SendMessageToRoom({
        roomId: activeRoomId,
        senderId: user.id,
        username: user.name,
        text: message.trim(),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}`,
          type: "user",
          roomId: activeRoomId || undefined,
          senderId: user.id,
          username: user.name,
          text: message.trim(),
          time: relativeTime(new Date()),
        } as FormattedMessage,
      ]);
      setMessage("");
    }
  }

  async function handleClearAiChat() {
    try {
      await api.delete(`/ai-chat/history`);
      setAiMessages([
        {
          id: "welcome",
          type: "ai",
          message: "Chat cleared. Describe your symptoms.",
          time: relativeTime(new Date()),
        },
      ]);
      toast.success("AI chat history cleared");
    } catch (error) {
      console.error("Error clearing AI chat:", error);
      toast.error("Failed to clear chat");
    }
  }

  // Render Header
  const renderHeader = () => {
    if (selectedChat === "ai") {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">CareXpert AI Assistant</CardTitle>
              <CardDescription>Your personal health companion</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClearAiChat}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Chat
            </Button>
            <select
              value={selectedLanguage}
              onChange={(e) => {
                localStorage.setItem("ai-chat-language", e.target.value);
                setSelectedLanguage(e.target.value);
              }}
              className="px-3 py-1 text-sm border rounded-md dark:bg-gray-800"
            >
              {languageOptions.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    } else if (typeof selectedChat === "object" && selectedChat.type === "doctor") {
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedChat.data.user.profilePicture} />
            <AvatarFallback>
              {selectedChat.data.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{selectedChat.data.user.name}</CardTitle>
            <CardDescription>{selectedChat.data.specialty} • Online</CardDescription>
          </div>
        </div>
      );
    } else if (typeof selectedChat === "object" && selectedChat.type === "room") {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{selectedChat.name}</CardTitle>
              <CardDescription>{selectedChat.members.length} members</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMembers(!showMembers)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            {showMembers ? "Hide Members" : "Show Members"}
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="h-[calc(100%-1rem)] overflow-hidden flex flex-col mt-4">
      {/* Mobile Header */}
      <div className="lg:hidden p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Chat</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? "✕" : "☰"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden h-full">
        <ChatSidebar
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          showSidebar={showSidebar}
          onCloseSidebar={() => setShowSidebar(false)}
          dmConversations={dmConversations}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">{renderHeader()}</CardHeader>
            <MessageContainer
              selectedChat={selectedChat}
              messages={messages}
              aiMessages={aiMessages}
              isAiLoading={isAiLoading}
              currentUserId={user?.id}
              activeRoomId={activeRoomId}
              showMembers={showMembers}
              onShowMembersChange={setShowMembers}
              communityMembers={communityMembers}
            />
            <ChatInput
              message={message}
              onMessageChange={setMessage}
              onSendMessage={handleSendMessage}
              selectedChat={selectedChat}
              isLoading={isAiLoading}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}