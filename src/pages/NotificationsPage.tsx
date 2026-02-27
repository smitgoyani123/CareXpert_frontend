import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Bell, Check, CheckCheck, Calendar, Stethoscope } from "lucide-react";
import { api } from "@/lib/api";
import { relativeTime } from "@/lib/utils";
import { notify } from "@/lib/toast";
import axios from "axios";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  appointmentId?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchNotifications = async () => {
      try {
        const response = await api.get(
          `/user/notifications`,
          {
            withCredentials: true,
            signal: controller.signal
          }
        );

        if (response.data.success) {
          setNotifications(response.data.data.notifications);
        }
      } catch (error) {
        if (axios.isCancel(error)) return; // Ignore cancelled requests
        console.error("Error fetching notifications:", error);
        notify.error("Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    return () => controller.abort(); // Cancel on unmount
  }, []);

  const markAsRead = async (notificationId: string) => {
    setMarkingAsRead(notificationId);
    try {
      await api.put(
        `/user/notifications/${notificationId}/read`,
        {},
        { withCredentials: true }
      );

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      );
      notify.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      notify.error("Failed to mark notification as read");
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    if (isMarkingAll) return; // Guard against double-click
    setIsMarkingAll(true);
    try {
      await api.put(
        `/user/notifications/mark-all-read`,
        {},
        { withCredentials: true }
      );

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      notify.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      notify.error("Failed to mark all notifications as read");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "APPOINTMENT_ACCEPTED":
      case "APPOINTMENT_REJECTED":
      case "APPOINTMENT_REMINDER":
        return <Calendar className="h-5 w-5" />;
      case "DOCTOR_MESSAGE":
        return <Stethoscope className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "APPOINTMENT_ACCEPTED":
        return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "APPOINTMENT_REJECTED":
        return "text-red-600 bg-red-100 dark:bg-red-900/30";
      case "APPOINTMENT_REMINDER":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "DOCTOR_MESSAGE":
        return "text-purple-600 bg-purple-100 dark:bg-purple-900/30";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Stay updated with your health appointments and messages
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isMarkingAll}
            >
              {isMarkingAll ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                You'll receive notifications about appointments, messages, and important updates here.
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all duration-200 ${!notification.isRead
                  ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'opacity-75'
                }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <Badge variant="destructive" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{relativeTime(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      disabled={markingAsRead === notification.id}
                      className="ml-4"
                    >
                      {markingAsRead === notification.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}