const nodemailer = require("nodemailer");

const getTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email", port: 587, secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
};

const sendMail = async (options) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail(options);
    console.log("📧 Email sent:", nodemailer.getTestMessageUrl(info) || info.messageId);
  } catch (err) {
    console.error("📧 Email error:", err.message);
  }
};

const sendApplicationConfirmation = ({ candidateName, candidateEmail, jobTitle, company, matchPercent }) => {
  sendMail({
    from: process.env.EMAIL_USER || "hirehub@test.com",
    to: candidateEmail,
    subject: `Application Received – ${jobTitle} at ${company}`,
    html: `<h2>Hi ${candidateName}!</h2><p>Your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> has been received.</p><p>Match Score: <strong>${matchPercent}%</strong></p>`,
  });
};

const sendAdminNotification = ({ candidateName, jobTitle, company, matchPercent, applicationId }) => {
  if (!process.env.ADMIN_EMAIL) return;
  sendMail({
    from: process.env.EMAIL_USER || "hirehub@test.com",
    to: process.env.ADMIN_EMAIL,
    subject: `New Application – ${jobTitle} at ${company}`,
    html: `<h2>New Application!</h2><p><strong>${candidateName}</strong> applied for <strong>${jobTitle}</strong> at <strong>${company}</strong></p><p>Match: <strong>${matchPercent}%</strong></p>`,
  });
};

const sendStatusUpdate = ({ candidateName, candidateEmail, jobTitle, company, status }) => {
  const messages = {
    reviewing:   "Your application is currently being reviewed.",
    shortlisted: "Congratulations! You have been shortlisted.",
    rejected:    "Unfortunately we will not be moving forward at this time.",
  };
  if (!messages[status]) return;
  sendMail({
    from: process.env.EMAIL_USER || "hirehub@test.com",
    to: candidateEmail,
    subject: `Application Update – ${jobTitle} at ${company}`,
    html: `<h2>Hi ${candidateName},</h2><p>Status: <strong>${status.toUpperCase()}</strong></p><p>${messages[status]}</p>`,
  });
};

module.exports = { sendApplicationConfirmation, sendAdminNotification, sendStatusUpdate };