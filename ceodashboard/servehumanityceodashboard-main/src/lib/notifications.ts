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

/** Remove from the current user's inbox only (other recipients keep it). */
export async function dismissNotification(id: string) {
  return api<{ success: true; message?: string; data: { _id: string; dismissedAt: string } }>(
    `/notifications/${id}/inbox`,
    { method: "DELETE" },
  );
}

/** Leadership: delete one sent notification (removes for everyone). */
export async function deleteSentNotification(id: string) {
  return api<{ success: true; message?: string }>(`/notifications/${id}`, {
    method: "DELETE",
  });
}

/** Leadership: clear all sent notification history. */
export async function clearSentHistory() {
  return api<{ success: true; message?: string; data: { deletedCount: number } }>(
    "/notifications",
    { method: "DELETE" },
  );
}

export interface WarningMailRow {
  _id: string;
  title: string;
  body: string;
  createdAt: string;
  chapterName: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole?: string;
  emailed: boolean;
  emailError?: string | null;
  createdBy?: { _id: string; name: string; email: string } | null;
  chapter?: { _id: string; name: string; city?: string } | null;
}

export async function fetchWarningMails() {
  const res = await api<{ success: true; data: WarningMailRow[] }>("/notifications/warning");
  return res.data;
}

export async function sendWarningMail(payload: {
  chapterId: string;
  userId: string;
  title?: string;
  body: string;
}) {
  return api<{
    success: true;
    data: WarningMailRow;
    meta: {
      emailed: number;
      emailFailed: number;
      emailError?: string | null;
      recipientName: string;
      recipientEmail: string;
      chapterName: string;
    };
  }>("/notifications/warning", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
