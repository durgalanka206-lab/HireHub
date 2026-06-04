require("dotenv").config();
const mongoose = require("mongoose");
const Job = require("./models/Job");

// Real 2025 jobs - salaries from AmbitionBox, Glassdoor India, LinkedIn Salary Insights
const jobs = [

  // ── GOOGLE INDIA ──────────────────────────────────────────
  { title:"Software Engineer III", company:"Google", location:"Hyderabad, India", type:"Full-time", salary:"₹45 – ₹80 LPA",
    logo:"G", color:"#4285F4", posted:"2d ago",
    tags:["Python","Java","Go","Distributed Systems","Kubernetes","SQL","Algorithms","System Design"],
    desc:"Build scalable backend systems for Google products serving billions of users globally.",
    requirements:["B.Tech/M.Tech CS","3+ years SWE","Strong DSA + system design","Large-scale distributed systems experience"] },

  { title:"Senior SWE Android", company:"Google", location:"Bangalore, India", type:"Full-time", salary:"₹55 – ₹95 LPA",
    logo:"G", color:"#4285F4", posted:"1d ago",
    tags:["Android","Kotlin","Java","Jetpack Compose","C++","System Design","Performance"],
    desc:"Lead Android platform development for Google apps used by 3 billion+ Android users.",
    requirements:["6+ years Android","Kotlin expert","Platform or framework work","Strong CS fundamentals"] },

  // ── MICROSOFT INDIA ───────────────────────────────────────
  { title:"SDE-2 Azure Cloud", company:"Microsoft", location:"Hyderabad, India", type:"Full-time", salary:"₹40 – ₹65 LPA",
    logo:"M", color:"#00A4EF", posted:"Just now",
    tags:["C#",".NET","Azure","Kubernetes","Python","Microservices","REST API","SQL"],
    desc:"Build Azure cloud services for Fortune 500 enterprises. Power India's cloud transformation.",
    requirements:["4+ years backend","Strong C# or Java","Azure certifications a plus","Distributed systems"] },

  { title:"Principal Engineer", company:"Microsoft", location:"Hyderabad, India", type:"Full-time", salary:"₹80 – ₹130 LPA",
    logo:"M", color:"#00A4EF", posted:"3d ago",
    tags:["System Design","Architecture","Azure","Python","Leadership","Distributed Systems","C++"],
    desc:"Define technical direction for Microsoft India engineering. Lead cross-team architecture decisions.",
    requirements:["10+ years SWE","Large systems track record","Azure/cloud architecture","Mentorship skills"] },

  // ── AMAZON INDIA ──────────────────────────────────────────
  { title:"SDE-2 Backend", company:"Amazon", location:"Bangalore, India", type:"Full-time", salary:"₹35 – ₹60 LPA",
    logo:"A", color:"#FF9900", posted:"1d ago",
    tags:["Java","AWS","DynamoDB","Microservices","REST API","System Design","Python","Kafka"],
    desc:"Build highly available services for Amazon.in serving 100M+ customers in payments, logistics, or recommendations.",
    requirements:["3+ years backend","Java proficiency","AWS experience","Microservices at scale"] },

  { title:"SDE-3 Prime Video", company:"Amazon", location:"Hyderabad, India", type:"Full-time", salary:"₹55 – ₹90 LPA",
    logo:"A", color:"#FF9900", posted:"4d ago",
    tags:["Java","Python","AWS","Video Streaming","CDN","Microservices","Redis","System Design"],
    desc:"Scale Prime Video infrastructure for 200M+ subscribers — streaming, content delivery, personalization.",
    requirements:["6+ years SWE","Media/streaming preferred","Strong system design","AWS expertise"] },

  // ── FLIPKART ──────────────────────────────────────────────
  { title:"SDE-2 Frontend", company:"Flipkart", location:"Bangalore, India", type:"Full-time", salary:"₹28 – ₹48 LPA",
    logo:"F", color:"#F74F00", posted:"Just now",
    tags:["React","TypeScript","Next.js","Node.js","CSS","Performance","Webpack","GraphQL"],
    desc:"Build web experience for India's largest e-commerce platform, optimized for 400M+ users across bandwidth constraints.",
    requirements:["3+ years React","TypeScript proficiency","Performance optimization","High-traffic experience"] },

  { title:"Staff Engineer Platform", company:"Flipkart", location:"Bangalore, India", type:"Full-time", salary:"₹65 – ₹110 LPA",
    logo:"F", color:"#F74F00", posted:"2d ago",
    tags:["Java","Kafka","Spark","Kubernetes","AWS","System Design","Architecture","Data Engineering"],
    desc:"Architect Flipkart core platform for 10M+ daily orders. Lead supply chain and logistics tech strategy.",
    requirements:["8+ years SWE","Platform/infra background","Strong architecture","Commerce domain knowledge"] },

  // ── SWIGGY ────────────────────────────────────────────────
  { title:"Backend Engineer Instamart", company:"Swiggy", location:"Bangalore, India", type:"Full-time", salary:"₹22 – ₹40 LPA",
    logo:"Sw", color:"#FC8019", posted:"1d ago",
    tags:["Go","Python","PostgreSQL","Redis","Kafka","Kubernetes","REST API","Microservices"],
    desc:"Build backend for Instamart 10-minute grocery delivery. Handle flash sales with millions of concurrent users.",
    requirements:["3+ years backend","Go or Python","High-throughput systems","Quick commerce a plus"] },

  { title:"ML Engineer Recommendations", company:"Swiggy", location:"Bangalore, India", type:"Full-time", salary:"₹28 – ₹50 LPA",
    logo:"Sw", color:"#FC8019", posted:"3d ago",
    tags:["Python","PyTorch","Recommendation Systems","SQL","Spark","Kafka","MLOps","Feature Engineering"],
    desc:"Build personalized food and restaurant recommendations for 90M+ Swiggy users using deep learning.",
    requirements:["3+ years ML","Recommendation systems","Python + ML frameworks","Production ML deployment"] },

  // ── ZOMATO ────────────────────────────────────────────────
  { title:"SDE-2 Hyperpure B2B", company:"Zomato", location:"Gurugram, India", type:"Full-time", salary:"₹22 – ₹40 LPA",
    logo:"Z", color:"#E23744", posted:"2d ago",
    tags:["Java","Spring Boot","MySQL","Redis","Kafka","REST API","Microservices","Docker"],
    desc:"Build B2B supply chain systems for Zomato Hyperpure — ingredient sourcing for 35,000+ restaurants.",
    requirements:["3+ years Java","Spring Boot microservices","B2B/supply chain a plus","Strong SQL"] },

  { title:"Data Scientist", company:"Zomato", location:"Gurugram, India", type:"Full-time", salary:"₹20 – ₹38 LPA",
    logo:"Z", color:"#E23744", posted:"1d ago",
    tags:["Python","SQL","Machine Learning","Statistics","A/B Testing","Pandas","Tableau","Scikit-learn"],
    desc:"Optimize ETAs, restaurant rankings, and customer retention at India's favourite food app.",
    requirements:["2+ years data science","Strong Python + SQL","A/B testing","Statistics fundamentals"] },

  // ── PHONEPE ───────────────────────────────────────────────
  { title:"Backend Engineer Payments Core", company:"PhonePe", location:"Bangalore, India", type:"Full-time", salary:"₹25 – ₹45 LPA",
    logo:"Ph", color:"#5F259F", posted:"Just now",
    tags:["Java","Spring Boot","MySQL","Redis","Kafka","Payment Systems","REST API","Microservices"],
    desc:"Build UPI payments infrastructure processing ₹1 crore+ transactions/day for 500M+ PhonePe users.",
    requirements:["3+ years Java backend","Payments/fintech experience","High-availability systems","MySQL + Redis"] },

  { title:"Android Engineer", company:"PhonePe", location:"Bangalore, India", type:"Full-time", salary:"₹22 – ₹40 LPA",
    logo:"Ph", color:"#5F259F", posted:"3d ago",
    tags:["Android","Kotlin","Java","Jetpack Compose","Firebase","REST API","Git","Payments"],
    desc:"Build PhonePe Android app — the most downloaded UPI app — for payments, banking, and insurance.",
    requirements:["3+ years Android","Kotlin + Jetpack Compose","Payment SDK a plus","Strong Android architecture"] },

  // ── RAZORPAY ──────────────────────────────────────────────
  { title:"SDE-2 Payments Infrastructure", company:"Razorpay", location:"Bangalore, India", type:"Full-time", salary:"₹28 – ₹50 LPA",
    logo:"Rz", color:"#2EB5C9", posted:"1d ago",
    tags:["Java","Spring Boot","MySQL","Redis","Kafka","Microservices","AWS","REST API"],
    desc:"Build payment infrastructure processing ₹10 lakh crore/year for 10M+ Indian businesses.",
    requirements:["3+ years backend","Java Spring Boot","Payments domain preferred","Distributed systems"] },

  { title:"Frontend Engineer", company:"Razorpay", location:"Bangalore, India", type:"Full-time", salary:"₹20 – ₹38 LPA",
    logo:"Rz", color:"#2EB5C9", posted:"2d ago",
    tags:["React","TypeScript","JavaScript","CSS","Webpack","GraphQL","REST API","Jest"],
    desc:"Build Razorpay Dashboard and checkout UX for millions of businesses and their customers.",
    requirements:["3+ years React","TypeScript proficiency","Payment UX a plus","Performance skills"] },

  // ── CRED ──────────────────────────────────────────────────
  { title:"iOS Engineer", company:"CRED", location:"Bangalore, India", type:"Full-time", salary:"₹25 – ₹45 LPA",
    logo:"CR", color:"#1A1A2E", posted:"2d ago",
    tags:["Swift","iOS","SwiftUI","Xcode","REST API","Git","Animations","UIKit"],
    desc:"Build CRED's premium iOS app — India's most design-forward fintech product for high-credit-score users.",
    requirements:["3+ years iOS","Swift + SwiftUI expert","Strong UI sensibility","Complex animations experience"] },

  // ── MEESHO ────────────────────────────────────────────────
  { title:"SDE-2 Growth Platform", company:"Meesho", location:"Bangalore, India", type:"Full-time", salary:"₹22 – ₹40 LPA",
    logo:"Me", color:"#A020F0", posted:"Just now",
    tags:["Java","Python","MySQL","Redis","Kafka","Microservices","AWS","Growth Engineering"],
    desc:"Build growth experiments and acquisition funnels for India's fastest growing social commerce with 140M+ users.",
    requirements:["3+ years backend","Growth engineering a plus","MySQL + caching","Experimentation mindset"] },

  // ── ZEPTO ─────────────────────────────────────────────────
  { title:"Full Stack Engineer", company:"Zepto", location:"Mumbai, India", type:"Full-time", salary:"₹20 – ₹38 LPA",
    logo:"Zp", color:"#7C3AED", posted:"1d ago",
    tags:["React","Node.js","TypeScript","PostgreSQL","Redis","Docker","AWS","GraphQL"],
    desc:"Build Zepto consumer app and ops dashboard for India's fastest 10-minute delivery startup.",
    requirements:["3+ years full-stack","React + Node.js","Startup pace","PostgreSQL + Redis"] },

  // ── GROWW ─────────────────────────────────────────────────
  { title:"Backend Engineer Trading", company:"Groww", location:"Bangalore, India", type:"Full-time", salary:"₹28 – ₹52 LPA",
    logo:"Gr", color:"#00D09C", posted:"2d ago",
    tags:["Go","Golang","PostgreSQL","Redis","Kafka","Microservices","Trading Systems","WebSocket"],
    desc:"Build real-time trading infrastructure for India's largest investment platform with 10M+ active investors.",
    requirements:["3+ years backend","Go (Golang)","Real-time systems","Fintech/trading a plus"] },

  // ── INFOSYS ───────────────────────────────────────────────
  { title:"Senior Software Engineer", company:"Infosys", location:"Pune, India", type:"Full-time", salary:"₹12 – ₹22 LPA",
    logo:"I", color:"#007CC3", posted:"Just now",
    tags:["Java","Spring Boot","SQL","REST API","Microservices","Docker","Git","Maven"],
    desc:"Build enterprise applications for BFSI, retail, and healthcare global clients.",
    requirements:["3+ years Java","Spring Boot microservices","Good communication","Domain knowledge a plus"] },

  { title:"Python Developer", company:"Infosys", location:"Bangalore, India", type:"Full-time", salary:"₹10 – ₹18 LPA",
    logo:"I", color:"#007CC3", posted:"3d ago",
    tags:["Python","Django","FastAPI","SQL","REST API","Docker","Git","Pandas"],
    desc:"Develop automation and AI-powered backend services for Infosys global digital clients.",
    requirements:["2+ years Python","Django or FastAPI","REST API design","Problem-solving skills"] },

  // ── TCS ───────────────────────────────────────────────────
  { title:"Full Stack Developer", company:"TCS", location:"Hyderabad, India", type:"Full-time", salary:"₹8 – ₹16 LPA",
    logo:"T", color:"#C00000", posted:"1d ago",
    tags:["Java","JavaScript","Angular","React","SQL","REST API","HTML","CSS","Git"],
    desc:"Work on digital transformation for Fortune 500 clients in banking, insurance, and retail.",
    requirements:["2+ years full-stack","Java + React/Angular","SQL databases","Good communication"] },

  { title:"Cloud Engineer", company:"TCS", location:"Chennai, India", type:"Full-time", salary:"₹10 – ₹20 LPA",
    logo:"T", color:"#C00000", posted:"2d ago",
    tags:["AWS","Azure","Terraform","Docker","Kubernetes","Linux","Python","CI/CD"],
    desc:"Lead cloud migration projects for TCS enterprise clients moving to AWS and Azure.",
    requirements:["3+ years cloud","Certified preferred","Terraform IaC","Linux proficiency"] },

  // ── WIPRO ─────────────────────────────────────────────────
  { title:"Data Engineer", company:"Wipro", location:"Bangalore, India", type:"Full-time", salary:"₹10 – ₹20 LPA",
    logo:"W", color:"#341C5C", posted:"1d ago",
    tags:["Python","Spark","SQL","Airflow","AWS","Kafka","ETL","PostgreSQL"],
    desc:"Build data pipelines for retail, manufacturing, and telecom clients on modern data stack.",
    requirements:["2+ years data engineering","Python + SQL","Spark or Airflow","Cloud data platforms"] },

  // ── HCL ───────────────────────────────────────────────────
  { title:"DevOps Engineer", company:"HCL Technologies", location:"Noida, India", type:"Full-time", salary:"₹12 – ₹22 LPA",
    logo:"HC", color:"#0076CE", posted:"2d ago",
    tags:["Kubernetes","AWS","Docker","Terraform","Jenkins","Linux","Python","CI/CD"],
    desc:"Automate and manage cloud infrastructure for HCL's Fortune 1000 clients.",
    requirements:["3+ years DevOps","Kubernetes + Docker","AWS/Azure certifications","IaC experience"] },

  // ── COGNIZANT ─────────────────────────────────────────────
  { title:"QA Automation Engineer", company:"Cognizant", location:"Hyderabad, India", type:"Full-time", salary:"₹8 – ₹18 LPA",
    logo:"Cog", color:"#1266AE", posted:"3d ago",
    tags:["Selenium","Java","TestNG","Python","REST API Testing","Postman","CI/CD","Cypress"],
    desc:"Build test automation frameworks for enterprise web, mobile, and API layers.",
    requirements:["2+ years automation","Selenium + Java/Python","API testing","CI/CD knowledge"] },

  // ── ACCENTURE ─────────────────────────────────────────────
  { title:"React Developer", company:"Accenture", location:"Bangalore, India", type:"Full-time", salary:"₹10 – ₹20 LPA",
    logo:"Ac", color:"#A100FF", posted:"Just now",
    tags:["React","JavaScript","TypeScript","HTML","CSS","Redux","REST API","Git"],
    desc:"Build responsive web apps for Accenture's global financial services and retail clients.",
    requirements:["2+ years React","TypeScript","Responsive design","REST API integration"] },

  // ── ZERODHA ───────────────────────────────────────────────
  { title:"Platform Engineer", company:"Zerodha", location:"Bangalore, India", type:"Full-time", salary:"₹20 – ₹40 LPA",
    logo:"Ze", color:"#387ED1", posted:"2d ago",
    tags:["Python","Go","PostgreSQL","Redis","Linux","Kafka","Trading Systems","Performance"],
    desc:"Build trading platform for India's largest broker with 15M+ traders and ₹1000 crore daily turnover.",
    requirements:["3+ years backend","Python or Go","Financial markets a plus","High-performance systems"] },

  // ── PAYTM ─────────────────────────────────────────────────
  { title:"SDE-2 Payments", company:"Paytm", location:"Noida, India", type:"Full-time", salary:"₹22 – ₹40 LPA",
    logo:"Pt", color:"#00BAF2", posted:"1d ago",
    tags:["Java","Spring Boot","MySQL","Redis","Kafka","Microservices","AWS","REST API"],
    desc:"Build payment and financial services for Paytm's 350M+ users — India's super app.",
    requirements:["3+ years Java","High-scale systems","Payments domain","Spring Boot microservices"] },

  // ── FRESHWORKS ────────────────────────────────────────────
  { title:"Frontend Engineer", company:"Freshworks", location:"Chennai, India", type:"Full-time", salary:"₹18 – ₹35 LPA",
    logo:"FW", color:"#FF5B5B", posted:"2d ago",
    tags:["Vue.js","React","JavaScript","TypeScript","HTML","CSS","REST API","Webpack"],
    desc:"Build Freshdesk and Freshsales SaaS UI for 60,000+ global business customers.",
    requirements:["3+ years frontend","Vue.js or React","TypeScript","SaaS product building"] },

  // ── BROWSERSTACK ──────────────────────────────────────────
  { title:"SDE-2 Test Platform", company:"BrowserStack", location:"Mumbai, India", type:"Full-time", salary:"₹25 – ₹45 LPA",
    logo:"BS", color:"#FF6C37", posted:"1d ago",
    tags:["Java","Node.js","Selenium","WebDriver","Docker","Kubernetes","AWS","Python"],
    desc:"Build the world's largest cloud browser testing platform used by Microsoft, Twitter, 50,000+ devs.",
    requirements:["3+ years SWE","Browser internals a plus","Docker + Kubernetes","Java or Node.js"] },

  // ── URBAN COMPANY ─────────────────────────────────────────
  { title:"Backend Engineer", company:"Urban Company", location:"Gurugram, India", type:"Full-time", salary:"₹20 – ₹38 LPA",
    logo:"UC", color:"#006EFF", posted:"2d ago",
    tags:["Node.js","JavaScript","MongoDB","Redis","AWS","REST API","Microservices","TypeScript"],
    desc:"Build marketplace platform connecting 40,000+ service professionals with customers in 35 Indian cities.",
    requirements:["3+ years Node.js","MongoDB experience","Marketplace systems","Microservices"] },

  // ── COINSWITCH ────────────────────────────────────────────
  { title:"Blockchain Developer", company:"CoinSwitch", location:"Bangalore, India", type:"Full-time", salary:"₹25 – ₹50 LPA",
    logo:"CS", color:"#0052FF", posted:"Just now",
    tags:["Solidity","Ethereum","Web3.js","JavaScript","Node.js","Smart Contracts","DeFi","Python"],
    desc:"Build crypto trading and DeFi features for India's largest crypto platform with 20M+ users.",
    requirements:["2+ years Solidity","Smart contract development","Web3.js or ethers.js","DeFi knowledge"] },

  // ── SAMSUNG R&D ───────────────────────────────────────────
  { title:"ML Research Engineer", company:"Samsung R&D", location:"Bangalore, India", type:"Full-time", salary:"₹25 – ₹50 LPA",
    logo:"Sa", color:"#1428A0", posted:"3d ago",
    tags:["Python","PyTorch","NLP","Computer Vision","BERT","Transformers","Research","C++"],
    desc:"Research AI/ML for Samsung Galaxy AI — on-device models for Bixby, camera, and productivity features.",
    requirements:["MS/PhD in ML preferred","PyTorch proficiency","CV or NLP specialization","Publications a plus"] },

  // ── ORACLE INDIA ──────────────────────────────────────────
  { title:"Java Developer", company:"Oracle", location:"Hyderabad, India", type:"Full-time", salary:"₹18 – ₹35 LPA",
    logo:"Or", color:"#F80000", posted:"2d ago",
    tags:["Java","Oracle DB","Spring","Microservices","SQL","REST API","Linux","Docker"],
    desc:"Build Oracle cloud database and ERP applications for Fortune 500 global customers.",
    requirements:["3+ years Java","Oracle DB a plus","Spring microservices","Strong SQL"] },

  // ── SAP LABS ──────────────────────────────────────────────
  { title:"Full Stack Engineer", company:"SAP Labs", location:"Bangalore, India", type:"Full-time", salary:"₹18 – ₹35 LPA",
    logo:"SL", color:"#0070F2", posted:"1d ago",
    tags:["Java","React","HANA DB","REST API","JavaScript","TypeScript","Docker","SAP BTP"],
    desc:"Build SAP cloud ERP on SAP BTP used by 400,000+ companies worldwide.",
    requirements:["3+ years full-stack","Java + React","SAP HANA or Oracle DB","Cloud-native dev"] },

  // ── ADOBE INDIA ───────────────────────────────────────────
  { title:"Computer Vision Engineer", company:"Adobe", location:"Noida, India", type:"Full-time", salary:"₹28 – ₹55 LPA",
    logo:"Ad", color:"#FF0000", posted:"2d ago",
    tags:["Python","PyTorch","Computer Vision","Deep Learning","CUDA","OpenCV","C++","GAN"],
    desc:"Build AI features for Adobe Photoshop, Firefly, and Creative Cloud used by 30M+ creatives.",
    requirements:["3+ years CV/ML","PyTorch proficiency","Generative AI or image processing","Publications preferred"] },

  // ── ATLASSIAN ─────────────────────────────────────────────
  { title:"Software Engineer", company:"Atlassian", location:"Bangalore, India", type:"Full-time", salary:"₹35 – ₹65 LPA",
    logo:"At", color:"#0052CC", posted:"3d ago",
    tags:["Java","React","PostgreSQL","AWS","TypeScript","GraphQL","Kotlin","Docker"],
    desc:"Build Jira and Confluence features used by 10M+ teams worldwide to plan and collaborate.",
    requirements:["3+ years SWE","Java or Kotlin","React frontend","GraphQL experience"] },

  // ── QUALCOMM ──────────────────────────────────────────────
  { title:"Embedded Systems Engineer", company:"Qualcomm", location:"Hyderabad, India", type:"Full-time", salary:"₹18 – ₹38 LPA",
    logo:"Q", color:"#3253DC", posted:"1d ago",
    tags:["C","C++","Linux","RTOS","ARM","Embedded","Firmware","Android BSP","Git"],
    desc:"Build firmware for Snapdragon SoCs powering 1.5 billion smartphones and IoT devices.",
    requirements:["3+ years embedded C/C++","ARM architecture","RTOS or Linux kernel","Strong debugging"] },

  // ── AIRTEL ────────────────────────────────────────────────
  { title:"Senior Data Engineer", company:"Airtel", location:"Gurugram, India", type:"Full-time", salary:"₹22 – ₹42 LPA",
    logo:"Ai", color:"#E40000", posted:"1d ago",
    tags:["Python","Spark","Hadoop","SQL","Kafka","Azure","Data Modeling","ETL"],
    desc:"Build real-time data pipelines processing billions of telecom events for Airtel analytics.",
    requirements:["4+ years data engineering","Spark + Hadoop","Python + SQL","Azure Databricks"] },

  // ── THOUGHTWORKS ──────────────────────────────────────────
  { title:"Lead Developer", company:"ThoughtWorks", location:"Hyderabad, India", type:"Full-time", salary:"₹25 – ₹50 LPA",
    logo:"TW", color:"#F05A28", posted:"1d ago",
    tags:["Java","React","Python","TDD","Agile","XP","AWS","Docker","DevOps"],
    desc:"Lead agile teams for ThoughtWorks' global tech clients using extreme programming practices.",
    requirements:["5+ years SWE","Test-driven development","Agile/XP methodology","Consulting experience"] },

  // ── INTERNSHIPS ───────────────────────────────────────────
  { title:"Software Engineer Intern", company:"Google", location:"Hyderabad, India", type:"Internship", salary:"₹1.5L/month",
    logo:"G", color:"#4285F4", posted:"Just now",
    tags:["Python","Java","Data Structures","Algorithms","Go","SQL","Problem Solving"],
    desc:"12-week internship building real features in Google product teams. Strong interns get return offers.",
    requirements:["B.Tech/M.Tech CS 3rd/4th year","Strong DSA","Competitive programming valued","CGPA 8.0+"] },

  { title:"SDE Intern", company:"Microsoft", location:"Hyderabad, India", type:"Internship", salary:"₹1.4L/month",
    logo:"M", color:"#00A4EF", posted:"2d ago",
    tags:["C#","Java","Python","Algorithms","Data Structures","Azure","Git"],
    desc:"10-week internship on real Microsoft products — Azure, Office, LinkedIn, or Dynamics teams.",
    requirements:["Pursuing B.Tech CS","Strong coding skills","Any OOP language","CGPA 7.5+"] },

  { title:"Data Science Intern", company:"Flipkart", location:"Bangalore, India", type:"Internship", salary:"₹85K/month",
    logo:"F", color:"#F74F00", posted:"1d ago",
    tags:["Python","SQL","Machine Learning","Pandas","Statistics","Scikit-learn","Jupyter"],
    desc:"Work on recommendation systems, pricing, or search ranking for Flipkart's 400M+ users.",
    requirements:["B.Tech/M.Tech pursuing","Python + ML basics","Statistics fundamentals","Projects or Kaggle"] },

  { title:"Frontend Intern", company:"Razorpay", location:"Bangalore, India", type:"Internship", salary:"₹60K/month",
    logo:"Rz", color:"#2EB5C9", posted:"3d ago",
    tags:["React","JavaScript","HTML","CSS","Git","REST API"],
    desc:"Build UI for Razorpay dashboard used by 10M+ businesses. Real features from day 1.",
    requirements:["B.Tech CS/IT pursuing","React basics","Good CSS skills","Personal projects valued"] },

  { title:"Backend Intern", company:"Swiggy", location:"Bangalore, India", type:"Internship", salary:"₹75K/month",
    logo:"Sw", color:"#FC8019", posted:"Just now",
    tags:["Java","Python","SQL","Spring Boot","REST API","Git","Data Structures"],
    desc:"Build microservices for Swiggy food ordering and delivery. Work with senior engineers on real features.",
    requirements:["B.Tech CS/IT pursuing","Java or Python basics","DSA fundamentals","System design awareness"] },

  { title:"ML Research Intern", company:"Adobe", location:"Noida, India", type:"Internship", salary:"₹90K/month",
    logo:"Ad", color:"#FF0000", posted:"2d ago",
    tags:["Python","PyTorch","Computer Vision","NLP","Deep Learning","Research"],
    desc:"Work on generative AI research for Adobe Firefly and Creative Cloud AI features.",
    requirements:["MS/PhD pursuing ML/CS","PyTorch proficiency","Research experience","CV or NLP focus"] },

  // ── REMOTE / CONTRACT ─────────────────────────────────────
  { title:"Senior React Developer", company:"Postman", location:"Bangalore, India", type:"Full-time", salary:"₹25 – ₹50 LPA",
    logo:"Po", color:"#FF6C37", posted:"1d ago",
    tags:["React","TypeScript","JavaScript","GraphQL","REST API","Testing","Webpack","CSS"],
    desc:"Build Postman API platform UI used by 30M+ developers globally.",
    requirements:["4+ years React","TypeScript + GraphQL","Developer tools experience","Strong testing"] },

  { title:"Technical Writer", company:"Postman", location:"Bangalore, India", type:"Full-time", salary:"₹15 – ₹28 LPA",
    logo:"Po", color:"#FF6C37", posted:"1d ago",
    tags:["Technical Writing","API Documentation","Markdown","Swagger","Postman","JavaScript","Git"],
    desc:"Create world-class API documentation for Postman used by 30M+ developers.",
    requirements:["3+ years technical writing","API doc experience","Developer empathy","Strong English"] },

  { title:"Solutions Engineer", company:"Salesforce", location:"Mumbai, India", type:"Full-time", salary:"₹20 – ₹40 LPA",
    logo:"SF", color:"#00A1E0", posted:"2d ago",
    tags:["JavaScript","Salesforce","Apex","REST API","SQL","Postman","CRM","Visualforce"],
    desc:"Help India enterprise customers implement Salesforce CRM across Sales, Service, and Marketing clouds.",
    requirements:["Salesforce certification","REST API + JavaScript","2+ years enterprise software","Customer-facing"] },

  { title:"Scrum Master", company:"SAP Labs", location:"Bangalore, India", type:"Full-time", salary:"₹18 – ₹35 LPA",
    logo:"SL", color:"#0070F2", posted:"2d ago",
    tags:["Agile","Scrum","Jira","Confluence","Kanban","Sprint Planning","Stakeholder Management"],
    desc:"Lead 2-3 agile scrum teams building SAP cloud ERP. Facilitate ceremonies, remove blockers, improve velocity.",
    requirements:["CSM or PSM I certified","3+ years Scrum Master","Jira + Confluence expert","Enterprise delivery"] },
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
    await Job.deleteMany({});
    console.log("🗑  Old jobs cleared");
    const inserted = await Job.insertMany(jobs);
    console.log(`\n✅ ${inserted.length} jobs seeded!`);
    const companies = [...new Set(jobs.map(j=>j.company))];
    console.log(`🏢 ${companies.length} companies: ${companies.join(", ")}`);
    const lpa = jobs.filter(j=>j.salary?.includes("LPA")).map(j=>{const m=j.salary.match(/₹(\d+) – ₹(\d+)/);return m?parseInt(m[2]):0;}).filter(Boolean);
    console.log(`💰 Salary range: ₹8 – ₹${Math.max(...lpa)} LPA`);
    process.exit(0);
  })
  .catch(err => { console.error("❌", err.message); process.exit(1); });