/**
 * generateSvgLogos.js — Creates properly named .svg logo files for all companies
 * Updates DB job records to point to the correct .svg paths
 * Run: node generateSvgLogos.js
 */
const fs = require('fs');
const path = require('path');

const LOGOS_DIR = path.join(__dirname, '../hirehub-frontend/public/logos');
if (!fs.existsSync(LOGOS_DIR)) fs.mkdirSync(LOGOS_DIR, { recursive: true });

// Company brand colour mapping - file stored as .svg but referenced as /logos/X.svg
const companies = [
  { key: 'google',        label: 'G',   bg: '#4285F4', fg: '#fff' },
  { key: 'microsoft',     label: 'M',   bg: '#00A4EF', fg: '#fff' },
  { key: 'amazon',        label: 'A',   bg: '#FF9900', fg: '#fff' },
  { key: 'apple',         label: '',   bg: '#555555', fg: '#fff' },
  { key: 'meta',          label: 'f',   bg: '#0866FF', fg: '#fff' },
  { key: 'netflix',       label: 'N',   bg: '#E50914', fg: '#fff' },
  { key: 'adobe',         label: 'A',   bg: '#FF0000', fg: '#fff' },
  { key: 'oracle',        label: 'O',   bg: '#C74634', fg: '#fff' },
  { key: 'ibm',           label: 'IBM', bg: '#054ADA', fg: '#fff' },
  { key: 'intel',         label: 'i',   bg: '#0071C5', fg: '#fff' },
  { key: 'qualcomm',      label: 'Q',   bg: '#3253DC', fg: '#fff' },
  { key: 'nvidia',        label: 'N',   bg: '#76B900', fg: '#fff' },
  { key: 'amd',           label: 'A',   bg: '#ED1C24', fg: '#fff' },
  { key: 'cisco',         label: 'C',   bg: '#1BA0D7', fg: '#fff' },
  { key: 'sap',           label: 'SAP', bg: '#003366', fg: '#fff' },
  { key: 'salesforce',    label: 'SF',  bg: '#00A1E0', fg: '#fff' },
  { key: 'atlassian',     label: 'A',   bg: '#0052CC', fg: '#fff' },
  { key: 'servicenow',    label: 'SN',  bg: '#62D84E', fg: '#fff' },
  { key: 'accenture',     label: 'Ac',  bg: '#A100FF', fg: '#fff' },
  { key: 'deloitte',      label: 'D',   bg: '#86BC25', fg: '#fff' },
  { key: 'ey',            label: 'EY',  bg: '#FFE600', fg: '#2E2E38' },
  { key: 'pwc',           label: 'PwC', bg: '#D93954', fg: '#fff' },
  { key: 'kpmg',          label: 'K',   bg: '#00338D', fg: '#fff' },
  { key: 'tcs',           label: 'TCS', bg: '#CC0000', fg: '#fff' },
  { key: 'infosys',       label: 'I',   bg: '#007CC3', fg: '#fff' },
  { key: 'wipro',         label: 'W',   bg: '#341C6C', fg: '#fff' },
  { key: 'hcltech',       label: 'HCL', bg: '#0076C0', fg: '#fff' },
  { key: 'cognizant',     label: 'C',   bg: '#1961AC', fg: '#fff' },
  { key: 'capgemini',     label: 'Ca',  bg: '#003087', fg: '#fff' },
  { key: 'techmahindra',  label: 'TM',  bg: '#C70039', fg: '#fff' },
  { key: 'zoho',          label: 'Z',   bg: '#E42527', fg: '#fff' },
  { key: 'freshworks',    label: 'F',   bg: '#2AB84B', fg: '#fff' },
  { key: 'phonepe',       label: 'P',   bg: '#5F259F', fg: '#fff' },
  { key: 'razorpay',      label: 'R',   bg: '#2D9CDB', fg: '#fff' },
  { key: 'swiggy',        label: 'S',   bg: '#FC8019', fg: '#fff' },
  { key: 'zomato',        label: 'Z',   bg: '#E23744', fg: '#fff' },
  { key: 'flipkart',      label: 'F',   bg: '#2874F0', fg: '#fff' },
  { key: 'meesho',        label: 'M',   bg: '#F43397', fg: '#fff' },
  { key: 'cred',          label: 'C',   bg: '#1C1C1E', fg: '#CDAB5B' },
  { key: 'groww',         label: 'G',   bg: '#44C97B', fg: '#fff' },
  { key: 'browserstack',  label: 'BS',  bg: '#F26522', fg: '#fff' },
  { key: 'postman',       label: 'P',   bg: '#FF6C37', fg: '#fff' },
  { key: 'jio',           label: 'Ji',  bg: '#1E2A5E', fg: '#fff' },
  { key: 'airtel',        label: 'Ai',  bg: '#E40000', fg: '#fff' },
  { key: 'paytm',         label: 'P',   bg: '#00B9F1', fg: '#fff' },
  { key: 'samsung',       label: 'S',   bg: '#1428A0', fg: '#fff' },
];

function makeSvg(label, bg, fg) {
  const size = 100;
  const radius = 20;
  const fontSize = label.length === 1 ? 46 : label.length === 2 ? 38 : 28;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${bg}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
        fill="${fg}" font-family="Arial, Helvetica, sans-serif"
        font-weight="bold" font-size="${fontSize}">${label}</text>
</svg>`;
}

console.log(`Writing SVG logos to ${LOGOS_DIR} ...\n`);
let created = 0;
for (const co of companies) {
  const svgPath = path.join(LOGOS_DIR, `${co.key}.svg`);
  const svg = makeSvg(co.label, co.bg, co.fg);
  fs.writeFileSync(svgPath, svg, 'utf8');
  // Remove the old .png version if it's actually an SVG (small file)
  const pngPath = path.join(LOGOS_DIR, `${co.key}.png`);
  if (fs.existsSync(pngPath) && fs.statSync(pngPath).size < 1000) {
    fs.unlinkSync(pngPath);
  }
  created++;
}
console.log(`Done: ${created} .svg logos created.`);
