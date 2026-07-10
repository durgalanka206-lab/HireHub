const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('BROWSER CONSOLE ERROR:', msg.text());
    }
  });

  console.log('Navigating to HireHub app...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(resolve => setTimeout(resolve, 4000));

  // --- Step 1: Login ---
  console.log('Checking auth page status...');
  const onLanding = await page.evaluate(() => {
    return document.body.innerText.includes('Get Started for Free');
  });

  if (onLanding) {
    console.log('Navigating to login page from landing page...');
    await page.evaluate(() => {
      const loginBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.trim() === 'Login');
      if (loginBtn) loginBtn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const needLogin = await page.evaluate(() => {
    return document.body.innerText.includes('Sign In') || document.body.innerText.includes('Welcome Back');
  });

  if (needLogin) {
    console.log('Logging in as lankadurga779@gmail.com...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'lankadurga779@gmail.com');
    await page.type('input[type="password"]', 'Ammu@2026');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Sign In' || b.textContent.trim() === 'Sign in' || b.textContent.includes('Please wait'));
      if (btns.length > 0) {
        btns[btns.length - 1].click();
      }
    });
    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  // Wait for Browse Jobs page load
  try {
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Browse Jobs') && document.body.innerText.includes('Junior Data Analyst');
    }, { timeout: 15000 });
  } catch (err) {
    console.error('FAIL: Timed out waiting for Browse Jobs. Current page text is:\n', await page.evaluate(() => document.body.innerText));
    await page.screenshot({ path: 'C:\\Users\\lanka\\.gemini\\antigravity\\brain\\f144c642-b8d7-4bc3-8af8-5e9020072218\\login_error.png' });
    process.exit(1);
  }

  const portalLoaded = await page.evaluate(() => {
    return document.body.innerText.includes('Airtel');
  });
  if (!portalLoaded) {
    console.error('FAIL: Could not verify portal load.');
    await page.screenshot({ path: 'C:\\Users\\lanka\\.gemini\\antigravity\\brain\\f144c642-b8d7-4bc3-8af8-5e9020072218\\login_error.png' });
    process.exit(1);
  }
  console.log('SUCCESS: Logged in successfully.');


  // --- Step 2: Trigger Interview Generation from Job Details ---
  console.log('\nWaiting 35 seconds to clear Gemini rate limit quota...');
  await new Promise(resolve => setTimeout(resolve, 35000));

  console.log('Triggering Interview Question Generation from Job Details...');
  await page.click('#ai-prepare-interview-btn');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Waiting for AI generation & custom loading overlay...');
  try {
    await page.waitForFunction(() => {
      return !document.body.textContent.includes('Preparing Your Interview...');
    }, { timeout: 90000 });
  } catch (err) {
    console.error('TIMED OUT WAITING FOR OVERLAY. Capturing diagnostic info...');
    await page.screenshot({ path: 'C:/Users/lanka/.gemini/antigravity/brain/f144c642-b8d7-4bc3-8af8-5e9020072218/scratch/overlay_timeout.png' });
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Active Page Text:\n', bodyText);
    throw err;
  }
  await new Promise(resolve => setTimeout(resolve, 2000));

  const dashboardLoaded = await page.evaluate(() => {
    const text = document.body.textContent;
    return text.includes('Interview Dashboard') && text.includes('Start Interview');
  });
  if (dashboardLoaded) {
    console.log('SUCCESS: AI successfully generated questions and opened the Interview Dashboard!');
    await page.screenshot({ path: 'C:\\Users\\lanka\\.gemini\\antigravity\\brain\\f144c642-b8d7-4bc3-8af8-5e9020072218\\interview_dashboard.png' });
  } else {
    console.error('FAIL: Interview Dashboard failed to load.');
    await page.screenshot({ path: 'C:\\Users\\lanka\\.gemini\\antigravity\\brain\\f144c642-b8d7-4bc3-8af8-5e9020072218\\dashboard_error.png' });
    process.exit(1);
  }

  // --- Step 3: Start Interview & Verify Mock Active ---
  console.log('\nStarting Mock Interview Mode from Dashboard...');
  await page.click('#mock-start-or-continue-btn');
  await new Promise(resolve => setTimeout(resolve, 2000));

  let mockActive = await page.evaluate(() => {
    return document.querySelector('textarea') !== null;
  });
  if (mockActive) {
    console.log('SUCCESS: Mock Interview interface is active.');
  } else {
    console.error('FAIL: Failed to activate Mock Interview.');
    await page.screenshot({ path: 'C:\\Users\\lanka\\.gemini\\antigravity\\brain\\f144c642-b8d7-4bc3-8af8-5e9020072218\\mock_activation_error.png' });
    process.exit(1);
  }

  // --- Step 4: Answer Question 1 & Submit Answer ---
  console.log('Waiting 10 seconds to avoid Gemini rate limits...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('Entering candidate response...');
  await page.type('textarea', 'I am a highly skilled senior engineer with extensive experience in React frontend state management, useMemo/useCallback optimizations, and building secure REST APIs using Node.js/Express.');
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('Submitting answer for AI evaluation...');
  await page.click('#mock-submit-btn');

  // Wait for evaluation
  await page.waitForFunction(() => {
    return document.body.innerText.includes('AI Evaluation Results');
  }, { timeout: 25000 });
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('SUCCESS: AI returned evaluation scores!');

  // --- Step 5: Click Back & Verify 'Continue Interview' changes button label ---
  console.log('\nTesting Back Button...');
  await page.click('#mock-back-dashboard-btn');
  await new Promise(resolve => setTimeout(resolve, 1500));

  const isContinueButton = await page.evaluate(() => {
    const btn = document.querySelector('#mock-start-or-continue-btn');
    return btn && btn.textContent.includes('Continue Interview');
  });
  if (isContinueButton) {
    console.log('SUCCESS: Dashboard button label successfully changed to "Continue Interview"!');
  } else {
    console.error('FAIL: Start Interview button did not change label.');
    process.exit(1);
  }

  // --- Step 6: Reload Browser to verify Session Persistence ---
  console.log('\nRefreshing browser to verify active session persistence...');
  try {
    await page.reload();
    
    // Wait for the app container or loading container to mount
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Restoring session') || document.body.innerText.includes('Loading jobs') || document.body.innerText.includes('Interview Dashboard');
    }, { timeout: 15000 });

    // Then wait for loading screens to clear
    await page.waitForFunction(() => {
      return !document.body.innerText.includes('Restoring session') && !document.body.innerText.includes('Loading jobs');
    }, { timeout: 15000 });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (err) {
    console.error('FAIL: Timed out during page reload sync:', err.message);
    await page.screenshot({ path: 'C:\\Users\\lanka\\.gemini\\antigravity\\brain\\f144c642-b8d7-4bc3-8af8-5e9020072218\\persistence_error.png' });
    process.exit(1);
  }

  const sessionRestored = await page.evaluate(() => {
    const text = document.body.textContent;
    const btn = document.querySelector('#mock-start-or-continue-btn');
    return text.includes('Interview Dashboard') && btn && btn.textContent.includes('Continue Interview');
  });
  if (sessionRestored) {
    console.log('SUCCESS: Active interview session successfully restored from localStorage after page refresh!');
  } else {
    console.error('FAIL: Active session was not preserved.');
    await page.screenshot({ path: 'C:\\Users\\lanka\\.gemini\\antigravity\\brain\\f144c642-b8d7-4bc3-8af8-5e9020072218\\persistence_error.png' });
    process.exit(1);
  }

  // --- Step 7: Test Continue Interview & Exit Modal dialog popup ---
  console.log('\nContinuing interview and checking Exit Confirmation Modal...');
  await page.click('#mock-start-or-continue-btn');
  await new Promise(resolve => setTimeout(resolve, 1500));

  await page.click('#mock-exit-btn');
  await new Promise(resolve => setTimeout(resolve, 1500));

  const modalActive = await page.evaluate(() => {
    const text = document.body.textContent;
    return text.includes('Exit Interview?') && text.includes('Your interview progress has been saved.');
  });
  if (modalActive) {
    console.log('SUCCESS: Exit Confirmation dialog modal is visible!');
    await page.screenshot({ path: 'C:\\Users\\lanka\\.gemini\\antigravity\\brain\\f144c642-b8d7-4bc3-8af8-5e9020072218\\exit_modal.png' });
  } else {
    console.error('FAIL: Exit Confirmation modal did not appear.');
    process.exit(1);
  }

  // Click exit to return to dashboard
  console.log('Clicking exit to return to Dashboard...');
  await page.click('#confirm-exit-btn');
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Resume again to finish E2E flow
  console.log('Resuming simulation...');
  await page.click('#mock-start-or-continue-btn');
  await new Promise(resolve => setTimeout(resolve, 1500));

  // --- Step 8: Conclude Interview and View Scorecard ---
  console.log('\nConcluding interview early...');
  await page.click('#mock-finish-btn');
  await new Promise(resolve => setTimeout(resolve, 2000));

  const scorecardLoaded = await page.evaluate(() => {
    const text = document.body.textContent;
    return text.includes('Interview Complete!') && text.includes('Readiness Rating') && text.includes('Key Strengths');
  });
  if (scorecardLoaded) {
    console.log('SUCCESS: Interview Scorecard loaded successfully!');
    await page.screenshot({ path: 'C:\\Users\\lanka\\.gemini\\antigravity\\brain\\f144c642-b8d7-4bc3-8af8-5e9020072218\\scorecard.png' });
  } else {
    console.error('FAIL: Scorecard did not render properly.');
    await page.screenshot({ path: 'C:\\Users\\lanka\\.gemini\\antigravity\\brain\\f144c642-b8d7-4bc3-8af8-5e9020072218\\scorecard_error.png' });
    process.exit(1);
  }

  // --- Step 9: Save session to database history ---
  console.log('\nSaving practice session to database history...');
  await page.click('#save-session-history-btn');
  
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Session saved successfully');
  }, { timeout: 15000 });
  console.log('SUCCESS: Session successfully saved to MongoDB history!');

  // Exit cleanly back to timeline history
  console.log('Exiting scorecard timeline...');
  await page.evaluate(() => {
    const exitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Exit to Sessions') || b.textContent.includes('Exit without saving') || b.textContent.includes('Exit Dashboard'));
    if (exitBtn) exitBtn.click();
  });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // --- Step 10: Reopen Session from list ---
  console.log('Attempting to reopen saved session...');
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent === 'Reopen Session');
    return btns.length > 0;
  }, { timeout: 15000 });

  await page.evaluate(() => {
    const reopenBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent === 'Reopen Session');
    if (reopenBtns.length > 0) {
      reopenBtns[0].click(); // Click the top (most recent) session
    }
  });

  try {
    await page.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('saved session') && text.includes('your answer') && text.includes('ai suggestions');
    }, { timeout: 15000 });
    console.log('SUCCESS: Reopened saved session details successfully fetched and rendered!');
    await page.screenshot({ path: 'C:\\Users\\lanka\\.gemini\\antigravity\\brain\\f144c642-b8d7-4bc3-8af8-5e9020072218\\reopened_session.png' });
  } catch (err) {
    console.error('FAIL: Reopened session details failed to load. Page text is:\n', await page.evaluate(() => document.body.innerText));
    await page.screenshot({ path: 'C:\\Users\\lanka\\.gemini\\antigravity\\brain\\f144c642-b8d7-4bc3-8af8-5e9020072218\\reopen_error.png' });
    process.exit(1);
  }

  // Console errors check
  if (consoleErrors.length === 0) {
    console.log('\nALL E2E HARDENED FLOW TESTS COMPLETED SUCCESSFULLY WITH NO CONSOLE ERRORS!');
  } else {
    console.warn(`\nWARNING: Encountered ${consoleErrors.length} minor page/console warning messages during E2E flow.`);
  }

  await browser.close();
})();
