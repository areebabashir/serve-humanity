import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BRAND = {
  orange: "#f89c1b",
  accent: "#f45d22",
  blue: "#234a8f",
  ink: "#1a1a1a",
  muted: "#6b7280",
  border: "#e5e7eb",
  soft: "#fff8f0",
};

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Inline logo for email clients (CID). Falls back to LOGO_URL if file missing. */
export function getEmailLogoAttachment() {
  const candidates = [
    process.env.EMAIL_LOGO_PATH,
    path.join(__dirname, "../assets/logo.png"),
    path.join(__dirname, "../../frontend/src/assets/logo.png"),
  ].filter(Boolean);

  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        return {
          filename: "logo.png",
          path: filePath,
          cid: "sh-logo",
          contentType: "image/png",
        };
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

function logoImgHtml() {
  const remote = process.env.LOGO_URL || process.env.EMAIL_LOGO_URL;
  const src = remote || "cid:sh-logo";
  return `<img src="${src}" alt="Serve Humanity" width="64" height="64" style="display:block;width:64px;height:64px;border:0;border-radius:12px;object-fit:contain;background:#fff" />`;
}

function priorityBadge(priority) {
  if (priority === "urgent") {
    return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#fee2e2;color:#b91c1c;font-size:11px;font-weight:700;letter-spacing:.04em">URGENT</span>`;
  }
  if (priority === "high") {
    return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#ffedd5;color:#c2410c;font-size:11px;font-weight:700;letter-spacing:.04em">HIGH PRIORITY</span>`;
  }
  return "";
}

/**
 * Branded HTML email for leadership notifications.
 */
export function buildNotificationEmailTemplate({ title, body, priority = "normal", recipientName }) {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body).replace(/\n/g, "<br/>");
  const safeName = recipientName ? escapeHtml(recipientName) : "";
  const greeting = safeName ? `Assalamu Alaikum, ${safeName}` : "Assalamu Alaikum";
  const badge = priorityBadge(priority);
  const year = new Date().getFullYear();

  const subjectPrefix =
    priority === "urgent" ? "[Urgent] " : priority === "high" ? "[High] " : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:28px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${BRAND.border};box-shadow:0 8px 24px rgba(35,74,143,0.08)">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, ${BRAND.blue} 0%, #1a3568 55%, ${BRAND.accent} 100%);padding:22px 28px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="72" valign="middle">${logoImgHtml()}</td>
                  <td valign="middle" style="padding-left:14px">
                    <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.01em;line-height:1.2">Serve Humanity</div>
                    <div style="color:rgba(255,255,255,0.85);font-size:12px;margin-top:4px">Hearts That Serve</div>
                  </td>
                  <td align="right" valign="middle">${badge}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg, ${BRAND.orange}, ${BRAND.accent}, ${BRAND.blue});font-size:0;line-height:0">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 8px">
              <p style="margin:0 0 16px;font-size:14px;color:${BRAND.muted}">${greeting},</p>
              <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:${BRAND.blue};font-weight:700">${safeTitle}</h1>
              <div style="background:${BRAND.soft};border-left:4px solid ${BRAND.orange};border-radius:0 12px 12px 0;padding:16px 18px">
                <p style="margin:0;font-size:15px;line-height:1.65;color:${BRAND.ink}">${safeBody}</p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px 8px">
              <p style="margin:0;font-size:13px;color:${BRAND.muted};line-height:1.5">
                This message was sent by Serve Humanity leadership. Please do not reply to this automated email unless instructed.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 28px 28px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BRAND.border};padding-top:18px">
                <tr>
                  <td>
                    <div style="font-size:13px;font-weight:600;color:${BRAND.blue}">Serve Humanity</div>
                    <div style="font-size:12px;color:${BRAND.muted};margin-top:4px">Serving with compassion · Together for humanity</div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:12px">&copy; ${year} Serve Humanity. All rights reserved.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "Serve Humanity — Khidmat-e-Insaniyat Welfare Society",
    "",
    greeting + ",",
    "",
    title,
    "",
    body,
    "",
    "— Serve Humanity leadership",
  ].join("\n");

  const attachments = [];
  const logo = getEmailLogoAttachment();
  if (logo && !process.env.LOGO_URL && !process.env.EMAIL_LOGO_URL) {
    attachments.push(logo);
  }

  return {
    subject: `${subjectPrefix}${title}`,
    html,
    text,
    attachments,
  };
}
