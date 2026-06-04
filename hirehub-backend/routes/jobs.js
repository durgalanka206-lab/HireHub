const express = require("express");
const router  = express.Router();
const Job     = require("../models/Job");
const { protect, adminOnly } = require("./auth");

// Public — active jobs only (used by user-facing portal)
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin — ALL jobs including inactive
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin — create job
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin — update job
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin — delete job
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── ONE-TIME SETUP ROUTES (no auth needed for Railway seed) ──
router.get("/seed-now", async (req, res) => {
  try {
    const User = require("../models/User");
    const jobs = [
      { title:"Full Stack Engineer", company:"SAP Labs", location:"Bangalore, India", type:"Full-time", salary:"₹18 – ₹35 LPA", logo:"SL", color:"#0070F2", tags:["Java","React","HANA","Node"], desc:"Build SAP cloud ERP on SAP BTP used by 400,000+ companies worldwide.", isActive:true },
      { title:"Frontend Intern", company:"Razorpay", location:"Bangalore, India", type:"Internship", salary:"₹60K/month", logo:"Rz", color:"#2D9CDB", tags:["React","JavaScript","HTML","CSS","Git","REST API"], desc:"Build UI for Razorpay dashboard used by 10M+ businesses.", isActive:true },
      { title:"Backend Developer", company:"Swiggy", location:"Bangalore, India", type:"Full-time", salary:"₹28 – ₹50 LPA", logo:"Sw", color:"#FC8019", tags:["Java","Python","SQL","Spring Boot","REST API","Git"], desc:"Build microservices for Swiggy food ordering.", isActive:true },
      { title:"React Developer", company:"Accenture", location:"Bangalore, India", type:"Full-time", salary:"₹10 – ₹20 LPA", logo:"Ac", color:"#A100FF", tags:["React","JavaScript","TypeScript","CSS","Git"], desc:"Build enterprise React applications.", isActive:true },
      { title:"Python Developer", company:"Infosys", location:"Bangalore, India", type:"Full-time", salary:"₹10 – ₹18 LPA", logo:"I", color:"#007CC3", tags:["Python","SQL","Django","REST","Git"], desc:"Build Python microservices for Infosys clients.", isActive:true },
      { title:"Software Engineer Intern", company:"Google", location:"Hyderabad, India", type:"Internship", salary:"₹20 k/month", logo:"G", color:"#4285F4", tags:["Python","SQL","Algorithms","Data Structures","Problem Solving"], desc:"12-week internship building real features in Google product teams.", isActive:true },
      { title:"SDE Intern", company:"Microsoft", location:"Hyderabad, India", type:"Internship", salary:"₹25k/month", logo:"M", color:"#00A4EF", tags:["C#","Java","Algorithms","Data Structures","Azure","Git"], desc:"10-week internship on real Microsoft products.", isActive:true },
      { title:"Full Stack Developer", company:"TCS", location:"Hyderabad, India", type:"Full-time", salary:"₹8 – ₹16 LPA", logo:"T", color:"#003399", tags:["Java","Python","JavaScript","SQL","React","Node"], desc:"Build enterprise full-stack applications for TCS clients.", isActive:true },
      { title:"Data Science Intern", company:"Flipkart", location:"Bangalore, India", type:"Internship", salary:"₹85K/month", logo:"F", color:"#F74F00", tags:["Python","Machine Learning","Pandas","Statistics","Scikit-learn"], desc:"Work on recommendation systems for Flipkart's 400M+ users.", isActive:true },
      { title:"Senior React Developer", company:"Postman", location:"Bangalore, India", type:"Full-time", salary:"₹25 – ₹50 LPA", logo:"Po", color:"#FF6C37", tags:["React","TypeScript","JavaScript","GraphQL","REST API","Testing"], desc:"Build Postman API platform UI used by 30M+ developers.", isActive:true },
      { title:"Technical Writer", company:"Postman", location:"Bangalore, India", type:"Full-time", salary:"₹15 – ₹28 LPA", logo:"Po", color:"#FF6C37", tags:["Technical API Documentation","Markdown","Swagger","Postman","JavaScript","Git"], desc:"Create world-class API documentation for Postman.", isActive:true },
      { title:"Backend Intern", company:"Swiggy", location:"Bangalore, India", type:"Internship", salary:"₹75K/month", logo:"Sw", color:"#FC8019", tags:["Java","Python","SQL","Spring Boot","REST API","Git","Data Structures"], desc:"Build microservices for Swiggy food ordering.", isActive:true },
      { title:"Frontend Intern", company:"Razorpay", location:"Bangalore, India", type:"Internship", salary:"₹60K/month", logo:"Rz", color:"#2D9CDB", tags:["React","JavaScript","HTML","CSS","Git","REST API"], desc:"Build UI for Razorpay checkout used by 5M+ merchants.", isActive:true },
      { title:"ML Research Intern", company:"Adobe", location:"Noida, India", type:"Internship", salary:"₹90K/month", logo:"Ad", color:"#FF0000", tags:["Python","PyTorch","Computer Vision","NLP","Deep Learning","Research"], desc:"Work on generative AI research for Adobe Firefly.", isActive:true },
      { title:"iOS Engineer", company:"CRED", location:"Bangalore, India", type:"Full-time", salary:"₹25 – ₹45 LPA", logo:"CR", color:"#1A1A2E", tags:["Swift","iOS","SwiftUI","Xcode","REST API","Git","Animations"], desc:"Build CRED's premium iOS app.", isActive:true },
      { title:"DevOps Engineer", company:"Zepto", location:"Mumbai, India", type:"Full-time", salary:"₹20 – ₹40 LPA", logo:"Ze", color:"#9B59B6", tags:["Docker","Kubernetes","AWS","CI/CD","Python","Linux","Terraform"], desc:"Build and maintain Zepto's rapid delivery infrastructure.", isActive:true },
      { title:"Senior Data Engineer", company:"Airtel", location:"Gurugram, India", type:"Full-time", salary:"₹22 – ₹42 LPA", logo:"Ai", color:"#E40000", tags:["Python","Spark","Hadoop","SQL","Kafka","Azure","Data Modeling"], desc:"Build real-time data pipelines processing billions of telecom events.", isActive:true },
      { title:"Solutions Engineer", company:"Salesforce", location:"Mumbai, India", type:"Full-time", salary:"₹20 – ₹40 LPA", logo:"SF", color:"#00A1E0", tags:["JavaScript","Salesforce","Apex","REST API","SQL","Postman","CRM"], desc:"Help India enterprise customers implement Salesforce CRM.", isActive:true },
      { title:"Scrum Master", company:"SAP Labs", location:"Bangalore, India", type:"Full-time", salary:"₹18 – ₹35 LPA", logo:"SL", color:"#0070F2", tags:["Agile","Scrum","Jira","Confluence","Kanban","Sprint Planning"], desc:"Lead 2-3 agile scrum teams building SAP cloud ERP.", isActive:true },
      { title:"QA Automation Engineer", company:"Cognizant", location:"Hyderabad, India", type:"Full-time", salary:"₹8 – ₹18 LPA", logo:"Cog", color:"#1266AE", tags:["Selenium","TestNG","Java","Python","REST API testing","Postman","CI/CD","Cypress"], desc:"Build test automation frameworks for enterprise web, mobile, and API layers.", isActive:true },
    ];

    await Job.deleteMany({});
    await Job.insertMany(jobs);

    // Also create admin user
    await User.deleteMany({});
    await User.create({
      name: "Durga Lanka",
      email: "lankadurga779@gmail.com",
      password: "Ammu@2026",
      role: "admin",
    });

    res.json({ success: true, message: "✅ " + jobs.length + " jobs seeded + admin created!", admin: "lankadurga779@gmail.com", password: "Ammu@2026" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
router.get("/seed-now", async (req, res) => {
  try {
    const User = require("../models/User");
    const jobs = [
      { title:"Frontend Intern", company:"Razorpay", location:"Bangalore, India", type:"Internship", salary:"₹60K/month", logo:"Rz", color:"#2D9CDB", tags:["React","JavaScript","HTML","CSS","Git","REST API"], desc:"Build UI for Razorpay dashboard.", isActive:true },
      { title:"Full Stack Developer", company:"TCS", location:"Hyderabad, India", type:"Full-time", salary:"₹8 – ₹16 LPA", logo:"T", color:"#003399", tags:["Java","Python","JavaScript","SQL","React","Node"], desc:"Build enterprise applications.", isActive:true },
      { title:"Backend Developer", company:"Swiggy", location:"Bangalore, India", type:"Full-time", salary:"₹28 – ₹50 LPA", logo:"Sw", color:"#FC8019", tags:["Java","Python","SQL","Spring Boot","REST API","Git"], desc:"Build microservices.", isActive:true },
      { title:"SDE Intern", company:"Microsoft", location:"Hyderabad, India", type:"Internship", salary:"₹25k/month", logo:"M", color:"#00A4EF", tags:["C#","Java","Algorithms","Data Structures","Azure","Git"], desc:"10-week internship on real Microsoft products.", isActive:true },
      { title:"Software Engineer Intern", company:"Google", location:"Hyderabad, India", type:"Internship", salary:"₹20k/month", logo:"G", color:"#4285F4", tags:["Python","SQL","Algorithms","Data Structures","Problem Solving"], desc:"12-week internship at Google.", isActive:true },
      { title:"React Developer", company:"Accenture", location:"Bangalore, India", type:"Full-time", salary:"₹10 – ₹20 LPA", logo:"Ac", color:"#A100FF", tags:["React","JavaScript","TypeScript","CSS","Git"], desc:"Build enterprise React apps.", isActive:true },
      { title:"Technical Writer", company:"Postman", location:"Bangalore, India", type:"Full-time", salary:"₹15 – ₹28 LPA", logo:"Po", color:"#FF6C37", tags:["Technical API Documentation","Markdown","Swagger","Postman","JavaScript","Git"], desc:"Create API documentation.", isActive:true },
      { title:"Data Science Intern", company:"Flipkart", location:"Bangalore, India", type:"Internship", salary:"₹85K/month", logo:"F", color:"#F74F00", tags:["Python","Machine Learning","Pandas","Statistics","Scikit-learn"], desc:"Work on recommendation systems.", isActive:true },
      { title:"Senior React Developer", company:"Postman", location:"Bangalore, India", type:"Full-time", salary:"₹25 – ₹50 LPA", logo:"Po", color:"#FF6C37", tags:["React","TypeScript","JavaScript","GraphQL","REST API","Testing"], desc:"Build Postman API platform.", isActive:true },
      { title:"DevOps Engineer", company:"Zepto", location:"Mumbai, India", type:"Full-time", salary:"₹20 – ₹40 LPA", logo:"Ze", color:"#9B59B6", tags:["Docker","Kubernetes","AWS","CI/CD","Python","Linux","Terraform"], desc:"Build Zepto infrastructure.", isActive:true },
    ];
    await Job.deleteMany({});
    await Job.insertMany(jobs);
    await User.deleteMany({});
    await User.create({ name:"Durga Lanka", email:"lankadurga779@gmail.com", password:"Ammu@2026", role:"admin" });
    res.json({ success:true, message:"20 jobs seeded + admin created!", admin:"lankadurga779@gmail.com", password:"Ammu@2026" });
  } catch(err) {
    res.status(500).json({ success:false, message:err.message });
  }
});
