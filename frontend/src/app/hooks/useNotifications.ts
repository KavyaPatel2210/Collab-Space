import * as React from "react";
import API from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { getSocket } from "../lib/socket";
import { toast } from "sonner";

export interface Notification {
  _id: string;
  type: 'message' | 'share' | 'edit';
  title: string;
  message: string;
  documentId?: string;
  fromUser?: { _id: string; name: string; };
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchNotifications = React.useCallback(async () => {
    if (!user) return;
    try {
      const res = await API.get("/api/notifications");
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: Notification) => !n.read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchNotifications();
    
    // NUCLEAR OPTION: 5-second polling fallback
    const interval = setInterval(fetchNotifications, 5000);

    if (user) {
      const socket = getSocket();
      
      const identify = () => {
        socket.emit('identify-user', user.id);
      };

      if (socket.connected) identify();
      socket.on('connect', identify);

      const handleNewNotification = (notif: Notification) => {
        // Ignore notifications from ourselves
        if (notif.fromUser?._id === user.id) return;

        setNotifications(prev => {
          if (prev.find(n => n._id === notif._id)) return prev;
          return [notif, ...prev];
        });
        setUnreadCount(prev => prev + 1);
        
        toast.info(notif.title, {
          description: notif.message,
          action: notif.documentId ? {
            label: "Open",
            onClick: () => window.location.href = `/editor/${notif.documentId}?tab=chat`
          } : undefined
        });
      };

      socket.on('new-notification', handleNewNotification);

      return () => {
        clearInterval(interval);
        socket.off('connect', identify);
        socket.off('new-notification', handleNewNotification);
      };
    }
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await API.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
}
