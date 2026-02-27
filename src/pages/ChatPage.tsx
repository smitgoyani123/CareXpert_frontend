import { useEffect, useState, useRef } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Bot, Trash2, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ChatSidebar } from "../components/ChatSidebar";
import { MessageContainer } from "../components/MessageContainer";
import { ChatInput } from "../components/ChatInput";
import { api } from "@/lib/api";
import axios from "axios"; // Needed for axios.isAxiosError
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
import { notify } from "@/lib/toast";

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

  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    async function fetchAllDoctors() {
      try {
        const res = await api.get(`/patient/fetchAllDoctors`);
        if (res.data.success) {
          setDoctors(res.data.data);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          notify.error(err.response.data?.message || "Something went wrong");
        } else {
          notify.error("Unknown error occurred");
        }
      }
    }
    fetchAllDoctors();
  }, []);

  useEffect(() => {
    async function fetchCity() {
      if (!user) return;

      try {
        const endpoint =
          user.role === "DOCTOR"
            ? `/doctor/city-rooms`
            : `/patient/city-rooms`;

        const res = await api.get<CityRoomApiResponse>(endpoint);

        if (res.data.success) {
          const data = res.data.data;
          setCityRoom(Array.isArray(data) ? data : [data]);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          notify.error(err.response.data?.message || "Something went wrong");
        } else {
          notify.error("Unknown error ocurred");
        }
      }
    }
    fetchCity();
  }, [user]);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isClearingAi, setIsClearingAi] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    // Load language from localStorage or default to English
    return localStorage.getItem("ai-chat-language") || "en";
  });

  // Language options for AI chat
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

  // Function to load AI chat history
  const loadAiChatHistory = async () => {
    try {
      const response = await api.get(`/ai-chat/history`);
      if (response.data.success) {
        const chats = response.data.data.chats || [];
        if (chats.length === 0) {
          setAiMessages([
            {
              id: "welcome",
              type: "ai",
              message:
                "Hello! I'm CareXpert AI, your health assistant. Describe your symptoms and I'll help analyze them for you.",
              time: "Just now",
            },
          ]);
        } else {
          const formattedMessages = chats
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
            .flat();
          setAiMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error("Error loading AI chat history:", error);
      // Show welcome message if no history
      setAiMessages([
        {
          id: "welcome",
          type: "ai",
          message:
            "Hello! I'm CareXpert AI, your health assistant. Describe your symptoms and I'll help analyze them for you.",
          time: "Just now",
        },
      ]);
    }
  };

  // Function to format AI response for display
  const formatAiResponse = (chat: any) => {
    // Handle both API response format (probable_causes) and database format (probableCauses)
    const probableCauses = chat.probable_causes || chat.probableCauses || [];
    const { severity: _severity, recommendation, disclaimer } = chat;

    let response = `**Probable Causes:**\n${probableCauses
      .map((cause: string) => `• ${cause}`)
      .join("\n")}\n\n`;
    response += `**Recommendation:**\n${recommendation}\n\n`;
    response += `**Disclaimer:**\n${disclaimer}`;

    return response;
  };

  // Clear AI chat history
  const handleClearAiChat = async () => {
    if (isClearingAi) return;
    setIsClearingAi(true);

    // Optimistically clear UI
    setAiMessages([
      {
        id: "welcome",
        type: "ai",
        message:
          "Chat cleared. Hello! I'm CareXpert AI. Describe your symptoms and I'll help analyze them for you.",
        time: relativeTime(new Date()),
      },
    ]);

    try {
      await api.delete(`/ai-chat/history`);
      notify.success("AI chat history cleared");
    } catch (error) {
      console.error("Error clearing AI chat history:", error);
      notify.error("Failed to sync clear with server");
    } finally {
      setIsClearingAi(false);
    }
  };

  // Function to send message to AI
  const sendAiMessage = async (userMessage: string) => {
    try {
      setIsAiLoading(true);

      // Add user message immediately
      const userMsg = {
        id: `user-${Date.now()}`,
        type: "user",
        message: userMessage,
        time: relativeTime(new Date()),
      };
      setAiMessages((prev) => [...prev, userMsg]);

      // Clear the input immediately
      setMessage("");

      // Replaced with centralized API and retained timeout from main
      const response = await api.post(
        `/ai-chat/process`,
        {
          symptoms: userMessage,
          language: selectedLanguage,
        },
        {
          timeout: 15000,
        }
      );

      if (response.data.success) {
        const aiData = response.data.data;
        const aiMsg = {
          id: `ai-${Date.now()}`,
          type: "ai",
          message: formatAiResponse(aiData),
          time: relativeTime(new Date()),
          aiData: aiData,
        };
        setAiMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error("Error sending AI message:", error);
      notify.error("Failed to get AI response. Please try again.");

      // Add error message
      const errorMsg = {
        id: `error-${Date.now()}`,
        type: "ai",
        message:
          "Sorry, I'm having trouble processing your request. Please try again.",
        time: relativeTime(new Date()),
      };
      setAiMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  function generateRoomId(id1: string, id2: string) {
    return [id1, id2].sort().join("_");
  }

  // Function to fetch DM conversations for doctors
  const fetchDmConversations = async () => {
    try {
      const response = await api.get(`/chat/doctor/conversations`);
      if (response.data.success) {
        setDmConversations(response.data.data.conversations);
      }
    } catch (error) {
      console.error("Error fetching DM conversations:", error);
    }
  };

  // Function to handle conversation selection
  const handleConversationSelect = async (conversation: any) => {
    setSelectedConversation(conversation);
    setSelectedChat({
      type: "doctor",
      data: {
        id: conversation.otherUser.id,
        userId: conversation.otherUser.id,
        specialty: "Patient",
        clinicLocation: "",
        user: {
          name: conversation.otherUser.name,
          profilePicture: conversation.otherUser.profilePicture,
        },
      },
    });
    setMessages([]);

    // Join the room and load history
    const roomId = generateRoomId(user?.id || "", conversation.otherUser.id);
    joinRoom(roomId);
    await loadConversationHistory(conversation.otherUser.id);
  };

  // Function to load chat history for a conversation
  const loadConversationHistory = async (patientId: string) => {
    try {
      const response = await loadOneOnOneChatHistory(patientId);
      if (response.success) {
        const formattedMessages = response.data.messages.map((msg: any) => ({
          roomId: generateRoomId(user?.id || "", patientId),
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          username: msg.sender.name,
          text: msg.message,
          time: relativeTime(msg.timestamp),
          messageType: msg.messageType,
          imageUrl: msg.imageUrl,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error loading conversation history:", error);
    }
  };

  // Function to fetch community members
  const fetchCommunityMembers = async (roomId: string) => {
    try {
      // Replaced with centralized API and cleaned up template string
      const response = await api.get(`/user/communities/${roomId}/members`);
      if (response.data.success) {
        setCommunityMembers(response.data.data.members);
      }
    } catch (error) {
      console.error("Error fetching community members:", error);
    }
  };

  // Load chat history and join room when selected chat changes
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
        notify.error("Connecting to room... please try again in a moment");
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

    return () => {
      offMessage();
    };
  }, [selectedChat, user]);

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