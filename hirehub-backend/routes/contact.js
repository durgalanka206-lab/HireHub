const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per `window`
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate Name
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 50) {
      return res.status(400).json({ success: false, message: 'Name must be between 3 and 50 characters.' });
    }
    if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      return res.status(400).json({ success: false, message: 'Only letters and spaces are allowed in name.' });
    }
    const dummyNames = ['abc', 'xyz', 'test', 'fake', 'asdf', 'qwerty', 'admin'];
    if (dummyNames.some(dummy => trimmedName.toLowerCase().includes(dummy))) {
      return res.status(400).json({ success: false, message: 'Please enter a valid name.' });
    }

    // Validate Email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email format.' });
    }
    const fakeEmails = ['test@test.com', 'abc@abc.com', 'example@example.com'];
    if (fakeEmails.includes(trimmedEmail.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'This email is invalid or reserved.' });
    }
    const disposableDomains = ['mailinator.com', 'yopmail.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    const domain = trimmedEmail.toLowerCase().split('@')[1];
    if (disposableDomains.includes(domain)) {
      return res.status(400).json({ success: false, message: 'Temporary/disposable email domains are not allowed.' });
    }

    // Validate Message
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 15) {
      return res.status(400).json({ success: false, message: 'Message must be at least 15 characters.' });
    }
    const spamMessages = ['hi', 'hello', 'test', '123456', 'asdfghjkl', 'qwertyuiop', 'hiiihgyrtufgfd', 'aaaaaaa'];
    // spam match can be exact or contains, the prompt says "Reject spam values: hi, hello..."
    // Since 'hi' and 'test' can be inside legitimate words (e.g., 'this', 'architect'), doing a generic includes() might flag legitimate messages.
    // The prompt says "Reject obvious spam: hi ... Must contain meaningful text". 
    // I will check if the message IS EXACTLY those words, or just splitting by space and checking.
    // A simple approach is exact match for small words or trimmed lowercased equality. But since it says "Reject obvious spam", I will check if the trimmedMessage exactly matches or is very close. Actually let's use exact match for these to avoid false positives.
    if (spamMessages.includes(trimmedMessage.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Please enter a meaningful message.' });
    }

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'durgalanka2006@gmail.com',
      subject: 'Portfolio Contact Form Submission',
      text: `New Portfolio Contact Message\n\nName: ${trimmedName}\nEmail: ${trimmedEmail}\n\nMessage:\n${trimmedMessage}`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router;
