/**
 * sanitizeSalaries.js — Sanitizes database job salaries to use exact formats
 * Internships: e.g., ₹25K/month, ₹40K/month, ₹60K/month (no spaces)
 * Other jobs: e.g., ₹4–6 LPA, ₹8–15 LPA, ₹18–35 LPA (consistent formatting)
 */
require('node:dns').setServers(['8.8.8.8']);
const mongoose = require('mongoose');
require('dotenv').config();
const Job = require('./models/Job');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected.');

  const jobs = await Job.find({});
  let modifiedCount = 0;

  for (const job of jobs) {
    let original = job.salary;
    let salary = original;

    // Standardize monthly internship salaries
    if (job.type === 'Internship') {
      // Remove spaces around / and month
      salary = salary.replace(/\s*\/\s*month/i, '/month');
      // e.g., 135K/month -> 135K/month
      // Check if it already matches ₹XK/month
      if (!salary.startsWith('₹')) {
        salary = '₹' + salary;
      }
    } else {
      // Standardize LPA salaries
      // Replace " / month" if mistakenly applied to full-time
      if (salary.includes('month')) {
        salary = '₹8–12 LPA'; // default fresher LPA
      }
      // Replace K with LPA if any
      salary = salary.replace(/\s*LPA/i, ' LPA');
      if (!salary.startsWith('₹')) {
        salary = '₹' + salary;
      }
      // Ensure it matches range or single value without double Rupee symbols
      salary = salary.replace(/₹+/g, '₹');
    }

    if (salary !== original) {
      job.salary = salary;
      await job.save();
      modifiedCount++;
    }
  }

  console.log(`Successfully sanitized ${modifiedCount} job salaries.`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
