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

const roles = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', 'UX Designer', 'Machine Learning Engineer', 'Systems Analyst', 'Cloud Architect', 'Security Engineer', 'QA Tester', 'Mobile Developer', 'Database Administrator'];
const locations = ['Bangalore, India', 'Hyderabad, India', 'Pune, India', 'Mumbai, India', 'Delhi, India', 'Chennai, India', 'Remote', 'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'London, UK', 'Berlin, Germany'];
const types = ['Full-time', 'Part-time', 'Internship', 'Contract'];
const expLevels = ['Fresher', '1-3 years', '3-5 years', '5-10 years', '10+ years'];
const skillSets = [
  ['React', 'JavaScript', 'HTML', 'CSS', 'Node.js'],
  ['Python', 'Django', 'PostgreSQL', 'AWS'],
  ['Java', 'Spring Boot', 'Microservices', 'Kubernetes'],
  ['C++', 'Algorithms', 'Data Structures', 'Linux'],
  ['Go', 'Docker', 'GCP', 'Redis'],
  ['Machine Learning', 'Python', 'TensorFlow', 'PyTorch'],
  ['Swift', 'iOS', 'Objective-C', 'Xcode'],
  ['Kotlin', 'Android', 'Java', 'Firebase'],
  ['Data Analysis', 'SQL', 'Tableau', 'Excel'],
  ['DevOps', 'CI/CD', 'Jenkins', 'Ansible', 'Terraform']
];

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
  
  for (let i = 0; i < 150; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    
    const logoFilename = `${company.name.toLowerCase().replace(/\\s+/g, '-')}.png`;
    const logoPath = path.join(logosDir, logoFilename);
    if (!fs.existsSync(logoPath)) {
      try {
        await downloadImage(`https://logo.clearbit.com/${company.domain}`, logoPath);
      } catch (e) {}
    }

    const role = roles[Math.floor(Math.random() * roles.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const exp = expLevels[Math.floor(Math.random() * expLevels.length)];
    const skills = skillSets[Math.floor(Math.random() * skillSets.length)];
    const salary = `₹${Math.floor(Math.random() * 20 + 5)} - ₹${Math.floor(Math.random() * 40 + 25)} LPA`;

    jobs.push({
      title: `${type === 'Internship' ? role + ' Intern' : role}`,
      company: company.name,
      location: location,
      type: type,
      salary: salary,
      experience: exp,
      skills: skills,
      description: `We are looking for a highly skilled ${role} to join our team at ${company.name}. You will be responsible for developing high-quality software solutions and collaborating with cross-functional teams.`,
      requirements: [
        `Experience in ${skills[0]} and ${skills[1]}`,
        'Strong problem-solving skills',
        'Ability to work independently and in a team',
        'Excellent communication skills'
      ],
      logo: `/logos/${logoFilename}`
    });
  }

  await Job.deleteMany({});
  await Job.insertMany(jobs);
};
