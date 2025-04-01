import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export async function sendResetPasswordEmail(email, token) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your Password for PeerPrep',
    text: `You requested a password reset for your PeerPrep account. Click the link to reset your password: ${process.env.FRONTEND_URL}/reset-password/${token}. This link will expire in 5 minutes.`,
  };

  return transporter.sendMail(mailOptions);
}