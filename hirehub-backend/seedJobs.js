const fs = require('fs');
const path = require('path');
const https = require('https');
const Job = require('./models/Job');

const companies = [
  { name: 'Google', domain: 'google.com' },
  { name: 'Microsoft', domain: 'microsoft.com' },
  { name: 'Amazon', domain: 'amazon.com' },
  { name: 'Apple', domain: 'apple.com' },
  { name: 'Meta', domain: 'meta.com' },
  { name: 'Netflix', domain: 'netflix.com' },
  { name: 'Adobe', domain: 'adobe.com' },
  { name: 'Oracle', domain: 'oracle.com' },
  { name: 'IBM', domain: 'ibm.com' },
  { name: 'Intel', domain: 'intel.com' },
  { name: 'Qualcomm', domain: 'qualcomm.com' },
  { name: 'NVIDIA', domain: 'nvidia.com' },
  { name: 'AMD', domain: 'amd.com' },
  { name: 'Cisco', domain: 'cisco.com' },
  { name: 'SAP', domain: 'sap.com' },
  { name: 'Salesforce', domain: 'salesforce.com' },
  { name: 'Atlassian', domain: 'atlassian.com' },
  { name: 'ServiceNow', domain: 'servicenow.com' },
  { name: 'Accenture', domain: 'accenture.com' },
  { name: 'Deloitte', domain: 'deloitte.com' },
  { name: 'EY', domain: 'ey.com' },
  { name: 'PwC', domain: 'pwc.com' },
  { name: 'KPMG', domain: 'kpmg.com' },
  { name: 'TCS', domain: 'tcs.com' },
  { name: 'Infosys', domain: 'infosys.com' },
  { name: 'Wipro', domain: 'wipro.com' },
  { name: 'HCLTech', domain: 'hcltech.com' },
  { name: 'Cognizant', domain: 'cognizant.com' },
  { name: 'Capgemini', domain: 'capgemini.com' },
  { name: 'Tech Mahindra', domain: 'techmahindra.com' },
  { name: 'Zoho', domain: 'zoho.com' },
  { name: 'Freshworks', domain: 'freshworks.com' },
  { name: 'PhonePe', domain: 'phonepe.com' },
  { name: 'Razorpay', domain: 'razorpay.com' },
  { name: 'Swiggy', domain: 'swiggy.com' },
  { name: 'Zomato', domain: 'zomato.com' },
  { name: 'Flipkart', domain: 'flipkart.com' },
  { name: 'Meesho', domain: 'meesho.com' },
  { name: 'CRED', domain: 'cred.club' },
  { name: 'Groww', domain: 'groww.in' },
  { name: 'BrowserStack', domain: 'browserstack.com' },
  { name: 'Postman', domain: 'postman.com' },
  { name: 'Jio', domain: 'jio.com' },
  { name: 'Airtel', domain: 'airtel.in' }
];

const locations = [
  'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Mumbai', 'Noida', 'Gurgaon', 
  'Kochi', 'Ahmedabad', 'Kolkata', 'Vijayawada', 'Visakhapatnam', 'Remote (India)', 'Hybrid'
];

const types = ['Full-time', 'Part-time', 'Internship', 'Contract'];
const expLevels = ['Fresher', '1-3 years', '3-5 years', '5-10 years', '10+ years'];

const roleProfiles = [
  { role: 'Frontend Developer', skills: ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript'] },
  { role: 'Backend Developer', skills: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Redis'] },
  { role: 'Full Stack Developer', skills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'AWS'] },
  { role: 'Java Developer', skills: ['Java', 'Spring Boot', 'Microservices', 'Hibernate', 'SQL'] },
  { role: 'Python Developer', skills: ['Python', 'Django', 'Flask', 'PostgreSQL', 'Docker'] },
  { role: 'Data Analyst', skills: ['SQL', 'Excel', 'Power BI', 'Python', 'Tableau'] },
  { role: 'Data Scientist', skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Pandas'] },
  { role: 'Application Support Engineer', skills: ['SQL', 'Linux', 'Troubleshooting', 'Shell Scripting'] },
  { role: 'DevOps Engineer', skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'] },
  { role: 'Cloud Architect', skills: ['AWS', 'Azure', 'System Design', 'Kubernetes', 'Networking'] },
  { role: 'Machine Learning Engineer', skills: ['Python', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision'] },
  { role: 'Mobile Developer', skills: ['React Native', 'Swift', 'Kotlin', 'Firebase', 'Mobile UI'] }
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSalary(type, exp) {
  if (type === 'Internship') {
    return `₹${getRandomInt(20, 150)}K / month`;
  }
  
  if (exp === 'Fresher') return `₹${getRandomInt(3, 12)} LPA`;
  if (exp === '1-3 years') return `₹${getRandomInt(5, 15)} LPA`;
  if (exp === '3-5 years') return `₹${getRandomInt(10, 25)} LPA`;
  if (exp === '5-10 years') return `₹${getRandomInt(20, 60)} LPA`;
  if (exp === '10+ years') return `₹${getRandomInt(35, 80)} LPA`;
  
  return `₹10 - ₹20 LPA`;
}

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
           .on('error', reject)
           .once('close', () => resolve(filepath));
      } else {
        res.resume();
        resolve(null);
      }
    }).on('error', reject);
  });
};

module.exports = async function runSeed() {
  const logosDir = path.join(__dirname, '../hirehub-frontend/public/logos');
  if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
  }

  const jobs = [];
  const generatedCombos = new Set();
  let tries = 0;
  
  while(jobs.length < 150 && tries < 1000) {
    tries++;
    const company = companies[Math.floor(Math.random() * companies.length)];
    const roleProfile = roleProfiles[Math.floor(Math.random() * roleProfiles.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const isIntern = type === 'Internship';
    const exp = isIntern ? 'Fresher' : expLevels[Math.floor(Math.random() * expLevels.length)];
    
    let title = roleProfile.role;
    if (isIntern) title += ' Intern';
    else if (exp === '10+ years') title = `Lead ${title}`;
    else if (exp === '5-10 years') title = `Senior ${title}`;
    else if (exp === 'Fresher') title = `Junior ${title}`;

    const comboKey = `${company.name}-${title}-${location}`;
    if (generatedCombos.has(comboKey)) continue;
    generatedCombos.add(comboKey);

    const logoFilename = `${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`;
    const logoPath = path.join(logosDir, logoFilename);
    
    // We only download if the file doesn't exist to speed up
    if (!fs.existsSync(logoPath)) {
      try {
        await downloadImage(`https://logo.clearbit.com/${company.domain}`, logoPath);
      } catch (e) {}
    }

    const salary = generateSalary(type, exp);
    const datePosted = new Date();
    datePosted.setDate(datePosted.getDate() - Math.floor(Math.random() * 30));

    jobs.push({
      title: title,
      company: company.name,
      location: location,
      type: type,
      salary: salary,
      experience: exp,
      tags: roleProfile.skills,
      desc: `We are looking for a highly skilled ${title} to join our team at ${company.name}. You will be responsible for developing high-quality software solutions and collaborating with cross-functional teams in a fast-paced environment.`,
      requirements: [
        `Proficiency in ${roleProfile.skills[0]} and ${roleProfile.skills[1]}`,
        `Experience level: ${exp}`,
        'Strong problem-solving skills and analytical thinking',
        'Ability to work independently and collaboratively in a team',
        'Excellent communication and interpersonal skills'
      ],
      logo: `/logos/${logoFilename}`,
      createdAt: datePosted
    });
  }

  await Job.deleteMany({});
  await Job.insertMany(jobs);
};
