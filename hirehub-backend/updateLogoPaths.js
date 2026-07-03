/**
 * updateLogoPaths.js — changes all job logo paths from .png to .svg in MongoDB
 * Run: node updateLogoPaths.js
 */
require('node:dns').setServers(['8.8.8.8']);
const mongoose = require('mongoose');
require('dotenv').config();
const Job = require('./models/Job');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected.');

  // Find all jobs with .png logos
  const jobs = await Job.find({ logo: /.png$/ }).lean();
  console.log(`Found ${jobs.length} jobs with .png logos`);

  let updated = 0;
  for (const job of jobs) {
    const newLogo = job.logo.replace(/\.png$/, '.svg');
    await Job.updateOne({ _id: job._id }, { logo: newLogo });
    updated++;
  }

  console.log(`Updated ${updated} jobs to use .svg logos`);
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
