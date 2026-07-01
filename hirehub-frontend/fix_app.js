const fs = require('fs');

let code = fs.readFileSync('src/App.js', 'utf8');

// Fix API URL
code = code.replace(
  /const API = process\.env\.REACT_APP_API_URL \|\| \(window\.location\.hostname === "localhost" \? "http:\/\/localhost:5000\/api" : "https:\/\/hirehub-dx1z\.onrender\.com\/api"\);/,
  'const API = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost" ? "http://localhost:5000/api" : process.env.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL + "/api" : "https://hirehub-dx1z.onrender.com/api");'
);

// We need to prevent unhandled rejections on fetches. We can add a simple wrapper function or manually patch.
// Let's add a safeFetch function at the top level and replace all fetch() calls with safeFetch()
// Wait, replacing all fetches might break Response methods if we return json directly.
// Let's just make sure json() calls don't break if response is not valid json or if it fails.

// Typical pattern in App.js:
// const r = await fetch(url, ...);
// const d = await r.json();
// Let's replace `await r.json()` with `await r.text().then(t => t ? JSON.parse(t) : { success: false, message: 'Invalid response' }).catch(() => ({ success: false, message: 'Parse error' }))`

code = code.replace(/await (\w+)\.json\(\)/g, "await $1.text().then(t => { try { return t ? JSON.parse(t) : { success: false, message: 'Empty response' }; } catch(e) { return { success: false, message: 'Invalid JSON response' }; } })");

// Ensure optional chaining on user/profile properties
// E.g., user.name -> user?.name
code = code.replace(/user\.name/g, 'user?.name');
code = code.replace(/user\.email/g, 'user?.email');
code = code.replace(/user\.role/g, 'user?.role');
code = code.replace(/user\.avatar/g, 'user?.avatar');
code = code.replace(/job\.title/g, 'job?.title');
code = code.replace(/job\.company/g, 'job?.company');

// Replace `} finally {` with `} catch(err) { console.error('Fetch error:', err); } finally {` where possible,
// but let's be careful. Try blocks without catch are only valid if there is a finally.
code = code.replace(/} finally {/g, '} catch (err) { console.error("Caught error:", err); } finally {');

fs.writeFileSync('src/App.js', code);
console.log('App.js patched successfully');
