import { api } from "./api";

export type NotificationAudience = "bogs" | "bogs_presidents" | "all_members";
export type NotificationPriority = "normal" | "high" | "urgent";

export const AUDIENCE_LABELS: Record<NotificationAudience, string> = {
  bogs: "BOGs & CEO",
  bogs_presidents: "BOGs, CEO & Presidents",
  all_members: "Everyone (all members)",
};

export interface InboxNotification {
  _id: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  audience: NotificationAudience;
  createdBy?: { _id: string; name: string; email: string } | null;
  createdAt: string;
  expiresAt?: string | null;
  readAt?: string | null;
}

export interface SentNotification {
  _id: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  audience: NotificationAudience;
  createdBy?: { _id: string; name: string; email: string } | null;
  createdAt: string;
  expiresAt?: string | null;
  recipientCount: number;
  emailedCount: number;
  emailFailedCount: number;
  readCount: number;
}

export async function fetchInbox() {
  const res = await api<{ success: true; data: InboxNotification[] }>("/notifications/inbox");
  return res.data;
}

export async function fetchUnreadCount() {
  const res = await api<{ success: true; data: { count: number } }>("/notifications/unread-count");
  return res.data.count;
}

export async function fetchSentNotifications() {
  const res = await api<{ success: true; data: SentNotification[] }>("/notifications");
  return res.data;
}

export async function createNotification(payload: {
  title: string;
  body: string;
  audience: NotificationAudience;
  priority: NotificationPriority;
  expiresAt?: string | null;
}) {
  return api<{
    success: true;
    data: SentNotification;
    meta: {
      recipientCount: number;
      emailed: number;
      emailFailed: number;
      emailError?: string | null;
    };
  }>("/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function markNotificationRead(id: string) {
  return api<{ success: true; data: { _id: string; readAt: string } }>(
    `/notifications/${id}/read`,
    { method: "PATCH" },
  );
}
