import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, body }) {
  const info = await transporter.sendMail({
    from: `Jay <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text: body,
  });
  console.log(`Sent to ${to} — Message ID: ${info.messageId}`);
  return info;
}

// If run directly: node scripts/send-email.js
if (process.argv[2]) {
  const [to, subject, ...rest] = process.argv.slice(2);
  sendEmail({ to, subject, body: rest.join(' ') }).catch(console.error);
}
