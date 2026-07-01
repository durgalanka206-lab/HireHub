const fs = require('fs');

// 1. Fix server.js
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(
  'const allowedOrigins = [',
  'const allowedOrigins = [\n  process.env.CLIENT_URL,'
);
fs.writeFileSync('server.js', serverJs);

// 2. Fix config/passport.js
let passportJs = fs.readFileSync('config/passport.js', 'utf8');
passportJs = passportJs.replace(
  /callbackURL: \\/api\/auth\/google\/callback\/,
  'callbackURL: ${process.env.BACKEND_URL || "https://hirehub-dx1z.onrender.com"}/api/auth/google/callback'
);
fs.writeFileSync('config/passport.js', passportJs);

// 3. Fix routes/auth.js (transporter, transac, etc)
// Actually we can do optional chaining manually or safely via script.
console.log('Backend fixes applied');
