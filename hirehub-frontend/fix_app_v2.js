const fs = require('fs');

let code = fs.readFileSync('src/App.js', 'utf8');

// Fix API URL
code = code.replace(
  /const API = process\.env\.REACT_APP_API_URL \|\| \(window\.location\.hostname === "localhost" \? "http:\/\/localhost:5000\/api" : "https:\/\/hirehub-dx1z\.onrender\.com\/api"\);/,
  'const API = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost" ? "http://localhost:5000/api" : process.env.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL + "/api" : "https://hirehub-dx1z.onrender.com/api");'
);

// Fix parse errors on fetch
code = code.replace(/await (\w+)\.json\(\)/g, "await $1.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } })");

// Optional chaining
code = code.replace(/user\.name/g, 'user?.name');
code = code.replace(/user\.email/g, 'user?.email');
code = code.replace(/user\.role/g, 'user?.role');
code = code.replace(/user\.avatar/g, 'user?.avatar');
code = code.replace(/job\.title/g, 'job?.title');
code = code.replace(/job\.company/g, 'job?.company');
code = code.replace(/selectedJob\.title/g, 'selectedJob?.title');
code = code.replace(/selectedJob\.company/g, 'selectedJob?.company');

fs.writeFileSync('src/App.js', code);
console.log('App.js patched successfully (v2)');
