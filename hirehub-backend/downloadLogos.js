/**
 * downloadLogos.js — Downloads company logos from Clearbit API into public/logos/
 * Run with: node downloadLogos.js
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const LOGOS_DIR = path.join(__dirname, '../hirehub-frontend/public/logos');

if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

// Exact list of companies used in the seeded jobs - filename matches logo field in DB
const companies = [
  { name: 'Google',        domain: 'google.com',        file: 'google.png' },
  { name: 'Microsoft',     domain: 'microsoft.com',     file: 'microsoft.png' },
  { name: 'Amazon',        domain: 'amazon.com',        file: 'amazon.png' },
  { name: 'Apple',         domain: 'apple.com',         file: 'apple.png' },
  { name: 'Meta',          domain: 'meta.com',          file: 'meta.png' },
  { name: 'Netflix',       domain: 'netflix.com',       file: 'netflix.png' },
  { name: 'Adobe',         domain: 'adobe.com',         file: 'adobe.png' },
  { name: 'Oracle',        domain: 'oracle.com',        file: 'oracle.png' },
  { name: 'IBM',           domain: 'ibm.com',           file: 'ibm.png' },
  { name: 'Intel',         domain: 'intel.com',         file: 'intel.png' },
  { name: 'Qualcomm',      domain: 'qualcomm.com',      file: 'qualcomm.png' },
  { name: 'NVIDIA',        domain: 'nvidia.com',        file: 'nvidia.png' },
  { name: 'AMD',           domain: 'amd.com',           file: 'amd.png' },
  { name: 'Cisco',         domain: 'cisco.com',         file: 'cisco.png' },
  { name: 'SAP',           domain: 'sap.com',           file: 'sap.png' },
  { name: 'Salesforce',    domain: 'salesforce.com',    file: 'salesforce.png' },
  { name: 'Atlassian',     domain: 'atlassian.com',     file: 'atlassian.png' },
  { name: 'ServiceNow',    domain: 'servicenow.com',    file: 'servicenow.png' },
  { name: 'Accenture',     domain: 'accenture.com',     file: 'accenture.png' },
  { name: 'Deloitte',      domain: 'deloitte.com',      file: 'deloitte.png' },
  { name: 'EY',            domain: 'ey.com',            file: 'ey.png' },
  { name: 'PwC',           domain: 'pwc.com',           file: 'pwc.png' },
  { name: 'KPMG',          domain: 'kpmg.com',          file: 'kpmg.png' },
  { name: 'TCS',           domain: 'tcs.com',           file: 'tcs.png' },
  { name: 'Infosys',       domain: 'infosys.com',       file: 'infosys.png' },
  { name: 'Wipro',         domain: 'wipro.com',         file: 'wipro.png' },
  { name: 'HCLTech',       domain: 'hcltech.com',       file: 'hcltech.png' },
  { name: 'Cognizant',     domain: 'cognizant.com',     file: 'cognizant.png' },
  { name: 'Capgemini',     domain: 'capgemini.com',     file: 'capgemini.png' },
  { name: 'Tech Mahindra', domain: 'techmahindra.com',  file: 'techmahindra.png' },
  { name: 'Zoho',          domain: 'zoho.com',          file: 'zoho.png' },
  { name: 'Freshworks',    domain: 'freshworks.com',    file: 'freshworks.png' },
  { name: 'PhonePe',       domain: 'phonepe.com',       file: 'phonepe.png' },
  { name: 'Razorpay',      domain: 'razorpay.com',      file: 'razorpay.png' },
  { name: 'Swiggy',        domain: 'swiggy.com',        file: 'swiggy.png' },
  { name: 'Zomato',        domain: 'zomato.com',        file: 'zomato.png' },
  { name: 'Flipkart',      domain: 'flipkart.com',      file: 'flipkart.png' },
  { name: 'Meesho',        domain: 'meesho.com',        file: 'meesho.png' },
  { name: 'CRED',          domain: 'cred.club',         file: 'cred.png' },
  { name: 'Groww',         domain: 'groww.in',          file: 'groww.png' },
  { name: 'BrowserStack',  domain: 'browserstack.com',  file: 'browserstack.png' },
  { name: 'Postman',       domain: 'postman.com',       file: 'postman.png' },
  { name: 'Jio',           domain: 'jio.com',           file: 'jio.png' },
  { name: 'Airtel',        domain: 'airtel.in',         file: 'airtel.png' },
  { name: 'Paytm',         domain: 'paytm.com',         file: 'paytm.png' },
  { name: 'Samsung',       domain: 'samsung.com',       file: 'samsung.png' },
];

function downloadFile(url, destPath) {
  return new Promise((resolve) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HireHub/1.0)' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(downloadFile(res.headers.location, destPath));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(false);
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
      file.on('error', () => resolve(false));
    });
    req.on('error', () => resolve(false));
    req.setTimeout(10000, () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  console.log(`Downloading logos to ${LOGOS_DIR} ...\n`);
  let success = 0, fail = 0;

  for (const co of companies) {
    const destPath = path.join(LOGOS_DIR, co.file);
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 500) {
      console.log(`  ✓ ${co.file} (already exists)`);
      success++;
      continue;
    }
    const url = `https://logo.clearbit.com/${co.domain}`;
    const ok = await downloadFile(url, destPath);
    if (ok && fs.existsSync(destPath) && fs.statSync(destPath).size > 500) {
      console.log(`  ✓ Downloaded ${co.file}`);
      success++;
    } else {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      console.log(`  ✗ Failed ${co.file} (will use initials fallback)`);
      fail++;
    }
  }

  console.log(`\nDone: ${success} downloaded, ${fail} failed (will use initials).`);
}

main();
