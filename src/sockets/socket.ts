import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";

const URL = import.meta.env.VITE_SOCKET_URL;

export const socket: Socket = io(URL, {
  autoConnect: false, // Prevent immediate connection
  withCredentials: true,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

interface DmMessageData {
  roomId: string;
  senderId: string;
  receiverId: string;
  username: string;
  text: string;
  image?: string;
}

interface RoomMessageData {
  roomId: string;
  senderId: string;
  username: string;
  text: string;
  image?: string;
}

export interface FormattedMessage {
  roomId: string;
  senderId: string;
  receiverId?: string;
  username: string;
  text: string;
  time: string;
  messageType?: string;
  imageUrl?: string;
}

export const joinRoom = (roomId: string) => {
  // Join a DM room (1:1)
  socket.emit("joinDmRoom", roomId);
};

export const joinCommunityRoom = (
  roomId: string,
  userId: string,
  username: string
) => {
  // Join a community/city room and notify others
  socket.emit("joinRoom", {
    event: "joinRoom",
    data: { roomId, userId, username },
  });
};

export const sendMessage = (message: DmMessageData) => {
  socket.emit("dmMessage", {
    event: "dmMessage",
    data: message,
  });
};

export const onMessage = (callback: (msg: FormattedMessage) => void) => {
  // Remove any existing registration of this exact callback before re-adding it.
  // This prevents duplicate listeners when the component remounts (e.g. React StrictMode)
  // and also ensures offMessage(callback) can correctly remove the listener, since the
  // callback is now registered directly rather than wrapped in an anonymous function.
  socket.off("message", callback);
  socket.on("message", callback);
};

export const offMessage = (callback?: (msg: FormattedMessage) => void) => {
  if (callback) {
    socket.off("message", callback);
  } else {
    socket.off("message");
  }
};

export const SendMessageToRoom = (message: RoomMessageData) => {
  socket.emit("roomMessage", {
    event: "roomMessage",
    data: message,
  });
};

// API functions for loading chat history
export const loadOneOnOneChatHistory = async (
  otherUserId: string,
  page: number = 1,
  limit: number = 50
) => {
  try {
    const response = await api.get(`/chat/one-on-one/${otherUserId}`,
      {
        params: { page, limit },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error loading 1-on-1 chat history:", error);
    throw error;
  }
};

export const loadCityChatHistory = async (
  cityName: string,
  page: number = 1,
  limit: number = 50
) => {
  try {
    const response = await api.get(`/chat/city/${encodeURIComponent(cityName)}`,
      {
        params: { page, limit },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error loading city chat history:", error);
    throw error;
  }
};

export const loadRoomChatHistory = async (
  roomId: string,
  page: number = 1,
  limit: number = 50
) => {
  try {
    const response = await api.get(`/chat/room/${roomId}`, {
      params: { page, limit },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error loading room chat history:", error);
    throw error;
  }
};

export const loadDmChatHistory = async (
  roomId: string,
  page: number = 1,
  limit: number = 50
) => {
  try {
    const response = await api.get(`/chat/dm/${roomId}`, {
      params: { page, limit },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error loading DM chat history:", error);
    throw error;
  }
};
