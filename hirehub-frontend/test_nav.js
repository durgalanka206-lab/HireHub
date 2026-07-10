const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Track console errors
  const consoleErrors = [];
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('Navigating to HireHub...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  console.log('Logging in...');
  await page.evaluate(() => {
    // Show login form
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Sign In');
    if (btn) btn.click();
  });
  
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'lankadurga779@gmail.com');
  await page.type('input[type="password"]', '123456');
  
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Login');
    if (btn) btn.click();
  });

  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log('Successfully logged in.');

  // Test tabs
  const tabs = [
    { name: 'Browse Jobs', path: '/browse-jobs' },
    { name: 'My Applications', path: '/my-applications' },
    { name: 'Resume Optimizer', path: '/ai/resume-optimizer' },
    { name: 'Cover Letter', path: '/ai/cover-letter' },
    { name: 'AI Interview', path: '/ai/interview-prep' },
    { name: 'Profile', path: '/profile' }
  ];

  for (const tab of tabs) {
    console.log(`\n--- Testing Navigation to ${tab.name} ---`);
    await page.evaluate((tabName) => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes(tabName));
      if (btn) btn.click();
    }, tab.name);

    await new Promise(r => setTimeout(r, 2000));
    
    const url = page.url();
    console.log(`Current URL: ${url}`);
    
    const text = await page.evaluate(() => document.body.innerText);
    console.log(`Page contains 'HIREHUB': ${text.includes('HIREHUB')}`);
    
    // Check if there are error indicators
    const hasError = text.toLowerCase().includes('failed') || text.toLowerCase().includes('error');
    console.log(`Page has error words: ${hasError}`);
    
    // Take screenshot
    const filename = `C:\\Users\\lanka\\.gemini\\antigravity\\brain\\f144c642-b8d7-4bc3-8af8-5e9020072218\\scratch\\tab_${tab.name.toLowerCase().replace(/ /g, '_')}.png`;
    await page.screenshot({ path: filename });
    console.log(`Saved screenshot to: ${filename}`);
  }

  if (consoleErrors.length > 0) {
    console.log('\n--- Console Errors Detected ---');
    consoleErrors.forEach(err => console.error(err));
  } else {
    console.log('\nNo console errors detected during tab navigation!');
  }

  await browser.close();
})();
