import { io, Socket } from "socket.io-client";
import { API_URL } from "../config";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    console.log("Initializing shared socket connection...");
    socket = io(API_URL);
    
    socket.on("connect", () => {
      console.log("Socket connected! ID:", socket?.id);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected! Reason:", reason);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
