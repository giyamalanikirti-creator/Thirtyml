import type { EmailMessage, EmailProvider } from "./types";

/** Resend over REST — no SDK dependency. */
export const resendEmail: EmailProvider = {
  name: "resend",
  async send(message: EmailMessage): Promise<{ id: string }> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "ThirtyML <tickets@thirtyml.in>",
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: message.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.isBuffer(a.content)
            ? a.content.toString("base64")
            : a.content,
        })),
      }),
    });
    const body = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) {
      throw new Error(body.message ?? `Resend failed (${res.status})`);
    }
    return { id: body.id ?? "unknown" };
  },
};
