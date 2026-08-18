/**
 * Firebase Cloud Functions - Email Notification Service
 * Uses Nodemailer (Gmail SMTP) to send emails for:
 *  1. Login credentials after user registration (signup)
 *  2. Forgot password - Firebase Auth reset link via email
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import * as nodemailer from "nodemailer";

// Lazy initialization — admin.initializeApp() is called only at request time,
// NOT at module load time. This prevents firebase deploy from timing out
// during the local code-analysis phase (when it requires() this file to
// discover exports but has no GCP credentials available).
let _appInitialized = false;
function ensureAdminInitialized(): void {
  if (!_appInitialized) {
    admin.initializeApp();
    _appInitialized = true;
  }
}

setGlobalOptions({ maxInstances: 10 });

const GMAIL_USER = process.env["GMAIL_USER"] || "";
const GMAIL_APP_PASSWORD = process.env["GMAIL_APP_PASSWORD"] || "";
const IS_DEV_MODE = process.env["EMAIL_DEV_MODE"] === "true";

// cors: true is safe for onCall functions — the callable protocol validates
// Firebase App tokens on every request; this only controls which browsers
// can initiate the preflight (OPTIONS) request.
const CALLABLE_CORS: true = true;

interface SendLoginEmailPayload {
  email: string;
  password: string;
  name: string;
  personalEmail: string;
}

interface SendForgotPasswordEmailPayload {
  email: string;
}

interface EmailResult {
  success: boolean;
  message: string;
}

function createTransporter(): nodemailer.Transporter {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
}

async function sendEmail(options: nodemailer.SendMailOptions): Promise<boolean> {
  if (IS_DEV_MODE) {
    logger.info("[EMAIL DEV MODE] Would send email", { to: options.to, subject: options.subject });
    return true;
  }
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    logger.error("[EMAIL] Credentials not configured");
    return false;
  }
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail(options);
    logger.info("[EMAIL] Sent", { messageId: info.messageId, to: options.to });
    return true;
  } catch (err: any) {
    logger.error("[EMAIL] Send error", { message: err?.message, code: err?.code });
    return false;
  }
}

export const sendLoginEmail = onCall<SendLoginEmailPayload>(
  {
    region: "asia-south1",
    secrets: ["GMAIL_USER", "GMAIL_APP_PASSWORD"],
    cors: CALLABLE_CORS,
    invoker: "public",
  },
  async (request): Promise<EmailResult> => {
    const { email, password, name, personalEmail } = request.data;
    if (!email || !password || !name || !personalEmail) {
      throw new HttpsError("invalid-argument", "email, password, name, and personalEmail are required.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalEmail)) {
      throw new HttpsError("invalid-argument", `Invalid personal email: ${personalEmail}`);
    }
    logger.info("[sendLoginEmail] Sending credentials email", { to: personalEmail, systemEmail: email });

    const year = new Date().getFullYear();
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Welcome to INTRA-D</title><style>body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f9;margin:0;padding:20px}.c{max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}.h{background:linear-gradient(135deg,#2d7a4f,#4caf7d);padding:32px 24px;text-align:center;color:#fff}.b{padding:28px 32px}.cb{background:#f0faf5;border:1px solid #b2dfca;border-radius:8px;padding:20px;margin:20px 0}.cr{padding:8px 0;border-bottom:1px dashed #d0e8da}.cr:last-child{border-bottom:none}.cl{font-size:11px;color:#666;font-weight:700;text-transform:uppercase;display:block}.cv{font-size:14px;color:#1a4a2e;font-weight:700;font-family:monospace;word-break:break-all}.w{background:#fff8e1;border-left:4px solid #ffc107;padding:12px;font-size:13px;color:#7a5f00;margin:16px 0}.btn{display:inline-block;background:#2d7a4f;color:#fff!important;text-decoration:none;padding:13px 30px;border-radius:8px;font-weight:700}.f{text-align:center;padding:16px;background:#f4f6f9;font-size:12px;color:#999}</style></head><body><div class="c"><div class="h"><h1 style="margin:0;font-size:24px">&#127807; INTRA-D</h1><p style="margin:4px 0 0;opacity:.85;font-size:13px">Empowering Indian Farmers</p></div><div class="b"><p style="color:#333">Hello <strong>${name}</strong>,</p><p style="color:#555;font-size:15px">Your INTRA-D account has been created. Here are your login credentials:</p><div class="cb"><div class="cr"><span class="cl">System Email</span><span class="cv">${email}</span></div><div class="cr"><span class="cl">Password</span><span class="cv">${password}</span></div></div><div class="w">&#9888; <strong>Important:</strong> Save these credentials. You need them to log in. Do not share your password.</div><a href="https://intra-d.com/login" class="btn">Login to INTRA-D &rarr;</a></div><div class="f">&copy; ${year} INTRA-D &mdash; This is an automated email. Please do not reply.</div></div></body></html>`;

    const ok = await sendEmail({ from: `"INTRA-D Team" <${GMAIL_USER}>`, to: personalEmail, subject: "Your INTRA-D Account Credentials", html });
    if (!ok) throw new HttpsError("internal", "Failed to send credentials email.");
    return { success: true, message: "Login credentials sent to your email." };
  }
);

export const sendForgotPasswordEmail = onCall<SendForgotPasswordEmailPayload>(
  {
    region: "asia-south1",
    secrets: ["GMAIL_USER", "GMAIL_APP_PASSWORD"],
    cors: CALLABLE_CORS,
    invoker: "public",
  },
  async (request): Promise<EmailResult> => {
    const { email } = request.data;
    if (!email) throw new HttpsError("invalid-argument", "email is required.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new HttpsError("invalid-argument", `Invalid email: ${email}`);

    logger.info("[sendForgotPasswordEmail] Generating reset link", { email });

    let resetLink: string;
    try {
      ensureAdminInitialized();
      resetLink = await getAuth().generatePasswordResetLink(email, { url: "https://intra-d.com/login" });
    } catch (err: any) {
      logger.error("[sendForgotPasswordEmail] Reset link error", { code: err?.code, message: err?.message });
      if (err?.code === "auth/user-not-found") {
        return { success: true, message: "If this email is registered, a reset link will be sent." };
      }
      throw new HttpsError("internal", "Failed to generate password reset link.");
    }

    const year = new Date().getFullYear();
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>INTRA-D Password Reset</title><style>body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f9;margin:0;padding:20px}.c{max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}.h{background:linear-gradient(135deg,#1565C0,#1976D2);padding:32px 24px;text-align:center;color:#fff}.b{padding:28px 32px}.ib{background:#e3f2fd;border:1px solid #90caf9;border-radius:8px;padding:14px;margin:16px 0;font-size:14px;color:#0d47a1}.btn{display:inline-block;background:#1565C0;color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;margin:24px 0}.w{background:#fff8e1;border-left:4px solid #ffc107;padding:12px;font-size:13px;color:#7a5f00;margin:16px 0}.lt{word-break:break-all;font-size:12px;color:#888;margin-top:8px}.f{text-align:center;padding:16px;background:#f4f6f9;font-size:12px;color:#999}</style></head><body><div class="c"><div class="h"><h1 style="margin:0;font-size:24px">&#128274; Password Reset</h1><p style="margin:4px 0 0;opacity:.85;font-size:13px">INTRA-D &mdash; Agricultural Intelligence Platform</p></div><div class="b"><p style="color:#333">We received a request to reset the password for <strong>${email}</strong>.</p><div class="ib">&#128336; This link is valid for <strong>1 hour</strong>. If you did not request this, ignore this email.</div><a href="${resetLink}" class="btn">Reset My Password &rarr;</a><p class="lt">If the button doesn't work:<br><a href="${resetLink}" style="color:#1565C0">${resetLink}</a></p><div class="w">&#9888; <strong>Security tip:</strong> Never share this link. INTRA-D staff will never ask for your password.</div></div><div class="f">&copy; ${year} INTRA-D &mdash; This is an automated email. Please do not reply.</div></div></body></html>`;

    const ok = await sendEmail({ from: `"INTRA-D Security" <${GMAIL_USER}>`, to: email, subject: "Reset Your INTRA-D Password", html });
    if (!ok) throw new HttpsError("internal", "Failed to send password reset email.");

    logger.info("[sendForgotPasswordEmail] Reset email sent", { email });
    return { success: true, message: "Password reset link sent to your email." };
  }
);
