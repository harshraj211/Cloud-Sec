// ═══════════════════════════════════════════════════
// DATA.JS — All static content for CloudSec Tracker
// ═══════════════════════════════════════════════════

const PHASES = [
  { name:"Phase 1", label:"Cloud Fundamentals",       days:[1,30],  color:"#60a5fa", bg:"rgba(96,165,250,.07)",  border:"rgba(96,165,250,.2)"  },
  { name:"Phase 2", label:"Cloud Security Deep Dive", days:[31,60], color:"#34d399", bg:"rgba(52,211,153,.07)",  border:"rgba(52,211,153,.2)"  },
  { name:"Phase 3", label:"AWS CCP Exam + Bridge",    days:[61,75], color:"#fbbf24", bg:"rgba(251,191,36,.07)",  border:"rgba(251,191,36,.2)"  },
  { name:"Phase 4", label:"Security+ Intensive",      days:[76,100],color:"#f87171", bg:"rgba(248,113,113,.07)", border:"rgba(248,113,113,.2)" },
];

const TOPICS = {
  1:"Cloud Basics & AWS Account Setup",2:"AWS Regions, AZs & Edge Locations",3:"Core AWS Services Overview",4:"AWS Free Tier Hands-on Lab",5:"EC2 Introduction & Launch",6:"S3 Buckets — Create & Configure",7:"Week 1 Review & Quiz",
  8:"IAM Users, Groups & Permissions",9:"IAM Policies (JSON deep dive)",10:"IAM Roles & Trust Policies",11:"MFA Setup & Best Practices",12:"Least Privilege Principle",13:"IAM Best Practices Checklist",14:"Week 2 Review & Mock IAM Scenarios",
  15:"VPC Concepts & Architecture",16:"Subnets, Route Tables & Gateways",17:"Security Groups (Stateful)",18:"Network ACLs (Stateless)",19:"VPC Peering & Endpoints",20:"Internet & NAT Gateway",21:"Week 3 Review — Build a VPC",
  22:"S3 Security & Bucket Policies",23:"S3 Encryption & Versioning",24:"EC2 Deep Dive (AMI, Types)",25:"EBS, EFS & Storage Types",26:"RDS & Database Security",27:"AWS Lambda & Serverless",28:"CloudFormation Basics",29:"AWS Billing, Cost & Budgets",30:"Phase 1 Complete Review + Mock",
  31:"Cloud Threat Landscape Overview",32:"OWASP Cloud Security Top 10",33:"Shared Responsibility Model",34:"Data Classification in Cloud",35:"Cloud Attack Vectors & TTPs",36:"Threat Modeling for Cloud Apps",37:"Week 5 Review",
  38:"AWS CloudTrail Setup & Analysis",39:"CloudWatch Alarms & Dashboards",40:"AWS GuardDuty Configuration",41:"AWS Config & Compliance",42:"AWS Security Hub Overview",43:"SIEM Basics & Log Analysis",44:"Week 6 Review",
  45:"S3 Misconfiguration Attack Lab",46:"IAM Privilege Escalation Paths",47:"CloudGoat Scenario 1",48:"CloudGoat Scenario 2",49:"Pacu AWS Exploitation Framework",50:"HackTricks Cloud Reference",51:"Week 7 Review",
  52:"AWS CCP Mock Exam 1",53:"Mock 1 Review & Gap Analysis",54:"AWS CCP Mock Exam 2",55:"Weak Area Deep Dive",56:"AWS CCP Mock Exam 3",57:"Final Service Review",58:"Exam Strategy & Time Management",59:"Rest, Light Revision Only",60:"Phase 2 Complete Review",
  61:"CCP Final Cram — Cloud Concepts",62:"CCP Final Cram — Security Domain",63:"🎯 AWS CCP EXAM DAY",64:"Post-Exam Review & Reflection",65:"Security+ Overview & Domains",66:"Domain Mapping to Your Background",67:"Week 9 Review & Planning",
  68:"Security+ Study Schedule",69:"Prof Messer SY0-701 — Threats",70:"Prof Messer — Architecture",71:"Prof Messer — Implementation",72:"Practice Questions Set 1",73:"Practice Questions Set 2",74:"Domain Gap Analysis",75:"Phase 3 Review",
  76:"Threats Domain — Malware Types",77:"Social Engineering Techniques",78:"Application & Network Attacks",79:"Vulnerability Scanning Methods",80:"Penetration Testing Concepts",81:"Risk Management Basics",82:"Week 11 Review",
  83:"Network Security Concepts",84:"Zero Trust Architecture",85:"Cryptography Fundamentals",86:"PKI, Certs & Digital Signatures",87:"Security Protocols (TLS, SSH)",88:"Cloud Security Architecture",89:"Week 12 Review",
  90:"Incident Response Process",91:"Digital Forensics Basics",92:"SIEM & Log Analysis Lab",93:"Blue Team Labs Online",94:"Disaster Recovery & BCP",95:"Compliance, GRC & Frameworks",96:"Week 13 Review",
  97:"🔥 Full Mock Exam 1",98:"🔥 Full Mock Exam 2",99:"🔥 Full Mock Exam 3",100:"🏆 COMPTIA SECURITY+ EXAM DAY"
};

const TOPIC_TAGS = {
  1:"aws",2:"aws",3:"aws",4:"aws",5:"ec2",6:"s3",7:"review",
  8:"iam",9:"iam",10:"iam",11:"iam",12:"iam",13:"iam",14:"review",
  15:"vpc",16:"vpc",17:"vpc",18:"vpc",19:"vpc",20:"vpc",21:"review",
  22:"s3",23:"s3",24:"ec2",25:"storage",26:"rds",27:"lambda",28:"iac",29:"billing",30:"review",
  31:"threat",32:"owasp",33:"cloud",34:"data",35:"attack",36:"threat",37:"review",
  38:"monitoring",39:"monitoring",40:"guardduty",41:"compliance",42:"security",43:"siem",44:"review",
  45:"lab",46:"iam",47:"lab",48:"lab",49:"tool",50:"reference",51:"review",
  52:"exam",53:"exam",54:"exam",55:"exam",56:"exam",57:"exam",58:"exam",59:"rest",60:"review",
  61:"exam",62:"exam",63:"EXAM DAY",64:"review",65:"sec+",66:"sec+",67:"review",
  68:"sec+",69:"sec+",70:"sec+",71:"sec+",72:"practice",73:"practice",74:"analysis",75:"review",
  76:"threat",77:"social",78:"attack",79:"vuln",80:"pentest",81:"risk",82:"review",
  83:"network",84:"zerotrust",85:"crypto",86:"pki",87:"protocols",88:"architecture",89:"review",
  90:"ir",91:"forensics",92:"siem",93:"lab",94:"dr",95:"grc",96:"review",
  97:"MOCK EXAM",98:"MOCK EXAM",99:"MOCK EXAM",100:"EXAM DAY"
};

const MILESTONES = [
  {at:1,  emoji:"🚀",title:"Journey Begins!",        msg:"Day 1 done. You've started what most people only talk about.",                xp:50},
  {at:7,  emoji:"📅",title:"First Week Done!",        msg:"7 days straight. Consistency is your superpower.",                           xp:100},
  {at:10, emoji:"💪",title:"10 Days Strong!",         msg:"Top 10% just by showing up consistently.",                                   xp:150},
  {at:14, emoji:"🔥",title:"Two Weeks!",              msg:"IAM fundamentals down. You understand cloud identity now.",                  xp:200},
  {at:25, emoji:"⚡",title:"Quarter Way!",            msg:"25 days. Most of Cloud Fundamentals is behind you.",                        xp:250},
  {at:30, emoji:"🎓",title:"Phase 1 Complete!",       msg:"Cloud Fundamentals done. AWS CCP prep starts NOW.",                         xp:400},
  {at:50, emoji:"🔥",title:"Halfway There!",          msg:"50 days done. You're a different person than Day 1 you.",                   xp:500},
  {at:60, emoji:"🌩️",title:"Phase 2 Complete!",      msg:"Deep dive done. You know how to attack and defend cloud.",                  xp:600},
  {at:63, emoji:"🎯",title:"AWS CCP Exam Day!",       msg:"63 days of work built toward this moment. Go get it.",                     xp:700},
  {at:75, emoji:"🌉",title:"Bridge Phase Done!",      msg:"AWS certified. Security+ is next. The hardest part is behind you.",        xp:800},
  {at:90, emoji:"🏃",title:"Final Stretch!",          msg:"10 days left. Everything is in reach.",                                     xp:900},
  {at:100,emoji:"🏆",title:"100 DAYS COMPLETE!",     msg:"You did it. CompTIA Security+ certified. Career changed forever.",          xp:1000},
];

const XP_RANKS = [
  {min:0,    name:"Cloud Novice",      icon:"☁️",  color:"#64748b"},
  {min:200,  name:"Cloud Apprentice",  icon:"🌤️", color:"#60a5fa"},
  {min:500,  name:"Security Scout",    icon:"🔍",  color:"#34d399"},
  {min:900,  name:"Cloud Defender",    icon:"🛡️", color:"#a78bfa"},
  {min:1400, name:"Threat Hunter",     icon:"⚔️", color:"#fbbf24"},
  {min:2000, name:"Cloud Guardian",    icon:"🌩️", color:"#f87171"},
  {min:2800, name:"Security Architect",icon:"🏰",  color:"#ec4899"},
  {min:4000, name:"Cloud Sovereign",   icon:"👑",  color:"#fde68a"},
];

const QUOTES_BY_STATUS = {
  behind: [
    "Behind schedule is just a sign you're human. One day at a time.",
    "You haven't failed. You paused. There's a difference. Start again today.",
    "Every missed day is a lesson in what NOT to skip tomorrow.",
    "Consistency over intensity. One day done beats seven days planned.",
  ],
  ontrack: [
    "You're right on pace. This is what discipline looks like.",
    "On track and building momentum. Don't stop now.",
    "Day by day, you're becoming someone employers will fight over.",
    "Steady wins the race. You're exactly where you need to be.",
  ],
  ahead: [
    "You're ahead of schedule — this is rare. Keep that energy.",
    "Ahead of the curve, literally. The compound effect is working.",
    "Your future self is already proud of what you're doing.",
    "Extra days in the bank. That's competitive advantage building.",
  ],
  general: [
    "Your Kali skills + cloud knowledge = a rare combo employers pay for.",
    "Security+ on a fresher resume is not common. Make it yours.",
    "CloudGoat today. Cloud Security Engineer tomorrow.",
    "The AI boom runs on cloud. Cloud security is the foundation.",
    "100 days is all it takes to completely change your career trajectory.",
  ]
};

const RESOURCES = [
  {title:"PHASE 1 & 2 — Cloud Fundamentals + Security", color:"#60a5fa", items:[
    {name:"AWS Skill Builder",           url:"https://skillbuilder.aws",                                                           what:"Cloud Practitioner Essentials (official)",         cost:"free",  stars:5, tip:"Start here. Best quality official content.", tags:["aws","ccp"]},
    {name:"TryHackMe — Cloud Path",      url:"https://tryhackme.com/path/outline/cloud",                                           what:"Hands-on AWS, cloud security, IAM labs",           cost:"free",  stars:5, tip:"Best for your Kali background — practical labs", tags:["hands-on","aws"]},
    {name:"FreeCodeCamp AWS (YouTube)",  url:"https://www.youtube.com/watch?v=ubCNZFQZZWg",                                        what:"Full 14-hour AWS Beginner to Pro video",           cost:"free",  stars:4, tip:"Best single-video AWS intro.", tags:["aws","video"]},
    {name:"CloudGoat (Rhino Security)",  url:"https://github.com/RhinoSecurityLabs/cloudgoat",                                     what:"Deliberately vulnerable AWS environment",          cost:"free",  stars:5, tip:"Like DVWA but for AWS.", tags:["hands-on","attack"]},
    {name:"HackTricks Cloud",            url:"https://cloud.hacktricks.xyz",                                                       what:"Complete cloud attack techniques & reference",     cost:"free",  stars:4, tip:"Bookmark this. You'll use it every week.", tags:["reference","attack"]},
    {name:"AWS Security Whitepapers",    url:"https://aws.amazon.com/security/security-learning/",                                  what:"Official AWS Security Best Practices PDFs",        cost:"free",  stars:4, tip:"Read: 'AWS Security Best Practices' PDF first", tags:["aws","reading"]},
    {name:"Pacu — AWS Exploitation",     url:"https://github.com/RhinoSecurityLabs/pacu",                                          what:"Post-exploitation framework for AWS",              cost:"free",  stars:4, tip:"Install during Week 7.", tags:["tool","attack"]},
    {name:"CloudSploit (Aqua Security)", url:"https://github.com/aquasecurity/cloudsploit",                                        what:"Automated cloud misconfiguration scanner",         cost:"free",  stars:3, tip:"Run against your test AWS account.", tags:["tool","scanner"]},
  ]},
  {title:"AWS CCP EXAM PREP", color:"#34d399", items:[
    {name:"AWS Exam Readiness (Official)",    url:"https://aws.amazon.com/certification/certification-prep/",                      what:"Official CCP exam prep & practice questions",     cost:"free",  stars:5, tip:"Do this in the last 2 weeks before exam", tags:["ccp","exam"]},
    {name:"Tutorials Dojo — CCP Cheat Sheets",url:"https://tutorialsdojo.com/aws-cheat-sheets/",                                   what:"Best cheat sheets for every AWS service",         cost:"free",  stars:5, tip:"Print these. Study them before sleep.", tags:["ccp","reference"]},
    {name:"ExamTopics AWS CCP",               url:"https://www.examtopics.com/exams/amazon/aws-certified-cloud-practitioner/",     what:"1000+ community practice questions",              cost:"free",  stars:4, tip:"Read every discussion — they're gold", tags:["ccp","practice"]},
    {name:"Andrew Brown — CCP Full Course",   url:"https://www.youtube.com/watch?v=3hLmDS179YE",                                   what:"14-hour AWS CCP prep on FreeCodeCamp",            cost:"free",  stars:5, tip:"Best free CCP exam prep video. 1.25x speed.", tags:["ccp","video"]},
    {name:"AWS Well-Architected Framework",   url:"https://aws.amazon.com/architecture/well-architected/",                         what:"Official AWS architectural best practices",        cost:"free",  stars:4, tip:"Understand the 6 pillars — always in CCP exam", tags:["ccp","aws"]},
  ]},
  {title:"COMPTIA SECURITY+ PREP", color:"#f87171", items:[
    {name:"Professor Messer SY0-701 (FREE)",  url:"https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/",          what:"Complete free Security+ video course",            cost:"free",  stars:5, tip:"This alone is enough for Security+.", tags:["sec+","video"]},
    {name:"Professor Messer Practice Tests",  url:"https://www.professormesser.com/sy0-701-practice-exams/",                       what:"Free + paid practice questions",                  cost:"free+paid",stars:5, tip:"Very high quality. Free questions sufficient to start.", tags:["sec+","practice"]},
    {name:"ExamTopics Security+ SY0-701",     url:"https://www.examtopics.com/exams/comptia/sy0-701/",                             what:"1000+ community questions with discussion",       cost:"free",  stars:4, tip:"Read ALL discussions. Community catches wrong answers.", tags:["sec+","practice"]},
    {name:"Blue Team Labs Online",            url:"https://blueteamlabs.online",                                                   what:"Practical SOC, forensics, defensive labs",        cost:"free",  stars:4, tip:"Do 2-3 labs/week during Phase 4.", tags:["hands-on","defense"]},
    {name:"Jason Dion's Security+ (Udemy)",   url:"https://www.udemy.com/course/securityplus/",                                    what:"Top-rated Security+ course",                     cost:"paid ~₹500",stars:5, tip:"Best paid option. Wait for Udemy sale.", tags:["sec+","video"]},
  ]},
  {title:"BONUS — Career Building", color:"#a78bfa", items:[
    {name:"GitHub — Portfolio",       url:"https://github.com",                                                                    what:"Upload CloudGoat writeups, scripts, lab notes",   cost:"free",  stars:5, tip:"1 repo/week minimum. Employers WILL check.", tags:["career","portfolio"]},
    {name:"LinkedIn",                 url:"https://linkedin.com",                                                                   what:"Update profile with certs, share learnings",     cost:"free",  stars:5, tip:"Post 1 thing you learned each week.", tags:["career","networking"]},
    {name:"TCM Security YouTube",     url:"https://www.youtube.com/@TCMSecurityAcademy",                                           what:"Practical security and cloud security videos",    cost:"free",  stars:4, tip:"Follow Heath Adams. Great supplement.", tags:["video","security"]},
    {name:"Hashnode",                 url:"https://hashnode.com",                                                                   what:"Write about what you learn (1 article/week)",    cost:"free",  stars:4, tip:"Writing = best way to solidify knowledge.", tags:["career","writing"]},
    {name:"Cloud Security Alliance",  url:"https://cloudsecurityalliance.org/research/guidance",                                   what:"CSA Cloud Security Guidance documents",           cost:"free",  stars:4, tip:"Download CSA Cloud Controls Matrix — great for interviews", tags:["reference","career"]},
  ]},
];

const CERTS = [
  {name:"AWS Cloud Practitioner (CLF-C02)", cost:"$100",   diff:"Easy-Med",  time:"30–45d",  job:4,cloud:5,verdict:"✅ DO FIRST",  vtype:"do",   url:"https://aws.amazon.com/certification/certified-cloud-practitioner/",    reason:"Perfect entry point. 100% achievable in 60 days from zero. Best ROI for time invested."},
  {name:"CompTIA Security+ SY0-701",        cost:"$370",   diff:"Medium",    time:"45–60d",  job:5,cloud:4,verdict:"✅ DO SECOND", vtype:"do",   url:"https://www.comptia.org/certifications/security",                        reason:"Most employer-recognized entry cert. Every job listing asks for it."},
  {name:"ISC² CC",                          cost:"$199",   diff:"Easy",      time:"20–30d",  job:4,cloud:3,verdict:"✅ OPTIONAL",  vtype:"do",   url:"https://www.isc2.org/certifications/cc",                                 reason:"Good backup if budget is tight. ISC² brand is globally trusted."},
  {name:"AWS Security Specialty",           cost:"$300",   diff:"Hard",      time:"6+ mo",   job:5,cloud:5,verdict:"❌ NOT YET",   vtype:"skip", url:"https://aws.amazon.com/certification/certified-security-specialty/",    reason:"Requires 2+ years cloud experience. Year 2 goal minimum."},
  {name:"CEH",                              cost:"$950+",  diff:"Medium",    time:"60–90d",  job:3,cloud:2,verdict:"❌ SKIP IT",   vtype:"skip", url:"https://www.eccouncil.org/train-certify/certified-ethical-hacker-ceh/", reason:"Overpriced, outdated, poor employer respect. Very poor ROI."},
  {name:"eJPT (eLearnSecurity)",            cost:"$200",   diff:"Easy-Med",  time:"30d",     job:4,cloud:2,verdict:"⚡ LATER",     vtype:"later",url:"https://elearnsecurity.com/product/ejpt-certification/",                reason:"Great practical cert but pentesting-focused. Get after landing a job."},
  {name:"Google Cloud ACE",                 cost:"$200",   diff:"Medium",    time:"45–60d",  job:3,cloud:4,verdict:"⚡ ALT",       vtype:"later",url:"https://cloud.google.com/learn/certification/cloud-engineer",            reason:"If target company uses GCP. AWS CCP has 3x market coverage though."},
  {name:"Azure Fundamentals AZ-900",        cost:"$165",   diff:"Easy",      time:"20–30d",  job:3,cloud:3,verdict:"⚡ BONUS",     vtype:"later",url:"https://learn.microsoft.com/en-us/certifications/azure-fundamentals/",  reason:"Quick win if you have spare time. Good for Microsoft ecosystem companies."},
];

const CAREER_ROLES = [
  {icon:"🔎",title:"Cloud Security Analyst",        sal:"₹5–8 LPA",         skills:"IAM, SIEM, Cloud Config Review, GuardDuty",  helps:"Your direct target role after this roadmap",              link:"https://www.linkedin.com/jobs/cloud-security-analyst-jobs/"},
  {icon:"🖥️",title:"SOC Analyst (Cloud)",          sal:"₹4–7 LPA",         skills:"Threat Detection, AWS/Azure, Log Analysis",   helps:"Security+ covers SOC skills deeply — high demand",        link:"https://www.linkedin.com/jobs/soc-analyst-jobs/"},
  {icon:"⚔️",title:"Junior Penetration Tester",    sal:"₹4–8 LPA",         skills:"Kali, Burp Suite, Cloud APIs, Recon",          helps:"Your Kali skills + cloud knowledge = rare combo",         link:"https://www.linkedin.com/jobs/junior-penetration-tester-jobs/"},
  {icon:"🛡️",title:"Information Security Analyst", sal:"₹5–9 LPA",         skills:"Risk Assessment, Compliance, Controls",        helps:"Security+ GRC domain maps directly to this role",         link:"https://www.linkedin.com/jobs/information-security-analyst-jobs/"},
  {icon:"☁️",title:"Cloud Security Engineer",      sal:"₹8–15 LPA (1–2yr)", skills:"Terraform, DevSecOps, IAM, CSPM Tools",       helps:"This is your 2-year career goal. Build toward it.",       link:"https://www.linkedin.com/jobs/cloud-security-engineer-jobs/"},
  {icon:"🔬",title:"Security Consultant (Junior)",  sal:"₹5–9 LPA",         skills:"Risk Assessment, Audits, Client Reporting",   helps:"Security+ + communication skills = consulting path",      link:"https://www.linkedin.com/jobs/security-consultant-jobs/"},
];