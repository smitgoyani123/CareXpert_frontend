import { useEffect, useState } from "react";
import { X, Plus, Users, Bot, MessageCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authstore";
import { toast } from "sonner";
import axios from "axios";

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

type CityRoomData = {
  id: string;
  name: string;
  members: UserData[];
  admin: UserData[];
};

type SelectedChat =
  | "ai"
  | { type: "doctor"; data: DoctorData }
  | { type: "room"; id: string; name: string; members: UserData[]; admin: UserData[] };

interface ChatSidebarProps {
  selectedChat: SelectedChat;
  onSelectChat: (chat: SelectedChat) => void;
  showSidebar: boolean;
  onCloseSidebar: () => void;
  dmConversations: any[];
  selectedConversation: any;
  onSelectConversation: (conversation: any) => void;
}

export function ChatSidebar({
  selectedChat,
  onSelectChat,
  showSidebar,
  onCloseSidebar,
  dmConversations,
  selectedConversation,
  onSelectConversation,
}: ChatSidebarProps) {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [cityRooms, setCityRooms] = useState<CityRoomData[]>([]);
  const user = useAuthStore((state) => state.user);

  // Fetch doctors
  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await api.get(`/patient/fetchAllDoctors`);
        if (res.data.success) {
          setDoctors(res.data.data);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          toast.error(err.response.data?.message || "Failed to fetch doctors");
        }
      }
    }
    fetchDoctors();
  }, []);

  // Fetch city rooms
  useEffect(() => {
    async function fetchCityRooms() {
      if (!user) return;

      try {
        const endpoint =
          user.role === "DOCTOR" ? `/doctor/city-rooms` : `/patient/city-rooms`;
        const res = await api.get<{ success: boolean; data: CityRoomData | CityRoomData[] }>(endpoint);

        if (res.data.success) {
          const data = res.data.data;
          setCityRooms(Array.isArray(data) ? data : [data]);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          toast.error(err.response.data?.message || "Failed to fetch rooms");
        }
      }
    }
    fetchCityRooms();
  }, [user]);

  return (
    <>
      {/* Mobile Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onCloseSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? "block" : "hidden"
        } lg:block w-80 flex-shrink-0 lg:mr-6 lg:relative fixed lg:top-0 top-0 left-0 h-full z-50 lg:z-auto bg-white dark:bg-gray-900 lg:bg-transparent`}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-4 border-b border-gray-200 dark:border-gray-700">
          <Button variant="ghost" size="sm" onClick={onCloseSidebar}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="ai" className="space-y-4 flex flex-col h-full">
          <TabsList
            className={`grid w-full ${
              user?.role === "DOCTOR" ? "grid-cols-4" : "grid-cols-3"
            }`}
          >
            <TabsTrigger value="ai" className="text-xs">
              AI
            </TabsTrigger>
            <TabsTrigger value="doctors" className="text-xs">
              Doctors
            </TabsTrigger>
            {user?.role === "DOCTOR" && (
              <TabsTrigger value="patients" className="text-xs">
                Patients
              </TabsTrigger>
            )}
            <TabsTrigger value="community" className="text-xs">
              Community
            </TabsTrigger>
          </TabsList>

          {/* AI Tab */}
          <TabsContent value="ai" className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="h-5 w-5 text-purple-600" />
                  CareXpert AI
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto scrollbar-hide">
                <div
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedChat === "ai"
                      ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => {
                    onSelectChat("ai");
                    onCloseSidebar();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        AI Assistant
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Always available
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Doctors Tab */}
          <TabsContent value="doctors" className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Doctor Chats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                {doctors.length > 0 ? (
                  doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        typeof selectedChat === "object" &&
                        selectedChat.type === "doctor" &&
                        selectedChat.data.id === doctor.id
                          ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => {
                        onSelectChat({ type: "doctor", data: doctor });
                        onCloseSidebar();
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={doctor.user.profilePicture || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {doctor.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {doctor.user.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {doctor.specialty}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    No doctors found.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patients Tab - Only for Doctors */}
          {user?.role === "DOCTOR" && (
            <TabsContent value="patients" className="flex-1 overflow-hidden">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-green-600" />
                    Patient Messages
                  </CardTitle>
                  <CardDescription>Chat with your patients</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[500px] overflow-y-auto scrollbar-hide">
                    {dmConversations.length > 0 ? (
                      dmConversations.map((conversation) => (
                        <div
                          key={conversation.otherUser.id}
                          className={`p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                            selectedConversation?.otherUser.id ===
                            conversation.otherUser.id
                              ? "bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500"
                              : ""
                          }`}
                          onClick={() => {
                            onSelectConversation(conversation);
                            onCloseSidebar();
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={
                                  conversation.otherUser.profilePicture ||
                                  "/placeholder.svg"
                                }
                              />
                              <AvatarFallback>
                                {conversation.otherUser.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {conversation.otherUser.name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {conversation.lastMessage.message}
                              </p>
                            </div>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No conversations yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Community Tab */}
          <TabsContent value="community" className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    City Rooms
                  </div>
                  <Plus className="bg-gray-200 dark:bg-gray-700 rounded-full h-8 w-8 p-1" />
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                {cityRooms.length > 0 ? (
                  cityRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        typeof selectedChat === "object" &&
                        selectedChat.type === "room" &&
                        selectedChat.name === room.name
                          ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => {
                        onSelectChat({
                          type: "room",
                          id: room.id,
                          name: room.name,
                          members: room.members,
                          admin: room.admin,
                        });
                        onCloseSidebar();
                      }}
                    >
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {room.name}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {room.members.length} members
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Loading city rooms...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
