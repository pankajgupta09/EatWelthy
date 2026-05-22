const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendVerificationEmail = async (email, verificationCode) => {
  try {
    await transporter.sendMail({
      from: `"EatWellthy" <${process.env.EMAIL_SENDER}>`,
      to: email,
      subject: "Your EatWellthy Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2C3E50;">Welcome to EatWellthy!</h2>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-size: 16px;">Your verification code is:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 20px 0; color: #2C3E50;">
                  ${verificationCode}
                </div>
              </div>
              <p>Enter this code on the verification page to complete your registration.</p>
              <div style="background-color: #f1f1f1; padding: 15px; border-left: 4px solid #2C3E50; margin: 20px 0;">
                <p style="margin: 0;"><strong>Important:</strong></p>
                <ul style="margin: 10px 0;">
                  <li>This code will expire in 24 hours</li>
                  <li>Never share this code with anyone</li>
                </ul>
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you didn't create an account with EatWellthy, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
    });
    console.log("Verification email sent to:", email);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return false;
  }
};

const sendForgotPasswordEmail = async (email, temporaryPassword) => {
  try {
    await transporter.sendMail({
      from: `"EatWellthy" <${process.env.EMAIL_SENDER}>`,
      to: email,
      subject: "Your EatWellthy Temporary Password",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2C3E50;">Password Reset Request</h2>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-size: 16px;">Your temporary password is:</p>
                <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; color: #2C3E50;">
                  ${temporaryPassword}
                </div>
              </div>
              <p>Use this to log in, then change your password immediately from Profile settings.</p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you didn't request a password reset, please contact support immediately.
              </p>
            </div>
          </body>
        </html>
      `,
    });
    console.log("Password reset email sent to:", email);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return false;
  }
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    await transporter.sendMail({
      from: `"EatWellthy" <${process.env.EMAIL_SENDER}>`,
      to: email,
      subject: "Reset your EatWellthy password",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2C3E50;">Reset your password</h2>
              <p>We received a request to reset the password for your EatWellthy account.</p>
              <p>Click the button below to set a new password. This link is valid for <strong>30 minutes</strong>.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #2C3E50; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              <p style="font-size: 13px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="font-size: 12px; word-break: break-all; color: #2C3E50;">${resetUrl}</p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you didn't request this, you can safely ignore this email — your password won't change.
              </p>
            </div>
          </body>
        </html>
      `,
    });
    return true;
  } catch (error) {
    console.error("Password reset email failed:", error.message);
    return false;
  }
};

module.exports = { sendVerificationEmail, sendForgotPasswordEmail, sendPasswordResetEmail };
