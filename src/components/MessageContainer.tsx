import { useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Stethoscope, User } from "lucide-react";
import { FormattedMessage } from "@/sockets/socket";

type SelectedChat =
  | "ai"
  | { type: "doctor"; data: any }
  | { type: "room"; id: string; name: string; members: any[]; admin: any[] };

interface MessageContainerProps {
  selectedChat: SelectedChat;
  messages: FormattedMessage[];
  aiMessages: any[];
  isAiLoading: boolean;
  currentUserId?: string;
  activeRoomId: string | null;
  showMembers: boolean;
  onShowMembersChange: (show: boolean) => void;
  communityMembers: any[];
}

function normalizeSeverity(severity: string) {
  const severityLower = severity.toLowerCase();
  if (
    severityLower.includes("severe") ||
    severityLower.includes("grave") ||
    severityLower.includes("severo") ||
    severityLower.includes("sévère")
  ) {
    return "severe";
  } else if (
    severityLower.includes("moderate") ||
    severityLower.includes("moderado") ||
    severityLower.includes("modéré") ||
    severityLower.includes("moderato")
  ) {
    return "moderate";
  } else {
    return "mild";
  }
}

export function MessageContainer({
  selectedChat,
  messages,
  aiMessages,
  isAiLoading,
  currentUserId,
  activeRoomId,
  showMembers,
  communityMembers,
}: MessageContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiMessages, isAiLoading]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
        {selectedChat === "ai" && (
          <>
            {aiMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex mb-4 ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.type === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                  }`}
                >
                  {msg.type === "ai" ? (
                    <div className="text-sm">
                      {msg.aiData && (
                        <div className="mb-3">
                          <Badge
                            variant={
                              normalizeSeverity(msg.aiData.severity) === "severe"
                                ? "destructive"
                                : normalizeSeverity(msg.aiData.severity) === "moderate"
                                ? "default"
                                : "secondary"
                            }
                            className="mb-2"
                          >
                            {msg.aiData.severity.charAt(0).toUpperCase() +
                              msg.aiData.severity.slice(1)}{" "}
                            Severity
                          </Badge>
                        </div>
                      )}
                      {(msg.message ?? msg.text ?? "")
                        .split("\n")
                        .map((line: string, index: number) => {
                          if (line.startsWith("**") && line.endsWith("**")) {
                            return (
                              <div
                                key={index}
                                className="font-semibold text-purple-600 dark:text-purple-400 mb-2"
                              >
                                {line.replace(/\*\*/g, "")}
                              </div>
                            );
                          } else if (line.startsWith("•")) {
                            return (
                              <div key={index} className="ml-4 mb-1">
                                {line}
                              </div>
                            );
                          } else if (line.trim() === "") {
                            return <br key={index} />;
                          } else {
                            return (
                              <div key={index} className="mb-2">
                                {line}
                              </div>
                            );
                          }
                        })}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.message ?? msg.text}</p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      msg.type === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-lg max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-sm">AI is analyzing...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Doctor and Community Chats */}
        {typeof selectedChat === "object" &&
          (selectedChat.type === "doctor" || selectedChat.type === "room") &&
          (messages.length > 0 ? (
            messages
              .filter((msg) =>
                selectedChat.type === "room"
                  ? !msg.roomId || msg.roomId === (activeRoomId || selectedChat.id)
                  : true
              )
              .map((msg, index) => (
                <div
                  key={index}
                  className={`flex mb-2 ${
                    (msg as any).type === "user" || msg.senderId === currentUserId
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {selectedChat.type === "room" &&
                    !((msg as any).type === "user" || msg.senderId === currentUserId) && (
                      <div className="mr-2 mt-[2px]">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={"/placeholder-user.jpg"} />
                          <AvatarFallback className="text-[10px]">
                            {msg.username?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  <div
                    className={`max-w-[80%] py-2 px-[10px] rounded-lg ${
                      (msg as any).type === "user" || msg.senderId === currentUserId
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    {msg.messageType === "IMAGE" && msg.imageUrl ? (
                      <img
                        src={msg.imageUrl}
                        alt="sent-img"
                        className="rounded mb-1 max-w-full h-auto"
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    )}
                    <p className="text-xs mt-1 text-right text-gray-400">{msg.time}</p>
                  </div>
                  {selectedChat.type === "room" &&
                    ((msg as any).type === "user" || msg.senderId === currentUserId) && (
                      <div className="ml-2 mt-[2px]">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={"/placeholder-user.jpg"} />
                          <AvatarFallback className="text-[10px]">
                            {currentUserId?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                </div>
              ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {selectedChat.type === "doctor"
                  ? "Start a conversation with your doctor"
                  : "Join the community discussion"}
              </p>
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Community Members Section */}
      {typeof selectedChat === "object" &&
        selectedChat.type === "room" &&
        showMembers && (
          <div className="border-t p-4 bg-gray-50 dark:bg-gray-800 max-h-64 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Community Members ({communityMembers.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {communityMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.profilePicture} />
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {member.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {member.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={member.role === "DOCTOR" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {member.role === "DOCTOR" ? (
                          <>
                            <Stethoscope className="h-3 w-3 mr-1" />
                            Doctor
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            Patient
                          </>
                        )}
                      </Badge>
                      {member.specialty && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {member.specialty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
