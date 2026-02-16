// useGmailNotifications - Desktop notifications for new Gmail emails
import { useEffect, useRef, useCallback, useState } from "react";
import { useGoogleServices } from "./useGoogleServices";
import { useAuth } from "./useAuth";

interface GmailNotificationOptions {
  enabled: boolean;
  pollIntervalMs?: number; // default 60000 (1 min)
  onNewEmails?: (count: number) => void;
}

export function useGmailNotifications(options: GmailNotificationOptions) {
  const { enabled, pollIntervalMs = 60000, onNewEmails } = options;
  const { getAccessToken } = useGoogleServices();
  const { user } = useAuth();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem("gmail_notifications_enabled") === "true";
  });
  const lastHistoryIdRef = useRef<string | null>(
    localStorage.getItem("gmail_last_history_id"),
  );
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setPermissionGranted(Notification.permission === "granted");
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;

    if (Notification.permission === "granted") {
      setPermissionGranted(true);
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    const result = await Notification.requestPermission();
    const granted = result === "granted";
    setPermissionGranted(granted);
    return granted;
  }, []);

  // Toggle notifications
  const toggleNotifications = useCallback(async () => {
    if (!notificationsEnabled) {
      const granted = await requestPermission();
      if (granted) {
        setNotificationsEnabled(true);
        localStorage.setItem("gmail_notifications_enabled", "true");
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem("gmail_notifications_enabled", "false");
    }
  }, [notificationsEnabled, requestPermission]);

  // Show browser notification
  const showNotification = useCallback(
    (title: string, body: string, onClick?: () => void) => {
      if (!permissionGranted || !notificationsEnabled) return;

      try {
        const notification = new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "gmail-new-email",
          renotify: true,
          silent: false,
        });

        if (onClick) {
          notification.onclick = () => {
            window.focus();
            onClick();
            notification.close();
          };
        }

        // Auto close after 8 seconds
        setTimeout(() => notification.close(), 8000);
      } catch (e) {
        console.warn("Failed to show notification:", e);
      }
    },
    [permissionGranted, notificationsEnabled],
  );

  // Check for new emails via Gmail history API
  const checkForNewEmails = useCallback(async () => {
    if (!user || !notificationsEnabled || !permissionGranted) return;

    try {
      const token = await getAccessToken(["gmail"]);
      if (!token) return;

      // If no history ID yet, get the current one and store it
      if (!lastHistoryIdRef.current) {
        const profileRes = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/profile",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (profileRes.ok) {
          const profile = await profileRes.json();
          lastHistoryIdRef.current = profile.historyId;
          localStorage.setItem("gmail_last_history_id", profile.historyId);
        }
        return;
      }

      // Check history for new messages
      const historyRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${lastHistoryIdRef.current}&historyTypes=messageAdded&labelId=INBOX`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!historyRes.ok) {
        // History ID might be too old, reset it
        if (historyRes.status === 404) {
          const profileRes = await fetch(
            "https://gmail.googleapis.com/gmail/v1/users/me/profile",
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (profileRes.ok) {
            const profile = await profileRes.json();
            lastHistoryIdRef.current = profile.historyId;
            localStorage.setItem("gmail_last_history_id", profile.historyId);
          }
        }
        return;
      }

      const historyData = await historyRes.json();

      // Update history ID
      if (historyData.historyId) {
        lastHistoryIdRef.current = historyData.historyId;
        localStorage.setItem("gmail_last_history_id", historyData.historyId);
      }

      // Count new messages added to inbox
      if (historyData.history) {
        let newCount = 0;
        const newMessageIds = new Set<string>();

        for (const entry of historyData.history) {
          if (entry.messagesAdded) {
            for (const added of entry.messagesAdded) {
              if (
                added.message?.labelIds?.includes("INBOX") &&
                !added.message?.labelIds?.includes("DRAFT")
              ) {
                if (!newMessageIds.has(added.message.id)) {
                  newMessageIds.add(added.message.id);
                  newCount++;
                }
              }
            }
          }
        }

        if (newCount > 0) {
          // Get details of the first new message for the notification
          const firstId = Array.from(newMessageIds)[0];
          try {
            const msgRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${firstId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (msgRes.ok) {
              const msgData = await msgRes.json();
              const headers = msgData.payload?.headers || [];
              const subject =
                headers.find((h: any) => h.name === "Subject")?.value ||
                "(ללא נושא)";
              const fromRaw =
                headers.find((h: any) => h.name === "From")?.value || "";
              const fromMatch = fromRaw.match(
                /^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/,
              );
              const fromName = fromMatch?.[1] || fromMatch?.[2] || fromRaw;

              const title =
                newCount === 1
                  ? `הודעה חדשה מ-${fromName}`
                  : `${newCount} הודעות חדשות`;
              const body = newCount === 1 ? subject : `כולל: ${subject}`;

              showNotification(title, body);
            }
          } catch {
            showNotification(
              `${newCount} הודעות חדשות`,
              "נכנסו הודעות חדשות לתיבת הדואר",
            );
          }

          onNewEmails?.(newCount);
        }
      }
    } catch (e) {
      console.warn("Gmail notification check failed:", e);
    }
  }, [
    user,
    notificationsEnabled,
    permissionGranted,
    getAccessToken,
    showNotification,
    onNewEmails,
  ]);

  // Start / stop polling
  useEffect(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (enabled && notificationsEnabled && permissionGranted) {
      // Initial check after short delay
      const initialTimeout = setTimeout(checkForNewEmails, 5000);

      // Then poll regularly
      pollTimerRef.current = setInterval(checkForNewEmails, pollIntervalMs);

      return () => {
        clearTimeout(initialTimeout);
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
        }
      };
    }
  }, [
    enabled,
    notificationsEnabled,
    permissionGranted,
    checkForNewEmails,
    pollIntervalMs,
  ]);

  return {
    notificationsEnabled,
    permissionGranted,
    toggleNotifications,
    requestPermission,
  };
}
