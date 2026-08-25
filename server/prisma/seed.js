import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// Load environments
dotenv.config()

const prisma = new PrismaClient()

// ─── Helpers ────────────────────────────────────────────────────────────────

async function upsertUser({ email, name, role, professionalTitle }) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { user: existing, created: false }

  const passwordHash = await bcrypt.hash('Password123!', 10)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, status: 'ACTIVE', professionalTitle }
  })
  return { user, created: true }
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@freelancehub.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin123!'
  console.log(`[Seed] Checking admin account: ${email}`)

  const existingAdmin = await prisma.user.findUnique({ where: { email } })
  if (existingAdmin) {
    console.log(`[Seed] Admin already exists (id: ${existingAdmin.id}). Skipping.`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const admin = await prisma.user.create({
    data: { name: 'System Administrator', email, passwordHash, role: 'ADMIN', status: 'ACTIVE' }
  })
  console.log(`[Seed] Admin created (id: ${admin.id})`)
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────

const CUSTOMERS = [
  { name: 'Yash Aher', email: 'yash@gmail.com', bio: 'Tech entrepreneur from Pune building a SaaS HR product.', companyName: 'AherTech Solutions', location: 'Pune, Maharashtra' },
  { name: 'Ananya Krishnamurthy', email: 'ananya.krishnamurthy@brightwave.in', bio: 'Co-founder of a Bengaluru-based edtech startup focused on vernacular learning.', companyName: 'BrightWave Edtech Pvt. Ltd.', location: 'Bengaluru, Karnataka' },
  { name: 'Rohit Deshmukh', email: 'rohit.deshmukh@infralogix.in', bio: 'Operations head at a logistics firm looking for ERP customisations.', companyName: 'InfraLogix India', location: 'Nagpur, Maharashtra' },
  { name: 'Priya Nair', email: 'priya.nair@greenleaf.co.in', bio: 'Founder of an organic food brand expanding its D2C e-commerce presence.', companyName: 'GreenLeaf Organics', location: 'Kochi, Kerala' },
  { name: 'Vikram Choudhary', email: 'vikram.choudhary@trendsetters.in', bio: 'Marketing head at a fast-growing fashion startup in Jaipur.', companyName: 'TrendSetters Fashion House', location: 'Jaipur, Rajasthan' },
  { name: 'Meera Pillai', email: 'meera.pillai@ayurwellness.in', bio: 'CEO of an Ayurvedic wellness brand looking for digital marketing support.', companyName: 'AyurWellness Pvt. Ltd.', location: 'Thrissur, Kerala' },
  { name: 'Siddharth Kapoor', email: 'siddharth.kapoor@bluechipinvest.co.in', bio: 'Founder of a SEBI-registered investment advisory with 12 years in finance.', companyName: 'BlueChip Invest Advisory', location: 'Mumbai, Maharashtra' },
  { name: 'Divya Ramachandran', email: 'divya.ramachandran@sparklearn.in', bio: 'Academic director at an online coaching institute for competitive exams.', companyName: 'SparkLearn Institute', location: 'Chennai, Tamil Nadu' },
  { name: 'Arjun Mehta', email: 'arjun.mehta@nexusprop.in', bio: 'Real estate developer digitising property listings and lead management.', companyName: 'Nexus Properties Pvt. Ltd.', location: 'Ahmedabad, Gujarat' },
  { name: 'Sunita Agarwal', email: 'sunita.agarwal@craftsbyhand.in', bio: 'Owner of a handloom and handicrafts export business seeking an e-commerce site.', companyName: 'CraftsByHand Exports', location: 'Varanasi, Uttar Pradesh' },
  { name: 'Kiran Reddy', email: 'kiran.reddy@pharmabridge.in', bio: 'Director at a pharma distribution firm upgrading their inventory management.', companyName: 'PharmaBridge Distributors', location: 'Hyderabad, Telangana' },
  { name: 'Neha Joshi', email: 'neha.joshi@studioneha.in', bio: 'Founder of a boutique interior design studio in Pune.', companyName: 'Studio Neha Designs', location: 'Pune, Maharashtra' },
  { name: 'Rahul Bhatia', email: 'rahul.bhatia@cloudqube.in', bio: 'CTO of a cloud services startup seeking experienced DevOps freelancers.', companyName: 'CloudQube Technologies', location: 'Delhi, NCR' },
  { name: 'Anjali Sharma', email: 'anjali.sharma@mediawala.in', bio: 'Content production head at a regional OTT platform.', companyName: 'MediaWala Entertainment', location: 'Noida, Uttar Pradesh' },
  { name: 'Gaurav Tiwari', email: 'gaurav.tiwari@agritech.farm', bio: 'Co-founder of an agritech startup connecting farmers to urban buyers.', companyName: 'AgroLink Agritech', location: 'Lucknow, Uttar Pradesh' },
  { name: 'Lakshmi Venkatesh', email: 'lakshmi.venkatesh@silkroute.in', bio: 'Owner of a silk saree export firm seeking a bilingual website.', companyName: 'SilkRoute Exports Pvt. Ltd.', location: 'Mysuru, Karnataka' },
  { name: 'Manish Shah', email: 'manish.shah@diamonddisplay.in', bio: 'Director of a diamond jewellery retail chain looking for an inventory app.', companyName: 'Diamond Display Jewellers', location: 'Surat, Gujarat' },
  { name: 'Pooja Kulkarni', email: 'pooja.kulkarni@flavourfusion.in', bio: 'Chef-entrepreneur running a cloud kitchen expanding to food delivery apps.', companyName: 'FlavourFusion Cloud Kitchen', location: 'Nashik, Maharashtra' },
  { name: 'Amit Banerjee', email: 'amit.banerjee@calcuttatech.in', bio: 'Product manager at a Kolkata-based fintech startup.', companyName: 'CalcuttaTech Finserv', location: 'Kolkata, West Bengal' },
  { name: 'Surekha Rao', email: 'surekha.rao@visakhalogistics.in', bio: 'Operations manager at a port logistics company digitising their workflow.', companyName: 'Visakha Port Logistics', location: 'Visakhapatnam, Andhra Pradesh' },
  { name: 'Deepak Singhania', email: 'deepak.singhania@royalmarble.in', bio: 'Owner of a marble and granite export business based in Rajasthan.', companyName: 'Royal Marble & Granite', location: 'Jodhpur, Rajasthan' },
  { name: 'Smita Patil', email: 'smita.patil@healthroots.in', bio: 'Nutritionist building a subscription wellness app for corporate employees.', companyName: 'HealthRoots Wellness', location: 'Pune, Maharashtra' },
  { name: 'Vishal Mishra', email: 'vishal.mishra@edgerealty.in', bio: 'Real estate agent needing a CRM and automated lead follow-up system.', companyName: 'Edge Realty Services', location: 'Bhopal, Madhya Pradesh' },
  { name: 'Kavitha Subramanian', email: 'kavitha.sub@textilesouth.in', bio: 'Founder of a south Indian textile brand expanding online.', companyName: 'TextileSouth Pvt. Ltd.', location: 'Coimbatore, Tamil Nadu' },
  { name: 'Rajat Khanna', email: 'rajat.khanna@delhidining.in', bio: 'Restaurateur managing five restaurant locations across Delhi NCR.', companyName: 'Delhi Dining Group', location: 'Delhi, NCR' },
  { name: 'Nandini Bose', email: 'nandini.bose@artisancraft.in', bio: 'Founder of a handmade jewellery brand selling on Etsy and seeking a dedicated site.', companyName: 'Artisan & Craft', location: 'Kolkata, West Bengal' },
  { name: 'Suraj Deshpande', email: 'suraj.deshpande@autocarepune.in', bio: 'Owner of a multi-brand car service centre building an online booking platform.', companyName: 'AutoCare Pune', location: 'Pune, Maharashtra' },
  { name: 'Riya Malhotra', email: 'riya.malhotra@modehaus.in', bio: 'Fashion blogger turned founder of a curated luxury fashion platform.', companyName: 'ModeHaus', location: 'Mumbai, Maharashtra' },
  { name: 'Tarun Gupta', email: 'tarun.gupta@indiatelecom.in', bio: 'IT head at a mid-size telecom infrastructure company.', companyName: 'India Telecom Infrastructure', location: 'Gurgaon, Haryana' },
  { name: 'Bhavna Patel', email: 'bhavna.patel@solarplus.in', bio: 'Director of a solar energy solutions company building a customer portal.', companyName: 'SolarPlus Energy Pvt. Ltd.', location: 'Vadodara, Gujarat' },
  { name: 'Chetan Nayak', email: 'chetan.nayak@tourismkerala.in', bio: 'Tour operator offering curated Kerala backwater and wildlife packages.', companyName: 'Kerala Horizon Tours', location: 'Thiruvananthapuram, Kerala' },
  { name: 'Shweta Iyer', email: 'shweta.iyer@iyerbooks.in', bio: 'Self-published author and content creator needing an author website.', companyName: 'Iyer Books & Content', location: 'Chennai, Tamil Nadu' },
  { name: 'Abhishek Srivastava', email: 'abhishek.srivastava@upbizz.in', bio: 'Co-founder of a regional B2B marketplace for MSME suppliers in UP.', companyName: 'UPBizz Marketplace', location: 'Kanpur, Uttar Pradesh' },
  { name: 'Monika Saini', email: 'monika.saini@pinturaarts.in', bio: 'Art gallery owner seeking a digital gallery and online sales platform.', companyName: 'Pintura Arts Gallery', location: 'Jaipur, Rajasthan' },
  { name: 'Sandeep Verma', email: 'sandeep.verma@medpulse.in', bio: 'Managing director of a chain of diagnostic labs wanting a patient portal.', companyName: 'MedPulse Diagnostics', location: 'Agra, Uttar Pradesh' },
  { name: 'Ritika Bahl', email: 'ritika.bahl@luxurystay.in', bio: 'Owner of a boutique heritage hotel needing a direct booking engine.', companyName: 'LuxuryStay Hotels', location: 'Shimla, Himachal Pradesh' },
  { name: 'Pranav Kulkarni', email: 'pranav.kulkarni@cybersecin.in', bio: 'Founder of a cybersecurity consulting firm seeking a client dashboard.', companyName: 'CyberSec India', location: 'Bengaluru, Karnataka' },
  { name: 'Harsha Reddy', email: 'harsha.reddy@grainmarket.in', bio: 'Grain trader digitising commodity procurement and billing.', companyName: 'GrainMarket India', location: 'Guntur, Andhra Pradesh' },
  { name: 'Pallavi Ghosh', email: 'pallavi.ghosh@creativekolkata.in', bio: 'Creative director at a Kolkata-based branding agency.', companyName: 'Creative Kolkata Studio', location: 'Kolkata, West Bengal' },
  { name: 'Vivek Kapila', email: 'vivek.kapila@smartgrid.in', bio: 'Head of product at a smart energy metering company.', companyName: 'SmartGrid Technologies', location: 'Gurgaon, Haryana' },
  { name: 'Rupali Tendulkar', email: 'rupali.tendulkar@saffronspice.in', bio: 'Owner of an online gourmet spice brand with pan-India delivery.', companyName: 'Saffron Spice Co.', location: 'Mumbai, Maharashtra' },
  { name: 'Kunal Saxena', email: 'kunal.saxena@pixelpitch.in', bio: 'Founder of a startup pitching analytics and investor presentation tool.', companyName: 'PixelPitch Analytics', location: 'Delhi, NCR' },
  { name: 'Swati Naik', email: 'swati.naik@floralframe.in', bio: 'Floral designer expanding her event decoration business with an online booking system.', companyName: 'FloralFrame Events', location: 'Nashik, Maharashtra' },
  { name: 'Yuvraj Singh', email: 'yuvraj.singh@punjabicouture.in', bio: 'Fashion designer running a Punjabi ethnic wear brand.', companyName: 'Punjabi Couture House', location: 'Amritsar, Punjab' },
  { name: 'Charulata Mukherjee', email: 'charulata.mukherjee@baulguru.in', bio: 'Music producer and event organiser managing Baul and folk music tours.', companyName: 'BaulGuru Productions', location: 'Kolkata, West Bengal' },
  { name: 'Mohit Aggarwal', email: 'mohit.aggarwal@eprintx.in', bio: 'Founder of a digital print-on-demand platform for personalised gifting.', companyName: 'ePrintX', location: 'Delhi, NCR' },
  { name: 'Deeksha Rajan', email: 'deeksha.rajan@southernsweets.in', bio: 'Owner of a traditional south Indian sweets brand expanding to e-commerce.', companyName: 'Southern Sweets Co.', location: 'Madurai, Tamil Nadu' },
  { name: 'Nikhil Jain', email: 'nikhil.jain@gemstoneraj.in', bio: 'Gemstone dealer in Jaipur building an authenticated B2B trading platform.', companyName: 'GemstoneRaj', location: 'Jaipur, Rajasthan' },
  { name: 'Tanya Mehrotra', email: 'tanya.mehrotra@yogawave.in', bio: 'Certified yoga instructor launching a subscription-based online yoga platform.', companyName: 'YogaWave Online Studio', location: 'Rishikesh, Uttarakhand' },
  { name: 'Prashant Dange', email: 'prashant.dange@steelfab.in', bio: 'MD of a steel fabrication unit seeking a custom production-tracking app.', companyName: 'SteelFab Engineering', location: 'Nagpur, Maharashtra' },
  { name: 'Aditi Saxena', email: 'aditi.saxena@storymint.in', bio: "Children's book author and illustrator looking for a digital storefront.", companyName: 'StoryMint Publications', location: 'Lucknow, Uttar Pradesh' }
]

// ─── FREELANCERS ─────────────────────────────────────────────────────────────

const FREELANCERS = [
  { name: 'Shubham Shinde', email: 'shubham@gmail.com', professionalTitle: 'Full Stack Developer', bio: 'MERN stack developer with 4 years of experience building scalable web apps. Delivered 30+ projects for clients across India and Southeast Asia.', hourlyRate: 1800, experienceLevel: 'INTERMEDIATE', location: 'Pune, Maharashtra', availability: 'FULL_TIME' },
  { name: 'Aryan Trivedi', email: 'aryan.trivedi@freelancehub.dev', professionalTitle: 'Frontend Developer', bio: 'React.js specialist with an eye for pixel-perfect UI. 3 years crafting responsive, accessible interfaces for startups and enterprise clients.', hourlyRate: 1400, experienceLevel: 'INTERMEDIATE', location: 'Ahmedabad, Gujarat', availability: 'FULL_TIME' },
  { name: 'Sneha Kulkarni', email: 'sneha.kulkarni@freelancehub.dev', professionalTitle: 'UI/UX Designer', bio: 'Google-certified UX designer focused on user research and information architecture. Prototyping expert in Figma and Adobe XD with 5 years experience.', hourlyRate: 1600, experienceLevel: 'INTERMEDIATE', location: 'Bengaluru, Karnataka', availability: 'FULL_TIME' },
  { name: 'Rahul Pandey', email: 'rahul.pandey@freelancehub.dev', professionalTitle: 'Backend Developer', bio: 'Node.js and Python backend engineer with deep expertise in REST and GraphQL APIs, PostgreSQL, MongoDB. 6 years building high-throughput fintech systems.', hourlyRate: 2200, experienceLevel: 'EXPERT', location: 'Hyderabad, Telangana', availability: 'PART_TIME' },
  { name: 'Pooja Menon', email: 'pooja.menon@freelancehub.dev', professionalTitle: 'Mobile App Developer', bio: 'Flutter and React Native developer building cross-platform apps. Published 8 apps on Play Store and App Store with combined 50k+ downloads.', hourlyRate: 2000, experienceLevel: 'INTERMEDIATE', location: 'Kochi, Kerala', availability: 'FULL_TIME' },
  { name: 'Vivek Nambiar', email: 'vivek.nambiar@freelancehub.dev', professionalTitle: 'Cloud Engineer', bio: 'AWS Solutions Architect Associate certified. Specialises in serverless architectures, CI/CD pipelines, and infrastructure-as-code with Terraform.', hourlyRate: 2800, experienceLevel: 'EXPERT', location: 'Chennai, Tamil Nadu', availability: 'PART_TIME' },
  { name: 'Aishwarya Bhatt', email: 'aishwarya.bhatt@freelancehub.dev', professionalTitle: 'Graphic Designer', bio: 'Brand identity and visual communication designer with 7 years creating logos, packaging, and marketing collateral for Indian and global brands.', hourlyRate: 1200, experienceLevel: 'EXPERT', location: 'Mumbai, Maharashtra', availability: 'FULL_TIME' },
  { name: 'Tanmay Iyer', email: 'tanmay.iyer@freelancehub.dev', professionalTitle: 'Data Analyst', bio: 'Data professional with expertise in Python, SQL, Power BI, and Tableau. Turned raw data into actionable insights for 15+ FMCG and retail companies.', hourlyRate: 1700, experienceLevel: 'INTERMEDIATE', location: 'Bengaluru, Karnataka', availability: 'FULL_TIME' },
  { name: 'Priyanka Dubey', email: 'priyanka.dubey@freelancehub.dev', professionalTitle: 'Digital Marketer', bio: 'Performance marketing specialist managing Google Ads, Meta Ads, and SEO for D2C brands. Managed ad budgets exceeding Rs. 50 lakh per month.', hourlyRate: 1300, experienceLevel: 'INTERMEDIATE', location: 'Delhi, NCR', availability: 'FULL_TIME' },
  { name: 'Mohit Rajput', email: 'mohit.rajput@freelancehub.dev', professionalTitle: 'DevOps Engineer', bio: 'Kubernetes and Docker expert. Designed and managed multi-cluster EKS environments and automated deployments for SaaS products. CKA certified.', hourlyRate: 3000, experienceLevel: 'EXPERT', location: 'Noida, Uttar Pradesh', availability: 'PART_TIME' },
  { name: 'Swapna Reddy', email: 'swapna.reddy@freelancehub.dev', professionalTitle: 'Content Writer', bio: 'SEO-driven content strategist and long-form writer for SaaS, healthtech, and edtech sectors. 500+ published articles and white papers.', hourlyRate: 900, experienceLevel: 'INTERMEDIATE', location: 'Hyderabad, Telangana', availability: 'FULL_TIME' },
  { name: 'Karthik Sundar', email: 'karthik.sundar@freelancehub.dev', professionalTitle: 'Machine Learning Engineer', bio: 'ML engineer with expertise in NLP, computer vision, and recommendation systems. Built production ML pipelines on GCP for major e-commerce clients.', hourlyRate: 3500, experienceLevel: 'EXPERT', location: 'Chennai, Tamil Nadu', availability: 'PART_TIME' },
  { name: 'Vaibhav Joshi', email: 'vaibhav.joshi@freelancehub.dev', professionalTitle: 'WordPress Developer', bio: 'Custom WordPress theme and plugin developer. Built 80+ websites for SMEs, NGOs, and educational institutions across India.', hourlyRate: 800, experienceLevel: 'ENTRY', location: 'Jaipur, Rajasthan', availability: 'FULL_TIME' },
  { name: 'Nilufar Shaikh', email: 'nilufar.shaikh@freelancehub.dev', professionalTitle: 'E-commerce Specialist', bio: 'Shopify and WooCommerce expert. Manages end-to-end store setup, product listings, payment integration, and conversion optimisation for retail brands.', hourlyRate: 1100, experienceLevel: 'INTERMEDIATE', location: 'Surat, Gujarat', availability: 'FULL_TIME' },
  { name: 'Saurabh Ghosh', email: 'saurabh.ghosh@freelancehub.dev', professionalTitle: 'Video Editor', bio: 'Premiere Pro and After Effects wizard creating reels, explainer videos, and branded content for YouTube channels and OTT productions.', hourlyRate: 1000, experienceLevel: 'INTERMEDIATE', location: 'Kolkata, West Bengal', availability: 'FULL_TIME' },
  { name: 'Harini Chandrasekaran', email: 'harini.chandrasekaran@freelancehub.dev', professionalTitle: 'Cybersecurity Consultant', bio: 'OSCP-certified penetration tester conducting VAPT for fintech and healthcare platforms. Helped 20+ firms achieve ISO 27001 compliance.', hourlyRate: 4000, experienceLevel: 'EXPERT', location: 'Bengaluru, Karnataka', availability: 'PART_TIME' },
  { name: 'Jayesh Patil', email: 'jayesh.patil@freelancehub.dev', professionalTitle: 'Android Developer', bio: 'Native Android developer (Kotlin/Java) building fintech and healthcare apps. 5 years experience with complex integrations including UPI and Aadhaar APIs.', hourlyRate: 2100, experienceLevel: 'INTERMEDIATE', location: 'Nashik, Maharashtra', availability: 'FULL_TIME' },
  { name: 'Deepa Krishnan', email: 'deepa.krishnan@freelancehub.dev', professionalTitle: 'Business Analyst', bio: 'BA with 8 years bridging technical and business teams. Specialises in requirement gathering, user stories, and process mapping for ERP and CRM implementations.', hourlyRate: 2000, experienceLevel: 'EXPERT', location: 'Chennai, Tamil Nadu', availability: 'PART_TIME' },
  { name: 'Ankur Sinha', email: 'ankur.sinha@freelancehub.dev', professionalTitle: 'iOS Developer', bio: 'Swift and SwiftUI developer with 4 apps on the App Store. Strong in MVVM architecture, Core Data, and HealthKit integrations.', hourlyRate: 2400, experienceLevel: 'INTERMEDIATE', location: 'Patna, Bihar', availability: 'FULL_TIME' },
  { name: 'Rekha Nair', email: 'rekha.nair@freelancehub.dev', professionalTitle: 'Social Media Manager', bio: 'Managed Instagram, LinkedIn, and Twitter growth for 30+ brands across lifestyle, food, and B2B SaaS niches. Grew accounts from 0 to 100k+ followers.', hourlyRate: 750, experienceLevel: 'ENTRY', location: 'Thiruvananthapuram, Kerala', availability: 'FULL_TIME' },
  { name: 'Sumit Chaudhary', email: 'sumit.chaudhary@freelancehub.dev', professionalTitle: 'Database Administrator', bio: 'Oracle and MySQL DBA with 9 years managing mission-critical databases for banking and insurance sector clients. Expert in performance tuning and disaster recovery.', hourlyRate: 2600, experienceLevel: 'EXPERT', location: 'Lucknow, Uttar Pradesh', availability: 'PART_TIME' }
]

// ─── SKILLS ──────────────────────────────────────────────────────────────────
// 35 skills relevant to the Indian freelance tech & creative market

const SKILL_NAMES = [
  'React.js',
  'Node.js',
  'Python',
  'Java',
  'C++',
  'TypeScript',
  'Next.js',
  'Express.js',
  'MySQL',
  'MongoDB',
  'PostgreSQL',
  'REST API Design',
  'GraphQL',
  'Figma',
  'Adobe XD',
  'UI/UX Design',
  'Graphic Design',
  'Video Editing',
  'After Effects',
  'SEO',
  'Digital Marketing',
  'Google Ads',
  'Content Writing',
  'Data Analysis',
  'Power BI',
  'Tableau',
  'Machine Learning',
  'TensorFlow',
  'AWS',
  'Docker',
  'Kubernetes',
  'Terraform',
  'Android Development',
  'Flutter',
  'Swift',
  'WordPress',
  'Shopify',
  'Cybersecurity',
  'Penetration Testing',
  'Linux'
]

// Maps freelancer email → list of skill names they should have
// Skills must be a subset of SKILL_NAMES above
const FREELANCER_SKILLS = {
  // Shubham Shinde — Full Stack Developer
  'shubham@gmail.com': [
    'React.js', 'Node.js', 'Express.js', 'MongoDB', 'MySQL', 'REST API Design', 'TypeScript'
  ],
  // Aryan Trivedi — Frontend Developer
  'aryan.trivedi@freelancehub.dev': [
    'React.js', 'Next.js', 'TypeScript', 'Figma', 'UI/UX Design'
  ],
  // Sneha Kulkarni — UI/UX Designer
  'sneha.kulkarni@freelancehub.dev': [
    'Figma', 'Adobe XD', 'UI/UX Design', 'Graphic Design'
  ],
  // Rahul Pandey — Backend Developer
  'rahul.pandey@freelancehub.dev': [
    'Node.js', 'Python', 'REST API Design', 'GraphQL', 'PostgreSQL', 'MongoDB', 'Express.js'
  ],
  // Pooja Menon — Mobile App Developer
  'pooja.menon@freelancehub.dev': [
    'Flutter', 'React.js', 'Android Development', 'REST API Design'
  ],
  // Vivek Nambiar — Cloud Engineer
  'vivek.nambiar@freelancehub.dev': [
    'AWS', 'Terraform', 'Docker', 'Kubernetes', 'Linux', 'Python'
  ],
  // Aishwarya Bhatt — Graphic Designer
  'aishwarya.bhatt@freelancehub.dev': [
    'Graphic Design', 'Adobe XD', 'Figma', 'Video Editing', 'After Effects'
  ],
  // Tanmay Iyer — Data Analyst
  'tanmay.iyer@freelancehub.dev': [
    'Python', 'MySQL', 'PostgreSQL', 'Power BI', 'Tableau', 'Data Analysis'
  ],
  // Priyanka Dubey — Digital Marketer
  'priyanka.dubey@freelancehub.dev': [
    'Digital Marketing', 'SEO', 'Google Ads', 'Content Writing'
  ],
  // Mohit Rajput — DevOps Engineer
  'mohit.rajput@freelancehub.dev': [
    'Docker', 'Kubernetes', 'AWS', 'Terraform', 'Linux', 'Python'
  ],
  // Swapna Reddy — Content Writer
  'swapna.reddy@freelancehub.dev': [
    'Content Writing', 'SEO', 'Digital Marketing'
  ],
  // Karthik Sundar — Machine Learning Engineer
  'karthik.sundar@freelancehub.dev': [
    'Machine Learning', 'TensorFlow', 'Python', 'Data Analysis', 'PostgreSQL'
  ],
  // Vaibhav Joshi — WordPress Developer
  'vaibhav.joshi@freelancehub.dev': [
    'WordPress', 'MySQL', 'Graphic Design', 'SEO'
  ],
  // Nilufar Shaikh — E-commerce Specialist
  'nilufar.shaikh@freelancehub.dev': [
    'Shopify', 'WordPress', 'SEO', 'Digital Marketing', 'Google Ads'
  ],
  // Saurabh Ghosh — Video Editor
  'saurabh.ghosh@freelancehub.dev': [
    'Video Editing', 'After Effects', 'Graphic Design'
  ],
  // Harini Chandrasekaran — Cybersecurity Consultant
  'harini.chandrasekaran@freelancehub.dev': [
    'Cybersecurity', 'Penetration Testing', 'Linux', 'Python'
  ],
  // Jayesh Patil — Android Developer
  'jayesh.patil@freelancehub.dev': [
    'Android Development', 'Java', 'REST API Design', 'MySQL'
  ],
  // Deepa Krishnan — Business Analyst
  'deepa.krishnan@freelancehub.dev': [
    'Data Analysis', 'MySQL', 'Power BI', 'REST API Design'
  ],
  // Ankur Sinha — iOS Developer
  'ankur.sinha@freelancehub.dev': [
    'Swift', 'REST API Design', 'MySQL'
  ],
  // Rekha Nair — Social Media Manager
  'rekha.nair@freelancehub.dev': [
    'Digital Marketing', 'Content Writing', 'SEO', 'Google Ads'
  ],
  // Sumit Chaudhary — Database Administrator
  'sumit.chaudhary@freelancehub.dev': [
    'MySQL', 'PostgreSQL', 'Linux', 'Python'
  ]
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

const CATEGORY_NAMES = [
  'Web Development',
  'Mobile App Development',
  'UI/UX Design',
  'Graphic Design',
  'Data Science & AI',
  'Cloud & DevOps',
  'Digital Marketing',
  'Content Writing',
  'Video & Animation',
  'E-commerce',
  'Software & IT',
  'Business & Consulting'
]

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
// clientEmail → which customer owns the project
// categoryName → must exist in CATEGORY_NAMES
// skills → must exist in SKILL_NAMES

const PROJECTS = [
  // ── Web Development ──────────────────────────────────────────────────────
  {
    clientEmail: 'riya.malhotra@modehaus.in',
    categoryName: 'Web Development',
    title: 'Luxury Fashion E-commerce Portal',
    description: 'Build a full-featured luxury fashion e-commerce portal for ModeHaus with product catalogues, wishlists, Razorpay payment gateway integration, and a curated editorial blog section. The site must be mobile-first, support Hindi and English, and load within 2 seconds on Indian 4G networks.',
    budget: 85000,
    deadline: '2026-11-15',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['React.js', 'Node.js', 'MySQL', 'REST API Design']
  },
  {
    clientEmail: 'suraj.deshpande@autocarepune.in',
    categoryName: 'Web Development',
    title: 'Online Vehicle Service Booking Platform',
    description: 'Develop a web platform for AutoCare Pune allowing customers to book car service slots, select service packages, receive SMS reminders, and track service status in real time. Admin panel required for managing appointments and technician assignments.',
    budget: 55000,
    deadline: '2026-10-30',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['React.js', 'Node.js', 'MySQL', 'Express.js']
  },
  {
    clientEmail: 'ananya.krishnamurthy@brightwave.in',
    categoryName: 'Web Development',
    title: 'Vernacular Learning Management System',
    description: 'Build a scalable LMS for BrightWave Edtech supporting live classes, recorded lessons, multilingual content in Hindi, Marathi and Tamil, student progress tracking, and certificate generation. Must integrate with Zoom API for live sessions.',
    budget: 120000,
    deadline: '2026-12-31',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['React.js', 'Node.js', 'PostgreSQL', 'REST API Design', 'TypeScript']
  },
  {
    clientEmail: 'rahul.bhatia@cloudqube.in',
    categoryName: 'Web Development',
    title: 'SaaS Customer Dashboard with Usage Analytics',
    description: 'Design and develop a multi-tenant SaaS dashboard for CloudQube Technologies showing API usage, billing summaries, service health metrics, and subscription management. Must support role-based access for end customers and internal admins.',
    budget: 95000,
    deadline: '2026-11-01',
    experienceLevel: 'EXPERT',
    status: 'IN_PROGRESS',
    skills: ['React.js', 'Node.js', 'PostgreSQL', 'REST API Design', 'TypeScript']
  },
  {
    clientEmail: 'gaurav.tiwari@agritech.farm',
    categoryName: 'Web Development',
    title: 'Farmer-to-Buyer B2B Marketplace',
    description: 'Build a web marketplace for AgroLink Agritech connecting farmers in rural Maharashtra and UP with urban grocery wholesalers. Requires crop listing, bulk order management, MSP-aware pricing engine, and regional language support.',
    budget: 75000,
    deadline: '2026-11-20',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['React.js', 'Node.js', 'MySQL', 'REST API Design']
  },
  {
    clientEmail: 'pranav.kulkarni@cybersecin.in',
    categoryName: 'Web Development',
    title: 'Client Portal for Cybersecurity Firm',
    description: 'Develop a secure client portal for CyberSec India where clients can view VAPT reports, track remediation status, download compliance certificates, and raise support tickets. Must enforce 2FA and session timeout policies.',
    budget: 68000,
    deadline: '2026-10-15',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['React.js', 'Node.js', 'PostgreSQL', 'REST API Design']
  },
  {
    clientEmail: 'sandeep.verma@medpulse.in',
    categoryName: 'Web Development',
    title: 'Patient Portal for Diagnostic Chain',
    description: 'Build a web-based patient portal for MedPulse Diagnostics where patients can book tests online, view reports, receive WhatsApp notifications, and manage family health records. Aadhaar-based login preferred.',
    budget: 72000,
    deadline: '2026-12-01',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['React.js', 'Node.js', 'MySQL', 'REST API Design']
  },
  {
    clientEmail: 'abhishek.srivastava@upbizz.in',
    categoryName: 'Web Development',
    title: 'B2B MSME Supplier Marketplace',
    description: 'Build a regional B2B web marketplace for UPBizz connecting MSME manufacturers in Kanpur and Agra with distributors. Features: supplier verification, RFQ system, logistics integration, GST invoice generation.',
    budget: 90000,
    deadline: '2026-12-15',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['React.js', 'Node.js', 'MySQL', 'REST API Design', 'TypeScript']
  },
  {
    clientEmail: 'vivek.kapila@smartgrid.in',
    categoryName: 'Web Development',
    title: 'Smart Energy Meter Management Portal',
    description: 'Develop a web portal for SmartGrid Technologies allowing utility companies to manage smart meter deployments, view consumption data, detect anomalies, and generate billing reports. Real-time data via WebSockets.',
    budget: 110000,
    deadline: '2027-01-31',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['React.js', 'Node.js', 'PostgreSQL', 'REST API Design', 'TypeScript']
  },
  {
    clientEmail: 'ritika.bahl@luxurystay.in',
    categoryName: 'Web Development',
    title: 'Heritage Hotel Direct Booking Engine',
    description: 'Build a direct booking engine for LuxuryStay Hotels in Shimla with room availability calendar, seasonal pricing engine, Razorpay integration, automated confirmation emails, and an admin panel for reservation management.',
    budget: 48000,
    deadline: '2026-10-01',
    experienceLevel: 'INTERMEDIATE',
    status: 'COMPLETED',
    skills: ['React.js', 'Node.js', 'MySQL']
  },

  // ── Mobile App Development ────────────────────────────────────────────────
  {
    clientEmail: 'pooja.kulkarni@flavourfusion.in',
    categoryName: 'Mobile App Development',
    title: 'Cloud Kitchen Food Ordering App',
    description: 'Build a cross-platform mobile app for FlavourFusion Cloud Kitchen with live menu, real-time order tracking, loyalty points, and push notifications. Must integrate with Zomato-style delivery partner API and support UPI, card, and COD payment modes.',
    budget: 65000,
    deadline: '2026-11-10',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Flutter', 'REST API Design', 'MySQL']
  },
  {
    clientEmail: 'kiran.reddy@pharmabridge.in',
    categoryName: 'Mobile App Development',
    title: 'Pharma Inventory Management Mobile App',
    description: 'Develop an Android app for PharmaBridge Distributors to manage drug inventory, scan barcodes, generate purchase orders, track expiry dates, and produce daily stock reports. Must sync with the existing ERP via REST APIs.',
    budget: 55000,
    deadline: '2026-10-25',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Android Development', 'Java', 'REST API Design', 'MySQL']
  },
  {
    clientEmail: 'chetan.nayak@tourismkerala.in',
    categoryName: 'Mobile App Development',
    title: 'Kerala Tourism Experience App',
    description: 'Build a travel app for Kerala Horizon Tours showcasing curated backwater and wildlife packages, offline maps, local guide booking, itinerary management, and multilingual support in Malayalam and English.',
    budget: 58000,
    deadline: '2026-11-30',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Flutter', 'REST API Design', 'MySQL']
  },
  {
    clientEmail: 'smita.patil@healthroots.in',
    categoryName: 'Mobile App Development',
    title: 'Corporate Wellness Subscription App',
    description: 'Develop a mobile wellness app for HealthRoots Wellness offering personalised meal plans, hydration reminders, yoga videos, BMI tracking, and monthly health reports. Corporate HR dashboard for bulk employee management.',
    budget: 70000,
    deadline: '2026-12-15',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Flutter', 'REST API Design', 'MySQL']
  },
  {
    clientEmail: 'deepak.singhania@royalmarble.in',
    categoryName: 'Mobile App Development',
    title: 'B2B Marble Catalogue and Order App',
    description: 'Build an Android app for Royal Marble & Granite enabling export clients to browse high-resolution stone catalogues, request samples, place bulk orders, and track shipments. Offline mode required for trade show use.',
    budget: 42000,
    deadline: '2026-10-20',
    experienceLevel: 'ENTRY',
    status: 'OPEN',
    skills: ['Android Development', 'Java', 'REST API Design']
  },
  {
    clientEmail: 'tanya.mehrotra@yogawave.in',
    categoryName: 'Mobile App Development',
    title: 'Subscription-Based Online Yoga App',
    description: 'Develop a cross-platform yoga app for YogaWave Online Studio with live class scheduling, session recordings library, guided meditation, instructor booking, subscription billing via Razorpay, and community chat.',
    budget: 62000,
    deadline: '2026-11-25',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Flutter', 'REST API Design', 'MySQL']
  },

  // ── UI/UX Design ─────────────────────────────────────────────────────────
  {
    clientEmail: 'siddharth.kapoor@bluechipinvest.co.in',
    categoryName: 'UI/UX Design',
    title: 'Investment Advisory App UI Redesign',
    description: 'Redesign the mobile and web UI for BlueChip Invest Advisory platform. Must convey trust and professionalism. Deliverables: user research report, wireframes, high-fidelity Figma prototype, design system, and developer handoff specs.',
    budget: 40000,
    deadline: '2026-10-10',
    experienceLevel: 'EXPERT',
    status: 'IN_PROGRESS',
    skills: ['Figma', 'UI/UX Design', 'Adobe XD']
  },
  {
    clientEmail: 'neha.joshi@studioneha.in',
    categoryName: 'UI/UX Design',
    title: 'Interior Design Studio Website UX',
    description: 'Design the user experience for Studio Neha Designs website showcasing portfolio projects, enabling online consultations booking, and a mood-board creation tool. Aesthetic must reflect contemporary Indian interior design sensibilities.',
    budget: 28000,
    deadline: '2026-09-30',
    experienceLevel: 'INTERMEDIATE',
    status: 'COMPLETED',
    skills: ['Figma', 'UI/UX Design']
  },
  {
    clientEmail: 'priya.nair@greenleaf.co.in',
    categoryName: 'UI/UX Design',
    title: 'Organic Brand Mobile App UX Overhaul',
    description: 'Conduct a full UX audit and redesign of the GreenLeaf Organics mobile shopping app. Focus on reducing checkout abandonment, improving product discovery with AI-powered recommendations, and a fresh earth-toned visual identity.',
    budget: 35000,
    deadline: '2026-10-20',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Figma', 'UI/UX Design', 'Adobe XD']
  },
  {
    clientEmail: 'anjali.sharma@mediawala.in',
    categoryName: 'UI/UX Design',
    title: 'OTT Streaming Platform UI Design',
    description: 'Design the UI for MediaWala Entertainment OTT platform targeting tier-2 Indian cities. Requires homepage, content discovery page, video player, subscription flow, and responsive layouts for TV, tablet and mobile.',
    budget: 52000,
    deadline: '2026-11-05',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['Figma', 'UI/UX Design', 'Adobe XD']
  },
  {
    clientEmail: 'kunal.saxena@pixelpitch.in',
    categoryName: 'UI/UX Design',
    title: 'Startup Analytics Dashboard UI Design',
    description: 'Design a clean, data-dense analytics dashboard UI for PixelPitch Analytics used by startup founders to visualise KPIs, investor metrics, and runway. Deliverables: Figma file with auto-layout components and interactive prototype.',
    budget: 32000,
    deadline: '2026-10-01',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Figma', 'UI/UX Design']
  },

  // ── Graphic Design ───────────────────────────────────────────────────────
  {
    clientEmail: 'yuvraj.singh@punjabicouture.in',
    categoryName: 'Graphic Design',
    title: 'Ethnic Fashion Brand Identity Package',
    description: 'Create a complete brand identity for Punjabi Couture House: logo, colour palette, typography guide, swing tags, packaging, shopping bag design, and a social media template kit. Must reflect the vibrancy of Punjabi heritage and contemporary fashion.',
    budget: 25000,
    deadline: '2026-09-25',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Graphic Design', 'Adobe XD']
  },
  {
    clientEmail: 'mohit.aggarwal@eprintx.in',
    categoryName: 'Graphic Design',
    title: 'Print-on-Demand Product Templates Library',
    description: 'Design a library of 50 customisable product templates for ePrintX covering mugs, t-shirts, phone covers, notebooks, and posters. Templates must be export-ready in high resolution and follow Indian gifting occasions and festivals.',
    budget: 30000,
    deadline: '2026-10-30',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Graphic Design']
  },
  {
    clientEmail: 'rupali.tendulkar@saffronspice.in',
    categoryName: 'Graphic Design',
    title: 'Gourmet Spice Brand Packaging Design',
    description: 'Design premium packaging for Saffron Spice Co. product line covering 15 SKUs including spice pouches, gift boxes, and travel-size tins. Visual language should convey artisan quality and Indian origin. Print-ready files required.',
    budget: 22000,
    deadline: '2026-09-20',
    experienceLevel: 'INTERMEDIATE',
    status: 'COMPLETED',
    skills: ['Graphic Design']
  },
  {
    clientEmail: 'nandini.bose@artisancraft.in',
    categoryName: 'Graphic Design',
    title: 'Handmade Jewellery Brand Visual Identity',
    description: 'Create a premium visual identity for Artisan & Craft handmade jewellery brand: logo, brand book, product photography style guide, Etsy banner templates, and Instagram highlight cover designs.',
    budget: 18000,
    deadline: '2026-09-15',
    experienceLevel: 'ENTRY',
    status: 'COMPLETED',
    skills: ['Graphic Design']
  },

  // ── Data Science & AI ────────────────────────────────────────────────────
  {
    clientEmail: 'tarun.gupta@indiatelecom.in',
    categoryName: 'Data Science & AI',
    title: 'Telecom Network Anomaly Detection System',
    description: 'Build an ML-powered anomaly detection system for India Telecom Infrastructure to identify network faults, predict outages 30 minutes in advance, and auto-escalate alerts. Must process 1 million events per hour from network probes.',
    budget: 150000,
    deadline: '2027-02-28',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['Machine Learning', 'TensorFlow', 'Python', 'PostgreSQL']
  },
  {
    clientEmail: 'manish.shah@diamonddisplay.in',
    categoryName: 'Data Science & AI',
    title: 'Jewellery Inventory Demand Forecasting',
    description: 'Develop a demand forecasting model for Diamond Display Jewellers to predict seasonal stock requirements across their 12 retail locations. Input: 3 years of POS data. Output: weekly restocking recommendations per store per SKU.',
    budget: 80000,
    deadline: '2026-12-01',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['Machine Learning', 'Python', 'Data Analysis', 'Power BI']
  },
  {
    clientEmail: 'amit.banerjee@calcuttatech.in',
    categoryName: 'Data Science & AI',
    title: 'Fintech Credit Risk Scoring Model',
    description: 'Build a credit risk scoring ML model for CalcuttaTech Finserv using alternative data sources including GST filing history, UPI transaction patterns, and social signals. Must output an explainable risk score with confidence intervals.',
    budget: 130000,
    deadline: '2027-01-15',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['Machine Learning', 'TensorFlow', 'Python', 'PostgreSQL', 'Data Analysis']
  },
  {
    clientEmail: 'harsha.reddy@grainmarket.in',
    categoryName: 'Data Science & AI',
    title: 'Commodity Price Prediction Dashboard',
    description: 'Build a Power BI-backed dashboard with a Python ML model predicting wheat, rice, and maize price movements for GrainMarket India based on mandi arrival data, rainfall indices, and MSP notifications.',
    budget: 60000,
    deadline: '2026-11-01',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Python', 'Data Analysis', 'Power BI', 'Machine Learning']
  },
  {
    clientEmail: 'vivek.kapila@smartgrid.in',
    categoryName: 'Data Science & AI',
    title: 'Energy Consumption Pattern Analysis',
    description: 'Analyse energy consumption data from 50,000 smart meters for SmartGrid Technologies to identify peak load patterns, detect meter tampering, and segment consumers into behavioural clusters for targeted conservation programs.',
    budget: 70000,
    deadline: '2026-11-30',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['Python', 'Data Analysis', 'Machine Learning', 'PostgreSQL']
  },

  // ── Cloud & DevOps ───────────────────────────────────────────────────────
  {
    clientEmail: 'rahul.bhatia@cloudqube.in',
    categoryName: 'Cloud & DevOps',
    title: 'Multi-Region AWS Infrastructure Setup',
    description: 'Design and implement a multi-region AWS infrastructure for CloudQube Technologies covering Mumbai and Singapore regions. Deliverables: Terraform IaC scripts, VPC setup, EKS cluster, RDS Multi-AZ, CloudFront CDN, and full runbook.',
    budget: 100000,
    deadline: '2026-11-15',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['AWS', 'Terraform', 'Docker', 'Kubernetes', 'Linux']
  },
  {
    clientEmail: 'pranav.kulkarni@cybersecin.in',
    categoryName: 'Cloud & DevOps',
    title: 'CI/CD Pipeline for Security Tool Suite',
    description: 'Set up a complete CI/CD pipeline for CyberSec India internal security tooling using GitHub Actions, Docker, and Kubernetes on AWS EKS. Must include automated SAST/DAST scans, secrets management via AWS Secrets Manager, and blue-green deployments.',
    budget: 75000,
    deadline: '2026-10-31',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Linux']
  },
  {
    clientEmail: 'tarun.gupta@indiatelecom.in',
    categoryName: 'Cloud & DevOps',
    title: 'Telecom On-Premise to Cloud Migration',
    description: 'Migrate 30 legacy on-premise applications for India Telecom Infrastructure to AWS cloud with zero downtime. Strategy: lift-and-shift Phase 1, re-platforming Phase 2. Deliverables: migration assessment, execution runbooks, post-migration monitoring setup.',
    budget: 200000,
    deadline: '2027-03-31',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['AWS', 'Terraform', 'Docker', 'Linux']
  },
  {
    clientEmail: 'bhavna.patel@solarplus.in',
    categoryName: 'Cloud & DevOps',
    title: 'IoT Device Management on AWS',
    description: 'Set up AWS IoT Core infrastructure for SolarPlus Energy to manage 10,000 solar inverter IoT devices. Includes device provisioning, MQTT message routing, time-series storage on DynamoDB, and CloudWatch alerting dashboard.',
    budget: 85000,
    deadline: '2026-12-15',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['AWS', 'Terraform', 'Linux', 'Python']
  },

  // ── Digital Marketing ────────────────────────────────────────────────────
  {
    clientEmail: 'vikram.choudhary@trendsetters.in',
    categoryName: 'Digital Marketing',
    title: 'Fashion Brand Google & Meta Ads Campaign',
    description: 'Plan and execute a 3-month paid marketing campaign for TrendSetters Fashion House covering Google Shopping Ads, Meta catalogue ads, and Instagram Reels promotions targeting urban Indian women aged 18–35. Budget: ₹8 lakh. KPI: 3x ROAS.',
    budget: 35000,
    deadline: '2026-10-01',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Digital Marketing', 'Google Ads', 'SEO']
  },
  {
    clientEmail: 'meera.pillai@ayurwellness.in',
    categoryName: 'Digital Marketing',
    title: 'Ayurveda Brand Digital Marketing Strategy',
    description: 'Develop a 6-month digital marketing strategy for AyurWellness Pvt. Ltd. covering SEO, content marketing, influencer outreach, YouTube channel launch, and WhatsApp Business campaigns. Focus on tier-2 cities in Kerala and Tamil Nadu.',
    budget: 28000,
    deadline: '2026-10-15',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Digital Marketing', 'SEO', 'Content Writing']
  },
  {
    clientEmail: 'deeksha.rajan@southernsweets.in',
    categoryName: 'Digital Marketing',
    title: 'Festival Season E-commerce Marketing Push',
    description: 'Execute a Diwali and Christmas seasonal marketing campaign for Southern Sweets Co. covering Swiggy Instamart promotions, Google Local Ads, WhatsApp bulk messaging, and Instagram content calendar. Target: 40% revenue growth over last festive season.',
    budget: 22000,
    deadline: '2026-10-05',
    experienceLevel: 'ENTRY',
    status: 'OPEN',
    skills: ['Digital Marketing', 'Google Ads', 'SEO']
  },
  {
    clientEmail: 'rupali.tendulkar@saffronspice.in',
    categoryName: 'Digital Marketing',
    title: 'Spice Brand Amazon & Organic SEO Campaign',
    description: 'Improve Amazon product ranking and organic SEO for Saffron Spice Co. across 15 product pages. Deliverables: keyword research, Amazon A+ content, backend search terms, on-page SEO optimisation for the brand website, and monthly reporting.',
    budget: 18000,
    deadline: '2026-10-10',
    experienceLevel: 'ENTRY',
    status: 'COMPLETED',
    skills: ['SEO', 'Digital Marketing', 'Content Writing']
  },
  {
    clientEmail: 'monika.saini@pinturaarts.in',
    categoryName: 'Digital Marketing',
    title: 'Art Gallery Online Presence Growth',
    description: 'Build and execute a digital presence strategy for Pintura Arts Gallery on Instagram, Pinterest, and Google. Includes gallery content calendar, influencer partnerships, Google My Business optimisation, and a monthly email newsletter.',
    budget: 15000,
    deadline: '2026-10-01',
    experienceLevel: 'ENTRY',
    status: 'OPEN',
    skills: ['Digital Marketing', 'SEO', 'Content Writing']
  },

  // ── Content Writing ──────────────────────────────────────────────────────
  {
    clientEmail: 'shweta.iyer@iyerbooks.in',
    categoryName: 'Content Writing',
    title: 'Author Website Blog Content - 20 Articles',
    description: 'Write 20 SEO-optimised blog articles (1000–1500 words each) for author Shweta Iyer covering topics in Indian fiction, creative writing tips, self-publishing, and Tamil literature. Tone: literary, warm, and conversational.',
    budget: 12000,
    deadline: '2026-10-20',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Content Writing', 'SEO']
  },
  {
    clientEmail: 'meera.pillai@ayurwellness.in',
    categoryName: 'Content Writing',
    title: 'Ayurveda Product Description Copywriting',
    description: 'Write compelling product descriptions for 40 Ayurvedic health products for AyurWellness Pvt. Ltd. Each description must include benefits, ingredients, usage instructions, and SEO-friendly keywords. Must comply with AYUSH advertising guidelines.',
    budget: 16000,
    deadline: '2026-09-30',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Content Writing', 'SEO']
  },
  {
    clientEmail: 'aditi.saxena@storymint.in',
    categoryName: 'Content Writing',
    title: "Children's Book Series Content",
    description: "Write 5 short illustrated children's stories (800–1200 words each) for StoryMint Publications targeting children aged 6–10. Themes: Indian festivals, folk tales, and STEM adventures. Stories must pass a Flesch-Kincaid grade level check.",
    budget: 20000,
    deadline: '2026-10-25',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Content Writing']
  },
  {
    clientEmail: 'charulata.mukherjee@baulguru.in',
    categoryName: 'Content Writing',
    title: 'Folk Music Tour Press Kit & Web Copy',
    description: 'Write a full press kit and website copy for BaulGuru Productions including artist bios, tour programme descriptions, festival pitches, and a bilingual (English/Bengali) about page. Tone: poetic and culturally resonant.',
    budget: 10000,
    deadline: '2026-09-28',
    experienceLevel: 'ENTRY',
    status: 'OPEN',
    skills: ['Content Writing']
  },

  // ── Video & Animation ────────────────────────────────────────────────────
  {
    clientEmail: 'anjali.sharma@mediawala.in',
    categoryName: 'Video & Animation',
    title: 'OTT Platform Promotional Trailer Package',
    description: 'Produce 5 promotional trailers (60–90 seconds each) for MediaWala Entertainment new original web series. Deliverables: motion graphics, colour grading, subtitle integration, and platform-specific exports for YouTube, Instagram and JioCinema.',
    budget: 45000,
    deadline: '2026-10-15',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['Video Editing', 'After Effects']
  },
  {
    clientEmail: 'charulata.mukherjee@baulguru.in',
    categoryName: 'Video & Animation',
    title: 'Folk Music Concert Highlight Reel',
    description: 'Edit a 5-minute concert highlight reel for BaulGuru Productions from 8 hours of multi-camera footage. Include colour grading, audio mixing, animated lower thirds with artist names, and a short 30-second Instagram cut.',
    budget: 18000,
    deadline: '2026-10-05',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Video Editing', 'After Effects']
  },
  {
    clientEmail: 'vikram.choudhary@trendsetters.in',
    categoryName: 'Video & Animation',
    title: 'Fashion Brand Reels Content Package',
    description: 'Produce 12 short-form video reels (15–30 seconds) per month for TrendSetters Fashion House for Instagram and YouTube Shorts. Includes concept ideation, motion text overlays, trending audio integration, and branded end screens.',
    budget: 24000,
    deadline: '2026-10-01',
    experienceLevel: 'INTERMEDIATE',
    status: 'IN_PROGRESS',
    skills: ['Video Editing', 'After Effects', 'Graphic Design']
  },
  {
    clientEmail: 'ananya.krishnamurthy@brightwave.in',
    categoryName: 'Video & Animation',
    title: 'Explainer Videos for Edtech Platform',
    description: 'Produce 10 animated explainer videos (2–3 minutes each) for BrightWave Edtech courses. Topics range from mathematics to Indian history. Style: 2D motion graphics with voiceover. Deliverables: English and Hindi versions of each video.',
    budget: 60000,
    deadline: '2026-11-30',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['Video Editing', 'After Effects', 'Graphic Design']
  },

  // ── E-commerce ───────────────────────────────────────────────────────────
  {
    clientEmail: 'sunita.agarwal@craftsbyhand.in',
    categoryName: 'E-commerce',
    title: 'Handloom Export Shopify Store Setup',
    description: 'Set up and configure a Shopify store for CraftsByHand Exports with 200+ product listings, international shipping configuration, multi-currency support, export compliance pages, and SEO-optimised category pages for US and UK markets.',
    budget: 32000,
    deadline: '2026-10-15',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Shopify', 'SEO']
  },
  {
    clientEmail: 'priya.nair@greenleaf.co.in',
    categoryName: 'E-commerce',
    title: 'Organic Food D2C WooCommerce Store',
    description: 'Build and optimise a WooCommerce store for GreenLeaf Organics with subscription boxes, auto-ship recurring orders, product review integration, loyalty points, and WhatsApp order confirmation. GST-compliant invoicing required.',
    budget: 40000,
    deadline: '2026-11-01',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['WordPress', 'Shopify', 'SEO']
  },
  {
    clientEmail: 'kavitha.sub@textilesouth.in',
    categoryName: 'E-commerce',
    title: 'South Indian Textile Brand Online Store',
    description: 'Launch a WooCommerce store for TextileSouth Pvt. Ltd. with regional language support, saree draping video guides, virtual try-on mockup tool, cash-on-delivery option, and return management portal. PAN India delivery integration required.',
    budget: 38000,
    deadline: '2026-10-30',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['WordPress', 'SEO', 'Digital Marketing']
  },
  {
    clientEmail: 'lakshmi.venkatesh@silkroute.in',
    categoryName: 'E-commerce',
    title: 'Silk Saree Export Bilingual Online Store',
    description: 'Build a bilingual (Kannada + English) Shopify store for SilkRoute Exports Pvt. Ltd. targeted at NRI customers. Includes high-resolution product zoom, fabric comparison tool, bulk order request form, and PayPal + Razorpay integration.',
    budget: 35000,
    deadline: '2026-10-20',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Shopify', 'SEO']
  },
  {
    clientEmail: 'nikhil.jain@gemstoneraj.in',
    categoryName: 'E-commerce',
    title: 'Authenticated Gemstone B2B Trading Platform',
    description: 'Build a Shopify-based B2B platform for GemstoneRaj with gemologist certificate uploads, 360-degree stone videos, bulk pricing tiers, verified buyer onboarding, and wire-transfer payment workflows targeting international gem trade buyers.',
    budget: 55000,
    deadline: '2026-11-15',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['Shopify', 'SEO', 'Digital Marketing']
  },

  // ── Software & IT ────────────────────────────────────────────────────────
  {
    clientEmail: 'rohit.deshmukh@infralogix.in',
    categoryName: 'Software & IT',
    title: 'Logistics ERP Module Customisation',
    description: 'Customise the existing open-source ERP (Odoo) for InfraLogix India by building a custom Fleet Management module covering vehicle scheduling, route optimisation, fuel consumption tracking, and driver performance reports. Python/PostgreSQL backend.',
    budget: 90000,
    deadline: '2026-12-01',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['Python', 'PostgreSQL', 'REST API Design']
  },
  {
    clientEmail: 'prashant.dange@steelfab.in',
    categoryName: 'Software & IT',
    title: 'Production Tracking System for Steel Fabrication',
    description: 'Build a custom production tracking desktop + web application for SteelFab Engineering. Features: job order management, machine utilisation tracking, quality inspection checklists, raw material inventory, and daily production reports.',
    budget: 75000,
    deadline: '2026-11-30',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['React.js', 'Node.js', 'MySQL', 'REST API Design']
  },
  {
    clientEmail: 'vishal.mishra@edgerealty.in',
    categoryName: 'Software & IT',
    title: 'Real Estate CRM with Automated Follow-Up',
    description: 'Develop a custom CRM for Edge Realty Services with automated lead capture from 99acres and MagicBricks, WhatsApp follow-up bot, site visit scheduling, deal pipeline management, and a commission tracker for agents.',
    budget: 65000,
    deadline: '2026-11-15',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['React.js', 'Node.js', 'MySQL', 'REST API Design']
  },
  {
    clientEmail: 'surekha.rao@visakhalogistics.in',
    categoryName: 'Software & IT',
    title: 'Port Logistics Workflow Digitisation',
    description: 'Digitise cargo clearance and vessel scheduling workflows for Visakha Port Logistics. Build a web app replacing paper-based processes with digital forms, role-based approval chains, document management, and EDI integration with shipping lines.',
    budget: 110000,
    deadline: '2027-01-15',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['React.js', 'Node.js', 'PostgreSQL', 'REST API Design']
  },
  {
    clientEmail: 'arjun.mehta@nexusprop.in',
    categoryName: 'Software & IT',
    title: 'Real Estate Property Listing & CRM System',
    description: 'Build a property listing platform and integrated CRM for Nexus Properties Pvt. Ltd. with geo-search, virtual tour embeds, lead scoring, email drip campaigns, and an interactive analytics dashboard for the sales team.',
    budget: 80000,
    deadline: '2026-12-01',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['React.js', 'Node.js', 'MySQL', 'REST API Design']
  },

  // ── Business & Consulting ────────────────────────────────────────────────
  {
    clientEmail: 'siddharth.kapoor@bluechipinvest.co.in',
    categoryName: 'Business & Consulting',
    title: 'Investment Platform Business Requirements Document',
    description: 'Prepare a comprehensive Business Requirements Document (BRD) for BlueChip Invest Advisory platform upgrade. Deliverables: as-is vs to-be process maps, functional and non-functional requirements, SEBI compliance checklist, and UAT test plan.',
    budget: 30000,
    deadline: '2026-10-01',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['Data Analysis', 'REST API Design']
  },
  {
    clientEmail: 'divya.ramachandran@sparklearn.in',
    categoryName: 'Business & Consulting',
    title: 'Edtech Growth Strategy & Market Analysis',
    description: 'Conduct a market analysis and produce a 12-month growth strategy document for SparkLearn Institute covering competitive landscape, student acquisition cost benchmarks, geographic expansion plan, and revenue model optimisation recommendations.',
    budget: 25000,
    deadline: '2026-10-20',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['Data Analysis', 'Power BI']
  },
  {
    clientEmail: 'bhavna.patel@solarplus.in',
    categoryName: 'Business & Consulting',
    title: 'Solar Energy Project Financial Modelling',
    description: 'Build a detailed financial model in Excel/Python for SolarPlus Energy evaluating ROI for C&I rooftop solar projects across Gujarat. Model must include capex/opex breakdown, IRR, payback period, sensitivity analysis, and subsidy impact.',
    budget: 35000,
    deadline: '2026-10-25',
    experienceLevel: 'EXPERT',
    status: 'OPEN',
    skills: ['Data Analysis', 'Python', 'Power BI']
  },
  {
    clientEmail: 'kiran.reddy@pharmabridge.in',
    categoryName: 'Business & Consulting',
    title: 'Pharma Distribution Process Optimisation',
    description: 'Analyse current distribution processes for PharmaBridge Distributors and recommend optimisations to reduce order fulfilment time by 40%. Deliverables: process maps, root cause analysis, SOP documentation, and a KPI tracking dashboard.',
    budget: 28000,
    deadline: '2026-11-01',
    experienceLevel: 'INTERMEDIATE',
    status: 'OPEN',
    skills: ['Data Analysis', 'Power BI']
  }
]

// ─── FREELANCER PORTFOLIOS ───────────────────────────────────────────────────
// 42 realistic portfolio projects (2 per each of the 21 freelancers)

const PORTFOLIO_PROJECTS = [
  // 1. Shubham Shinde (shubham@gmail.com) — Full Stack Developer
  {
    freelancerEmail: 'shubham@gmail.com',
    title: 'QuickMart - Hyperlocal Grocery Delivery Platform',
    description: 'Engineered a full-stack MERN hyperlocal grocery ordering platform for a Pune-based retail chain with real-time stock sync, Razorpay payment processing, and SMS delivery tracking.',
    projectUrl: 'https://github.com/shubham-dev/quickmart-platform',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
    skills: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'REST API Design']
  },
  {
    freelancerEmail: 'shubham@gmail.com',
    title: 'ArogyaCare - Hospital OPD & Bed Management Portal',
    description: 'Built a hospital management portal for a multi-specialty clinic in Mumbai handling OPD token generation, doctor scheduling, and electronic health record storage with MySQL.',
    projectUrl: 'https://github.com/shubham-dev/arogyacare-portal',
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528',
    skills: ['React.js', 'Node.js', 'MySQL', 'TypeScript', 'REST API Design']
  },

  // 2. Aryan Trivedi (aryan.trivedi@freelancehub.dev) — Frontend Developer
  {
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    title: 'FinTrack - Personal Finance & Tax Planning Web App',
    description: 'Developed a high-performance Next.js web application for Indian taxpayers to calculate New vs Old regime liabilities, track mutual fund portfolios, and export ITR summaries.',
    projectUrl: 'https://github.com/aryantrivedi/fintrack-web',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
    skills: ['React.js', 'Next.js', 'TypeScript', 'Figma']
  },
  {
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    title: 'CraftVibe - Handcrafted Decor Brand Front-End',
    description: 'Created a pixel-perfect, accessible e-commerce front-end in Next.js for an artisanal home decor studio in Ahmedabad featuring custom micro-interactions and fast page loads.',
    projectUrl: 'https://github.com/aryantrivedi/craftvibe-store',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38',
    skills: ['React.js', 'Next.js', 'UI/UX Design', 'TypeScript']
  },

  // 3. Sneha Kulkarni (sneha.kulkarni@freelancehub.dev) — UI/UX Designer
  {
    freelancerEmail: 'sneha.kulkarni@freelancehub.dev',
    title: 'KisanMitra - Rural Banking App Design System',
    description: 'Designed a multilingual, high-contrast mobile banking interface and design system in Figma tailored for farmers and rural co-operative bank members across Maharashtra.',
    projectUrl: 'https://figma.com/@snehak/kisanmitra-app',
    imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e',
    skills: ['Figma', 'UI/UX Design', 'Adobe XD']
  },
  {
    freelancerEmail: 'sneha.kulkarni@freelancehub.dev',
    title: 'EduSpark - K-12 Gamified Learning App UX',
    description: 'End-to-end UX research, wireframing, and interactive prototyping for a Bengaluru edtech gamified science learning mobile app with custom badge and mascot illustrations.',
    projectUrl: 'https://figma.com/@snehak/eduspark-ux',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7',
    skills: ['Figma', 'UI/UX Design', 'Graphic Design']
  },

  // 4. Rahul Pandey (rahul.pandey@freelancehub.dev) — Backend Developer
  {
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    title: 'PayBridge - UPI & BBPS Payment Gateway Microservice',
    description: 'Architected high-throughput Node.js microservices processing 5,000+ payment webhooks per minute with Redis caching, PostgreSQL sharding, and automated reconciliation.',
    projectUrl: 'https://github.com/rahulpandey/paybridge-api',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44',
    skills: ['Node.js', 'PostgreSQL', 'REST API Design', 'Express.js']
  },
  {
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    title: 'FleetPulse - Real-time Vehicle Telematics API',
    description: 'Constructed a Python GraphQL API managing GPS streams and engine diagnostics for 10,000+ commercial trucks across western India with MongoDB storage.',
    projectUrl: 'https://github.com/rahulpandey/fleetpulse-telematics',
    imageUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c',
    skills: ['Python', 'GraphQL', 'MongoDB', 'REST API Design']
  },

  // 5. Pooja Menon (pooja.menon@freelancehub.dev) — Mobile App Developer
  {
    freelancerEmail: 'pooja.menon@freelancehub.dev',
    title: 'AyurVeda Connect - Doctor Consultation Flutter App',
    description: 'Built a cross-platform Flutter application for telemedicine consultations, prescription downloads, and herbal medicine delivery across Kerala and Karnataka.',
    projectUrl: 'https://github.com/poojamenon/ayurveda-connect-app',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d',
    skills: ['Flutter', 'Android Development', 'REST API Design']
  },
  {
    freelancerEmail: 'pooja.menon@freelancehub.dev',
    title: 'FitKerala - Community Gym & Habit Tracker',
    description: 'Developed a React Native and Flutter mobile app featuring local gym class bookings, workout logging, and step-count leaderboard integration with Google Fit.',
    projectUrl: 'https://github.com/poojamenon/fitkerala-app',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd',
    skills: ['Flutter', 'React.js', 'REST API Design']
  },

  // 6. Vivek Nambiar (vivek.nambiar@freelancehub.dev) — Cloud Engineer
  {
    freelancerEmail: 'vivek.nambiar@freelancehub.dev',
    title: 'Terraform EKS Multi-Tier Banking Infrastructure',
    description: 'Provisioned multi-region AWS cloud infrastructure with Terraform IaC, Amazon EKS, AWS RDS PostgreSQL Multi-AZ, and strict PCI-DSS compliant IAM security policies.',
    projectUrl: 'https://github.com/viveknambiar/aws-banking-iac',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
    skills: ['AWS', 'Terraform', 'Kubernetes', 'Linux']
  },
  {
    freelancerEmail: 'vivek.nambiar@freelancehub.dev',
    title: 'Automated Serverless Log Aggregation Pipeline',
    description: 'Built an automated Python serverless log parser using AWS Lambda, Kinesis Firehose, and OpenSearch to ingest and analyse 50GB+ daily access logs for a media platform.',
    projectUrl: 'https://github.com/viveknambiar/serverless-log-parser',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
    skills: ['AWS', 'Docker', 'Linux', 'Python']
  },

  // 7. Aishwarya Bhatt (aishwarya.bhatt@freelancehub.dev) — Graphic Designer
  {
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    title: 'VedicPure - Organic Skincare Complete Brand Identity',
    description: 'Crafted complete visual branding for an organic skincare label in Mumbai, including minimalist botanical logo, sustainable packaging designs, and unboxing collateral.',
    projectUrl: 'https://behance.net/gallery/vedicpure-branding',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
    skills: ['Graphic Design', 'Figma', 'Adobe XD']
  },
  {
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    title: 'DesiBites - FMCG Snack Packaging & Animated Promo',
    description: 'Designed pouch packaging for 6 regional snack flavours and produced 3D-styled 15-second After Effects promotional bumper ads for social media launch.',
    projectUrl: 'https://behance.net/gallery/desibites-packaging',
    imageUrl: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8',
    skills: ['Graphic Design', 'Video Editing', 'After Effects']
  },

  // 8. Tanmay Iyer (tanmay.iyer@freelancehub.dev) — Data Analyst
  {
    freelancerEmail: 'tanmay.iyer@freelancehub.dev',
    title: 'RetailPulse - Multi-Outlet FMCG Sales Analytics',
    description: 'Built automated Power BI and SQL dashboards tracking SKU-level revenue, distributor margins, and stock-out alerts across 45 supermarkets in Bengaluru and Chennai.',
    projectUrl: 'https://github.com/tanmayiyer/retailpulse-bi',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df',
    skills: ['Power BI', 'MySQL', 'Data Analysis', 'Python']
  },
  {
    freelancerEmail: 'tanmay.iyer@freelancehub.dev',
    title: 'OmniChannel Customer Segmentation & Churn Dashboard',
    description: 'Implemented RFM customer segmentation and churn hazard analysis in Python and Tableau for an Indian D2C apparel brand with 120,000 active customer records.',
    projectUrl: 'https://github.com/tanmayiyer/customer-churn-tableau',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    skills: ['Tableau', 'PostgreSQL', 'Data Analysis', 'Python']
  },

  // 9. Priyanka Dubey (priyanka.dubey@freelancehub.dev) — Digital Marketer
  {
    freelancerEmail: 'priyanka.dubey@freelancehub.dev',
    title: 'NutriRoots - 4.2x ROAS Performance Marketing Campaign',
    description: 'Managed Google Search, Performance Max, and Meta Advantage+ shopping campaigns for a Delhi D2C health supplements brand, scaling monthly GMV from ₹12L to ₹52L.',
    projectUrl: 'https://priyankadubey.marketing/case-studies/nutriroots',
    imageUrl: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec',
    skills: ['Google Ads', 'Digital Marketing', 'SEO']
  },
  {
    freelancerEmail: 'priyanka.dubey@freelancehub.dev',
    title: 'HomelySpaces - Organic Search Traffic Scaling (0 to 180k)',
    description: 'Devised comprehensive programmatic SEO and content strategy for an Indian home rental startup, ranking 350+ location keywords on Google page 1 in 7 months.',
    projectUrl: 'https://priyankadubey.marketing/case-studies/homelyspaces',
    imageUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a',
    skills: ['SEO', 'Content Writing', 'Digital Marketing']
  },

  // 10. Mohit Rajput (mohit.rajput@freelancehub.dev) — DevOps Engineer
  {
    freelancerEmail: 'mohit.rajput@freelancehub.dev',
    title: 'GitOps Kubernetes Deployment Pipeline with ArgoCD',
    description: 'Implemented production GitOps workflow using ArgoCD, Helm, and GitHub Actions on AWS EKS for an Indian logistics SaaS, slashing deployment rollback time to under 30 seconds.',
    projectUrl: 'https://github.com/mohitrajput/gitops-argocd-eks',
    imageUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Linux']
  },
  {
    freelancerEmail: 'mohit.rajput@freelancehub.dev',
    title: 'Automated Zero-Downtime Blue/Green Deployments',
    description: 'Architected Terraform modules and Docker container automation for zero-downtime Canary and Blue/Green releases supporting 20+ microservices.',
    projectUrl: 'https://github.com/mohitrajput/bluegreen-terraform',
    imageUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb',
    skills: ['Terraform', 'Docker', 'AWS', 'Linux']
  },

  // 11. Swapna Reddy (swapna.reddy@freelancehub.dev) — Content Writer
  {
    freelancerEmail: 'swapna.reddy@freelancehub.dev',
    title: 'Fintech India - 30-Part Demat & Algorithmic Trading Guide',
    description: 'Researched and authored a comprehensive 30-article educational pillar series on SEBI regulations, options trading strategies, and algo backtesting for a Hyderabad fintech.',
    projectUrl: 'https://swapnareddy.contently.com/fintech-trading-series',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a',
    skills: ['Content Writing', 'SEO']
  },
  {
    freelancerEmail: 'swapna.reddy@freelancehub.dev',
    title: 'HealthFirst SaaS - B2B Case Studies & Whitepaper Series',
    description: 'Produced 8 detailed customer transformation case studies and an industry whitepaper on electronic medical records adoption in tier-2 Indian hospitals.',
    projectUrl: 'https://swapnareddy.contently.com/healthfirst-whitepapers',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
    skills: ['Content Writing', 'Digital Marketing']
  },

  // 12. Karthik Sundar (karthik.sundar@freelancehub.dev) — Machine Learning Engineer
  {
    freelancerEmail: 'karthik.sundar@freelancehub.dev',
    title: 'BhasaTranslate - Indic Language Neural Machine Translation',
    description: 'Fine-tuned Transformer models in TensorFlow and Python for Tamil, Telugu, and Hindi translation with 87% BLEU score for e-commerce customer support chat.',
    projectUrl: 'https://github.com/karthiksundar/indic-nmt-model',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
    skills: ['Machine Learning', 'TensorFlow', 'Python']
  },
  {
    freelancerEmail: 'karthik.sundar@freelancehub.dev',
    title: 'AgriYield - Computer Vision Crop Disease Detection',
    description: 'Trained a lightweight YOLOv8 computer vision model classifying 18 common paddy and cotton leaf diseases with 94.6% validation accuracy from mobile photos.',
    projectUrl: 'https://github.com/karthiksundar/crop-disease-cv',
    imageUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff',
    skills: ['Machine Learning', 'Python', 'Data Analysis', 'PostgreSQL']
  },

  // 13. Vaibhav Joshi (vaibhav.joshi@freelancehub.dev) — WordPress Developer
  {
    freelancerEmail: 'vaibhav.joshi@freelancehub.dev',
    title: 'HeritageStays - Custom WordPress Hotel Booking Theme',
    description: 'Developed a bespoke Gutenberg-compatible WordPress theme for a heritage resort chain in Rajasthan with real-time room availability, seasonal tariffs, and Instamojo gateway.',
    projectUrl: 'https://github.com/vaibhavjoshi/heritagestays-theme',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
    skills: ['WordPress', 'MySQL', 'Graphic Design']
  },
  {
    freelancerEmail: 'vaibhav.joshi@freelancehub.dev',
    title: 'JaipurCrafts - WooCommerce Multi-Vendor Handicraft Hub',
    description: 'Engineered a lightweight WooCommerce store handling 1,500+ artisan handicraft products with speed optimisation achieving 95+ Google PageSpeed score.',
    projectUrl: 'https://github.com/vaibhavjoshi/jaipurcrafts-wc',
    imageUrl: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff',
    skills: ['WordPress', 'SEO', 'MySQL']
  },

  // 14. Nilufar Shaikh (nilufar.shaikh@freelancehub.dev) — E-commerce Specialist
  {
    freelancerEmail: 'nilufar.shaikh@freelancehub.dev',
    title: 'SuratSilk - International Shopify Plus Storefront',
    description: 'Configured and launched an international Shopify Plus storefront for a Surat textile exporter with multi-currency checkout, DHL Express automated label printing, and WhatsApp cart recovery.',
    projectUrl: 'https://nilufar-ecommerce.com/case-studies/suratsilk',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da',
    skills: ['Shopify', 'Digital Marketing', 'Google Ads']
  },
  {
    freelancerEmail: 'nilufar.shaikh@freelancehub.dev',
    title: 'GourmetMasala - D2C E-Commerce Conversion Optimization',
    description: 'Redesigned Shopify product landing pages and checkout funnel for a premium spice brand, boosting mobile conversion rate from 1.4% to 3.8% in 60 days.',
    projectUrl: 'https://nilufar-ecommerce.com/case-studies/gourmetmasala',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d',
    skills: ['Shopify', 'WordPress', 'SEO']
  },

  // 15. Saurabh Ghosh (saurabh.ghosh@freelancehub.dev) — Video Editor
  {
    freelancerEmail: 'saurabh.ghosh@freelancehub.dev',
    title: 'Kolkata Chronicle - Documentary Web Series Editing',
    description: 'Lead video editor and colorist for a 4-episode documentary series on historic Kolkata architecture, featuring 4K multi-cam editing, audio sweetening, and archival restoration.',
    projectUrl: 'https://vimeo.com/saurabhghosh/kolkata-chronicle',
    imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d',
    skills: ['Video Editing', 'After Effects']
  },
  {
    freelancerEmail: 'saurabh.ghosh@freelancehub.dev',
    title: 'FinTech Explainer - Kinetic Typography & Motion Graphics',
    description: 'Created high-energy 60-second kinetic typography and 2D character animation explainer videos for an investment app ad campaign across Instagram Reels and YouTube.',
    projectUrl: 'https://vimeo.com/saurabhghosh/fintech-explainer',
    imageUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279',
    skills: ['After Effects', 'Graphic Design', 'Video Editing']
  },

  // 16. Harini Chandrasekaran (harini.chandrasekaran@freelancehub.dev) — Cybersecurity Consultant
  {
    freelancerEmail: 'harini.chandrasekaran@freelancehub.dev',
    title: 'Fintech Core Banking API - Vulnerability Assessment & Pentest',
    description: 'Conducted comprehensive grey-box penetration testing and code review for a Bengaluru neo-banking API, identifying 4 critical business logic vulnerabilities before launch.',
    projectUrl: 'https://harinisecurity.io/reports/neobank-vapt',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
    skills: ['Cybersecurity', 'Penetration Testing', 'Linux']
  },
  {
    freelancerEmail: 'harini.chandrasekaran@freelancehub.dev',
    title: 'Automated DevSecOps Security Scanner Tool',
    description: 'Developed a custom Python and Linux CLI security auditing utility that checks cloud infrastructure and Docker images against OWASP Top 10 and CIS benchmarks.',
    projectUrl: 'https://github.com/harinic/cloud-sec-scanner',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3',
    skills: ['Cybersecurity', 'Linux', 'Python']
  },

  // 17. Jayesh Patil (jayesh.patil@freelancehub.dev) — Android Developer
  {
    freelancerEmail: 'jayesh.patil@freelancehub.dev',
    title: 'GramSeva - Offline-First Rural Panchayat Citizen App',
    description: 'Developed a native Android app (Java & Kotlin) with SQLite local caching enabling rural citizens to submit grievance petitions and check MNREGA muster rolls offline.',
    projectUrl: 'https://github.com/jayeshpatil/gramseva-android',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
    skills: ['Android Development', 'Java', 'MySQL', 'REST API Design']
  },
  {
    freelancerEmail: 'jayesh.patil@freelancehub.dev',
    title: 'NashikAgri - Mandi Live Auction & Bidding App',
    description: 'Built a high-performance native Android application for onion and grape farmers in Nashik to participate in live Mandi price auctions with push notifications.',
    projectUrl: 'https://github.com/jayeshpatil/nashik-agri-mandi',
    imageUrl: 'https://images.unsplash.com/photo-1595079672139-545c02b2912c',
    skills: ['Android Development', 'Java', 'REST API Design']
  },

  // 18. Deepa Krishnan (deepa.krishnan@freelancehub.dev) — Business Analyst
  {
    freelancerEmail: 'deepa.krishnan@freelancehub.dev',
    title: 'Hospitality ERP Transformation & Workflow BRD',
    description: 'Authored 120-page comprehensive Business Requirements Document (BRD) and BPMN 2.0 workflow maps for consolidating 14 hotel properties onto a centralized cloud ERP.',
    projectUrl: 'https://deepakrishnan-consulting.in/projects/hospitality-erp',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
    skills: ['Data Analysis', 'REST API Design', 'MySQL']
  },
  {
    freelancerEmail: 'deepa.krishnan@freelancehub.dev',
    title: 'Supply Chain KPI Scorecard & BI Dashboard',
    description: 'Designed and delivered executive Power BI procurement analytics dashboard for a Chennai automotive ancillary manufacturer, reducing vendor lead time by 18%.',
    projectUrl: 'https://deepakrishnan-consulting.in/projects/supplychain-kpi',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
    skills: ['Power BI', 'Data Analysis', 'MySQL']
  },

  // 19. Ankur Sinha (ankur.sinha@freelancehub.dev) — iOS Developer
  {
    freelancerEmail: 'ankur.sinha@freelancehub.dev',
    title: 'YogaSutra - Guided Asana & Breathwork iOS App',
    description: 'Built an elegant SwiftUI and CoreData iOS application with HealthKit integration, customized audio player for guided meditation, and offline video playback.',
    projectUrl: 'https://github.com/ankursinha/yogasutra-ios',
    imageUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597',
    skills: ['Swift', 'REST API Design']
  },
  {
    freelancerEmail: 'ankur.sinha@freelancehub.dev',
    title: 'PatnaBite - Restaurant Reservation & Table Ordering iOS App',
    description: 'Crafted a native Swift iOS app featuring interactive floor plan table booking, Apple Pay / UPI in-app payments, and kitchen order ticket sync.',
    projectUrl: 'https://github.com/ankursinha/patnabite-ios',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    skills: ['Swift', 'MySQL', 'REST API Design']
  },

  // 20. Rekha Nair (rekha.nair@freelancehub.dev) — Social Media Manager
  {
    freelancerEmail: 'rekha.nair@freelancehub.dev',
    title: 'AyurRoots - 0 to 120k Followers Instagram Growth Campaign',
    description: 'Formulated and executed Instagram organic reels strategy for a Kerala Ayurvedic beauty brand, achieving 4.8M viral impressions and generating ₹18L direct affiliate sales.',
    projectUrl: 'https://rekhanair.social/case-studies/ayurroots',
    imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113',
    skills: ['Digital Marketing', 'Content Writing', 'SEO']
  },
  {
    freelancerEmail: 'rekha.nair@freelancehub.dev',
    title: 'KeralaTravels - Omnichannel Social Media & Influencer Push',
    description: 'Managed influencer trip activations and YouTube / Meta paid promotions for an eco-tourism retreat, doubling direct winter season website bookings.',
    projectUrl: 'https://rekhanair.social/case-studies/keralatravels',
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
    skills: ['Digital Marketing', 'Google Ads', 'Content Writing']
  },

  // 21. Sumit Chaudhary (sumit.chaudhary@freelancehub.dev) — Database Administrator
  {
    freelancerEmail: 'sumit.chaudhary@freelancehub.dev',
    title: 'High-Availability MySQL 8.0 InnoDB Cluster with ProxySQL',
    description: 'Designed and deployed a 3-node MySQL Group Replication cluster with ProxySQL query routing and automated failover handling 12,000 queries per second for an edtech platform.',
    projectUrl: 'https://github.com/sumitchaudhary/mysql-ha-proxysql',
    imageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
    skills: ['MySQL', 'Linux', 'Python']
  },
  {
    freelancerEmail: 'sumit.chaudhary@freelancehub.dev',
    title: 'PostgreSQL Disaster Recovery & Automated WAL Archiving',
    description: 'Configured PostgreSQL Point-In-Time Recovery (PITR) using pgBackRest with encrypted Amazon S3 archiving and sub-5-minute RPO/RTO validation tests.',
    projectUrl: 'https://github.com/sumitchaudhary/pg-disaster-recovery',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
    skills: ['PostgreSQL', 'Linux', 'Python']
  }
]

// ─── PROPOSALS ───────────────────────────────────────────────────────────────
// 126 realistic proposals mapped across marketplace projects

const PROPOSALS = [
  // ── Web Development Projects ─────────────────────────────────────────────
  {
    projectTitle: 'Luxury Fashion E-commerce Portal',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 82000,
    estimatedDays: 30,
    status: 'PENDING',
    coverLetter: 'I have 4+ years of experience building high-performance e-commerce platforms using React, Node.js, and MySQL. I can integrate Razorpay, ensure mobile responsiveness, and deliver a blazing-fast shopping experience.'
  },
  {
    projectTitle: 'Luxury Fashion E-commerce Portal',
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    proposedPrice: 86000,
    estimatedDays: 25,
    status: 'PENDING',
    coverLetter: 'As a Next.js and frontend specialist, I will craft an ultra-fast, visually stunning luxury fashion portal with smooth micro-interactions, bilingual support, and accessible UI.'
  },
  {
    projectTitle: 'Luxury Fashion E-commerce Portal',
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    proposedPrice: 80000,
    estimatedDays: 35,
    status: 'PENDING',
    coverLetter: 'I specialize in robust backend architecture, relational database design with MySQL, and secure RESTful API integration for payment gateways and order processing workflows.'
  },

  {
    projectTitle: 'Online Vehicle Service Booking Platform',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 52000,
    estimatedDays: 20,
    status: 'PENDING',
    coverLetter: 'I have built similar appointment and service booking platforms with real-time status updates, SMS integration, and admin scheduling panels in React and Express.'
  },
  {
    projectTitle: 'Online Vehicle Service Booking Platform',
    freelancerEmail: 'vaibhav.joshi@freelancehub.dev',
    proposedPrice: 48000,
    estimatedDays: 22,
    status: 'PENDING',
    coverLetter: 'I can deliver a clean and intuitive service booking system with automated reminders, service package selectors, and an easy-to-use admin dashboard.'
  },
  {
    projectTitle: 'Online Vehicle Service Booking Platform',
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    proposedPrice: 54000,
    estimatedDays: 18,
    status: 'PENDING',
    coverLetter: 'I will design and build a responsive, fast-loading booking interface with interactive calendar slot selection and customer notification flows.'
  },

  {
    projectTitle: 'Vernacular Learning Management System',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 115000,
    estimatedDays: 45,
    status: 'PENDING',
    coverLetter: 'Experienced in developing scalable edtech platforms with video streaming, multilingual content support (Hindi/Marathi/Tamil), and Zoom API integrations.'
  },
  {
    projectTitle: 'Vernacular Learning Management System',
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    proposedPrice: 118000,
    estimatedDays: 40,
    status: 'PENDING',
    coverLetter: 'I will architect the backend using PostgreSQL and Node.js to handle high concurrency live streaming webhooks, student progress analytics, and automated certification.'
  },
  {
    projectTitle: 'Vernacular Learning Management System',
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    proposedPrice: 120000,
    estimatedDays: 35,
    status: 'PENDING',
    coverLetter: 'I can build the full multilingual frontend with responsive video players, interactive quizzes, and offline course caching support.'
  },

  {
    projectTitle: 'SaaS Customer Dashboard with Usage Analytics',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 92000,
    estimatedDays: 30,
    status: 'ACCEPTED',
    coverLetter: 'I have built multi-tenant SaaS dashboards with role-based access control, subscription billing, and real-time usage graphs using React and TypeScript.'
  },
  {
    projectTitle: 'SaaS Customer Dashboard with Usage Analytics',
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    proposedPrice: 94000,
    estimatedDays: 28,
    status: 'REJECTED',
    coverLetter: 'Expert in designing multi-tenant database schemas in PostgreSQL, API rate limiting, and automated invoice generation microservices.'
  },
  {
    projectTitle: 'SaaS Customer Dashboard with Usage Analytics',
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    proposedPrice: 90000,
    estimatedDays: 25,
    status: 'WITHDRAWN',
    coverLetter: 'I specialize in data-dense dashboard UI/UX with interactive charts, dark mode, and seamless export capabilities in Next.js.'
  },

  {
    projectTitle: 'Farmer-to-Buyer B2B Marketplace',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 72000,
    estimatedDays: 28,
    status: 'PENDING',
    coverLetter: 'I can build this B2B marketplace with crop listing workflows, bulk negotiation features, and regional language UI for agricultural buyers.'
  },
  {
    projectTitle: 'Farmer-to-Buyer B2B Marketplace',
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    proposedPrice: 70000,
    estimatedDays: 30,
    status: 'PENDING',
    coverLetter: 'Experienced in developing high-throughput marketplace APIs with order escrow logic, mandi pricing sync, and GST billing integration.'
  },

  {
    projectTitle: 'Client Portal for Cybersecurity Firm',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 65000,
    estimatedDays: 25,
    status: 'PENDING',
    coverLetter: 'I will develop a hardened client portal with 2FA, session timeout controls, encrypted report downloads, and ticket tracking.'
  },
  {
    projectTitle: 'Client Portal for Cybersecurity Firm',
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    proposedPrice: 66000,
    estimatedDays: 22,
    status: 'PENDING',
    coverLetter: 'I specialize in secure backend architecture, role-based authorization with JWT, and audit logging to meet enterprise security standards.'
  },
  {
    projectTitle: 'Client Portal for Cybersecurity Firm',
    freelancerEmail: 'harini.chandrasekaran@freelancehub.dev',
    proposedPrice: 68000,
    estimatedDays: 20,
    status: 'PENDING',
    coverLetter: 'As a cybersecurity consultant and developer, I understand client reporting workflows and will ensure OWASP compliance and secure document vaults.'
  },

  {
    projectTitle: 'Patient Portal for Diagnostic Chain',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 70000,
    estimatedDays: 26,
    status: 'PENDING',
    coverLetter: 'I have previously developed healthcare web apps with test report downloads, WhatsApp notifications, and online slot bookings.'
  },
  {
    projectTitle: 'Patient Portal for Diagnostic Chain',
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    proposedPrice: 69000,
    estimatedDays: 28,
    status: 'PENDING',
    coverLetter: 'I will build a HIPAA-aware backend with secure PDF report storage, automated lab result syncing, and family profile management.'
  },
  {
    projectTitle: 'Patient Portal for Diagnostic Chain',
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    proposedPrice: 71000,
    estimatedDays: 24,
    status: 'PENDING',
    coverLetter: 'I will deliver a clean, patient-friendly frontend that works seamlessly across low-end mobile devices and browsers.'
  },

  {
    projectTitle: 'B2B MSME Supplier Marketplace',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 88000,
    estimatedDays: 35,
    status: 'PENDING',
    coverLetter: 'I can build the supplier onboarding, RFQ bidding mechanism, and GST verification modules with a modern React and Node.js stack.'
  },
  {
    projectTitle: 'B2B MSME Supplier Marketplace',
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    proposedPrice: 85000,
    estimatedDays: 30,
    status: 'PENDING',
    coverLetter: 'I will create scalable REST APIs for catalog management, quotation tracking, and automated PDF invoice generation.'
  },

  {
    projectTitle: 'Smart Energy Meter Management Portal',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 105000,
    estimatedDays: 40,
    status: 'PENDING',
    coverLetter: 'Experienced in real-time WebSocket dashboards, time-series data visualizations, and device telemetry management portals.'
  },
  {
    projectTitle: 'Smart Energy Meter Management Portal',
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    proposedPrice: 108000,
    estimatedDays: 38,
    status: 'PENDING',
    coverLetter: 'I will design the PostgreSQL time-series schema, anomaly detection alerting triggers, and billing aggregation jobs.'
  },
  {
    projectTitle: 'Smart Energy Meter Management Portal',
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    proposedPrice: 110000,
    estimatedDays: 35,
    status: 'PENDING',
    coverLetter: 'I will build the reactive frontend with live energy consumption gauges, geographical heatmaps, and customizable alerts.'
  },

  {
    projectTitle: 'Heritage Hotel Direct Booking Engine',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 46000,
    estimatedDays: 18,
    status: 'ACCEPTED',
    coverLetter: 'I will build a sleek direct booking engine with seasonal calendar pricing, Razorpay payment processing, and instant booking confirmations.'
  },
  {
    projectTitle: 'Heritage Hotel Direct Booking Engine',
    freelancerEmail: 'vaibhav.joshi@freelancehub.dev',
    proposedPrice: 45000,
    estimatedDays: 20,
    status: 'REJECTED',
    coverLetter: 'Experienced in hotel booking integrations with room availability calendars, coupon codes, and email confirmation triggers.'
  },

  // ── Mobile App Development Projects ──────────────────────────────────────
  {
    projectTitle: 'Cloud Kitchen Food Ordering App',
    freelancerEmail: 'pooja.menon@freelancehub.dev',
    proposedPrice: 62000,
    estimatedDays: 25,
    status: 'PENDING',
    coverLetter: 'I have published food delivery and cloud kitchen Flutter apps with live order tracking, UPI integration, and push notifications.'
  },
  {
    projectTitle: 'Cloud Kitchen Food Ordering App',
    freelancerEmail: 'jayesh.patil@freelancehub.dev',
    proposedPrice: 60000,
    estimatedDays: 28,
    status: 'PENDING',
    coverLetter: 'Native Android developer with experience building high-speed ordering apps with menu caching, live GPS delivery tracking, and WhatsApp receipts.'
  },
  {
    projectTitle: 'Cloud Kitchen Food Ordering App',
    freelancerEmail: 'ankur.sinha@freelancehub.dev',
    proposedPrice: 64000,
    estimatedDays: 22,
    status: 'PENDING',
    coverLetter: 'I can deliver a smooth, performant mobile experience with real-time order status updates, loyalty point rewards, and seamless payment checkout.'
  },

  {
    projectTitle: 'Pharma Inventory Management Mobile App',
    freelancerEmail: 'jayesh.patil@freelancehub.dev',
    proposedPrice: 53000,
    estimatedDays: 21,
    status: 'PENDING',
    coverLetter: 'I can build this native Android app with rapid barcode scanning, offline inventory adjustments, and automated sync with your backend ERP.'
  },
  {
    projectTitle: 'Pharma Inventory Management Mobile App',
    freelancerEmail: 'pooja.menon@freelancehub.dev',
    proposedPrice: 55000,
    estimatedDays: 20,
    status: 'PENDING',
    coverLetter: 'Experienced in building enterprise Flutter mobile tools with camera barcode scanners, expiry alerts, and stock reconciliation dashboards.'
  },

  {
    projectTitle: 'Kerala Tourism Experience App',
    freelancerEmail: 'pooja.menon@freelancehub.dev',
    proposedPrice: 56000,
    estimatedDays: 24,
    status: 'PENDING',
    coverLetter: 'Based in Kerala, I understand tourism workflows and can build this app with offline backwater trail maps, Malayalam support, and tour booking.'
  },
  {
    projectTitle: 'Kerala Tourism Experience App',
    freelancerEmail: 'ankur.sinha@freelancehub.dev',
    proposedPrice: 58000,
    estimatedDays: 22,
    status: 'PENDING',
    coverLetter: 'I will build an intuitive, visually captivating travel mobile application with itinerary planning and interactive destination guides.'
  },

  {
    projectTitle: 'Corporate Wellness Subscription App',
    freelancerEmail: 'pooja.menon@freelancehub.dev',
    proposedPrice: 68000,
    estimatedDays: 28,
    status: 'PENDING',
    coverLetter: 'I have developed wellness and habit tracker apps with step counting, meal logging, and corporate employee team leaderboards.'
  },
  {
    projectTitle: 'Corporate Wellness Subscription App',
    freelancerEmail: 'jayesh.patil@freelancehub.dev',
    proposedPrice: 66000,
    estimatedDays: 30,
    status: 'PENDING',
    coverLetter: 'Experienced in building Android health apps with local SQLite sync, push reminders, and daily progress charts.'
  },

  {
    projectTitle: 'B2B Marble Catalogue and Order App',
    freelancerEmail: 'jayesh.patil@freelancehub.dev',
    proposedPrice: 40000,
    estimatedDays: 15,
    status: 'PENDING',
    coverLetter: 'I can deliver a lightweight offline-first catalogue app with high-resolution image caching for trade show sample inquiries.'
  },
  {
    projectTitle: 'B2B Marble Catalogue and Order App',
    freelancerEmail: 'pooja.menon@freelancehub.dev',
    proposedPrice: 42000,
    estimatedDays: 18,
    status: 'PENDING',
    coverLetter: 'I will build a responsive mobile catalogue with sample order request forms and direct WhatsApp sales chat integration.'
  },

  {
    projectTitle: 'Subscription-Based Online Yoga App',
    freelancerEmail: 'pooja.menon@freelancehub.dev',
    proposedPrice: 60000,
    estimatedDays: 25,
    status: 'PENDING',
    coverLetter: 'I can develop this Flutter yoga app with custom audio/video player, live class scheduling, and Razorpay recurring subscription billing.'
  },
  {
    projectTitle: 'Subscription-Based Online Yoga App',
    freelancerEmail: 'ankur.sinha@freelancehub.dev',
    proposedPrice: 61000,
    estimatedDays: 24,
    status: 'PENDING',
    coverLetter: 'I will build a polished yoga and meditation app with offline session caching, streak counters, and seamless Apple/UPI payments.'
  },

  // ── UI/UX Design Projects ────────────────────────────────────────────────
  {
    projectTitle: 'Investment Advisory App UI Redesign',
    freelancerEmail: 'sneha.kulkarni@freelancehub.dev',
    proposedPrice: 38000,
    estimatedDays: 15,
    status: 'ACCEPTED',
    coverLetter: 'Google-certified UX designer with 5 years experience in fintech and wealth management apps. I will provide wireframes, design system, and Figma prototypes.'
  },
  {
    projectTitle: 'Investment Advisory App UI Redesign',
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    proposedPrice: 39000,
    estimatedDays: 14,
    status: 'REJECTED',
    coverLetter: 'I will design a modern, trust-building financial UI with accessible data tables, portfolio charts, and clear risk visualization.'
  },
  {
    projectTitle: 'Investment Advisory App UI Redesign',
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    proposedPrice: 40000,
    estimatedDays: 16,
    status: 'WITHDRAWN',
    coverLetter: 'I will deliver high-fidelity visual UI designs and an exhaustive design system with dark/light themes tailored for high-net-worth investors.'
  },

  {
    projectTitle: 'Interior Design Studio Website UX',
    freelancerEmail: 'sneha.kulkarni@freelancehub.dev',
    proposedPrice: 27000,
    estimatedDays: 10,
    status: 'ACCEPTED',
    coverLetter: 'I will create a clean, elegant aesthetic reflecting contemporary Indian interior architecture with interactive project lookbooks.'
  },
  {
    projectTitle: 'Interior Design Studio Website UX',
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    proposedPrice: 28000,
    estimatedDays: 12,
    status: 'REJECTED',
    coverLetter: 'I will deliver a responsive UI prototype in Figma with interactive consultation booking workflows and mood-board components.'
  },

  {
    projectTitle: 'Organic Brand Mobile App UX Overhaul',
    freelancerEmail: 'sneha.kulkarni@freelancehub.dev',
    proposedPrice: 34000,
    estimatedDays: 14,
    status: 'PENDING',
    coverLetter: 'I will conduct an in-depth UX audit, optimize the product discovery flow, and design an earthy, clean mobile shopping interface.'
  },
  {
    projectTitle: 'Organic Brand Mobile App UX Overhaul',
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    proposedPrice: 33000,
    estimatedDays: 15,
    status: 'PENDING',
    coverLetter: 'I can deliver a complete mobile design overhaul with custom icon sets, subscription flow wireframes, and developer-ready specs.'
  },

  {
    projectTitle: 'OTT Streaming Platform UI Design',
    freelancerEmail: 'sneha.kulkarni@freelancehub.dev',
    proposedPrice: 50000,
    estimatedDays: 20,
    status: 'PENDING',
    coverLetter: 'Experienced in media streaming UI design with dark mode ergonomics, content carousels, and responsive layouts across mobile and TV.'
  },
  {
    projectTitle: 'OTT Streaming Platform UI Design',
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    proposedPrice: 49000,
    estimatedDays: 18,
    status: 'PENDING',
    coverLetter: 'I will design a frictionless streaming experience with personalized watchlists, episode selectors, and regional language UI.'
  },

  {
    projectTitle: 'Startup Analytics Dashboard UI Design',
    freelancerEmail: 'sneha.kulkarni@freelancehub.dev',
    proposedPrice: 30000,
    estimatedDays: 12,
    status: 'PENDING',
    coverLetter: 'I specialize in data-dense dashboard UX design in Figma with auto-layout components, KPI summary cards, and runway projection charts.'
  },
  {
    projectTitle: 'Startup Analytics Dashboard UI Design',
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    proposedPrice: 31000,
    estimatedDays: 10,
    status: 'PENDING',
    coverLetter: 'I will create an intuitive dashboard design system with interactive charts, filter panels, and developer-ready handoff documentation.'
  },

  // ── Graphic Design Projects ──────────────────────────────────────────────
  {
    projectTitle: 'Ethnic Fashion Brand Identity Package',
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    proposedPrice: 24000,
    estimatedDays: 10,
    status: 'PENDING',
    coverLetter: 'I have 7+ years creating vibrant brand identities for Indian fashion houses with logos, swing tags, packaging, and social kits.'
  },
  {
    projectTitle: 'Ethnic Fashion Brand Identity Package',
    freelancerEmail: 'sneha.kulkarni@freelancehub.dev',
    proposedPrice: 25000,
    estimatedDays: 12,
    status: 'PENDING',
    coverLetter: 'I will craft an elegant visual identity blending traditional motifs with contemporary minimalism across all brand touchpoints.'
  },

  {
    projectTitle: 'Print-on-Demand Product Templates Library',
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    proposedPrice: 28000,
    estimatedDays: 15,
    status: 'PENDING',
    coverLetter: 'I will design 50 print-ready high-resolution templates for mugs, t-shirts, and posters themed for Indian festive and corporate gifting.'
  },
  {
    projectTitle: 'Print-on-Demand Product Templates Library',
    freelancerEmail: 'saurabh.ghosh@freelancehub.dev',
    proposedPrice: 29000,
    estimatedDays: 14,
    status: 'PENDING',
    coverLetter: 'Experienced graphic designer capable of delivering vector and raster artwork optimized for direct-to-garment and sublimation printing.'
  },

  {
    projectTitle: 'Gourmet Spice Brand Packaging Design',
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    proposedPrice: 21000,
    estimatedDays: 8,
    status: 'ACCEPTED',
    coverLetter: 'I will design premium, heritage-inspired packaging for all 15 spice SKUs with print-ready die lines and regulatory compliance layouts.'
  },
  {
    projectTitle: 'Gourmet Spice Brand Packaging Design',
    freelancerEmail: 'sneha.kulkarni@freelancehub.dev',
    proposedPrice: 22000,
    estimatedDays: 10,
    status: 'REJECTED',
    coverLetter: 'I will create an artisan packaging system with warm botanical color palettes and distinctive typography for modern retail shelves.'
  },

  {
    projectTitle: 'Handmade Jewellery Brand Visual Identity',
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    proposedPrice: 17500,
    estimatedDays: 7,
    status: 'ACCEPTED',
    coverLetter: 'I will create a luxury handcrafted brand identity including vector logo, brand guidelines, and Etsy/Instagram banner kits.'
  },
  {
    projectTitle: 'Handmade Jewellery Brand Visual Identity',
    freelancerEmail: 'sneha.kulkarni@freelancehub.dev',
    proposedPrice: 18000,
    estimatedDays: 8,
    status: 'REJECTED',
    coverLetter: 'I can deliver a delicate, typography-forward brand kit with Instagram highlight covers and product unboxing cards.'
  },

  // ── Data Science & AI Projects ───────────────────────────────────────────
  {
    projectTitle: 'Telecom Network Anomaly Detection System',
    freelancerEmail: 'karthik.sundar@freelancehub.dev',
    proposedPrice: 145000,
    estimatedDays: 50,
    status: 'PENDING',
    coverLetter: 'ML engineer with experience in real-time time-series anomaly detection using TensorFlow and Python for high-frequency telematics.'
  },
  {
    projectTitle: 'Telecom Network Anomaly Detection System',
    freelancerEmail: 'tanmay.iyer@freelancehub.dev',
    proposedPrice: 140000,
    estimatedDays: 45,
    status: 'PENDING',
    coverLetter: 'I will build the automated data processing pipeline with PostgreSQL and Python to analyze network probe logs and trigger instant alerts.'
  },

  {
    projectTitle: 'Jewellery Inventory Demand Forecasting',
    freelancerEmail: 'karthik.sundar@freelancehub.dev',
    proposedPrice: 78000,
    estimatedDays: 30,
    status: 'PENDING',
    coverLetter: 'I will build an ARIMA and XGBoost demand forecasting model analyzing 3 years of seasonal retail data to optimize stock per location.'
  },
  {
    projectTitle: 'Jewellery Inventory Demand Forecasting',
    freelancerEmail: 'tanmay.iyer@freelancehub.dev',
    proposedPrice: 75000,
    estimatedDays: 28,
    status: 'PENDING',
    coverLetter: 'I specialize in retail sales analytics and will deliver weekly automated restocking Power BI reports alongside Python models.'
  },
  {
    projectTitle: 'Jewellery Inventory Demand Forecasting',
    freelancerEmail: 'deepa.krishnan@freelancehub.dev',
    proposedPrice: 79000,
    estimatedDays: 32,
    status: 'PENDING',
    coverLetter: 'I will map the retail supply chain requirements, clean historical POS data, and structure actionable inventory replenishment dashboards.'
  },

  {
    projectTitle: 'Fintech Credit Risk Scoring Model',
    freelancerEmail: 'karthik.sundar@freelancehub.dev',
    proposedPrice: 125000,
    estimatedDays: 45,
    status: 'PENDING',
    coverLetter: 'Experienced in developing explainable AI credit risk models with SHAP values, alternative GST/UPI feature engineering, and ROC validation.'
  },
  {
    projectTitle: 'Fintech Credit Risk Scoring Model',
    freelancerEmail: 'tanmay.iyer@freelancehub.dev',
    proposedPrice: 120000,
    estimatedDays: 40,
    status: 'PENDING',
    coverLetter: 'I will build the underlying feature store and risk scoring pipelines with PostgreSQL, Python, and automated credit tier reporting.'
  },

  {
    projectTitle: 'Commodity Price Prediction Dashboard',
    freelancerEmail: 'tanmay.iyer@freelancehub.dev',
    proposedPrice: 58000,
    estimatedDays: 22,
    status: 'PENDING',
    coverLetter: 'I will connect mandi price datasets into an interactive Power BI dashboard with automated daily refresh and trend forecasts.'
  },
  {
    projectTitle: 'Commodity Price Prediction Dashboard',
    freelancerEmail: 'karthik.sundar@freelancehub.dev',
    proposedPrice: 59000,
    estimatedDays: 20,
    status: 'PENDING',
    coverLetter: 'I will train regression models on historical agricultural indices to forecast commodity price fluctuations with confidence intervals.'
  },

  {
    projectTitle: 'Energy Consumption Pattern Analysis',
    freelancerEmail: 'tanmay.iyer@freelancehub.dev',
    proposedPrice: 67000,
    estimatedDays: 25,
    status: 'PENDING',
    coverLetter: 'I will perform k-means customer clustering and peak-load anomaly detection on 50,000 smart meter feeds in Python and SQL.'
  },
  {
    projectTitle: 'Energy Consumption Pattern Analysis',
    freelancerEmail: 'karthik.sundar@freelancehub.dev',
    proposedPrice: 69000,
    estimatedDays: 24,
    status: 'PENDING',
    coverLetter: 'I will develop automated tampering detection algorithms and load prediction models with PostgreSQL integration.'
  },

  // ── Cloud & DevOps Projects ──────────────────────────────────────────────
  {
    projectTitle: 'Multi-Region AWS Infrastructure Setup',
    freelancerEmail: 'vivek.nambiar@freelancehub.dev',
    proposedPrice: 95000,
    estimatedDays: 25,
    status: 'PENDING',
    coverLetter: 'AWS Certified Solutions Architect with deep Terraform experience. I will set up multi-region EKS, RDS Multi-AZ, and Route 53 failover.'
  },
  {
    projectTitle: 'Multi-Region AWS Infrastructure Setup',
    freelancerEmail: 'mohit.rajput@freelancehub.dev',
    proposedPrice: 98000,
    estimatedDays: 22,
    status: 'PENDING',
    coverLetter: 'CKA certified DevOps engineer. I will automate the infrastructure deployment with modular Terraform and secure VPC peering.'
  },
  {
    projectTitle: 'Multi-Region AWS Infrastructure Setup',
    freelancerEmail: 'sumit.chaudhary@freelancehub.dev',
    proposedPrice: 92000,
    estimatedDays: 28,
    status: 'PENDING',
    coverLetter: 'I will configure the multi-region database replication, automated backups, and low-latency read replica routing on AWS.'
  },

  {
    projectTitle: 'CI/CD Pipeline for Security Tool Suite',
    freelancerEmail: 'mohit.rajput@freelancehub.dev',
    proposedPrice: 72000,
    estimatedDays: 18,
    status: 'PENDING',
    coverLetter: 'I will implement a robust GitHub Actions and Kubernetes CI/CD pipeline with automated Docker image scanning and blue/green deploys.'
  },
  {
    projectTitle: 'CI/CD Pipeline for Security Tool Suite',
    freelancerEmail: 'vivek.nambiar@freelancehub.dev',
    proposedPrice: 74000,
    estimatedDays: 20,
    status: 'PENDING',
    coverLetter: 'I will configure AWS EKS pipeline automation with AWS Secrets Manager integration, automated linting, and rollbacks.'
  },
  {
    projectTitle: 'CI/CD Pipeline for Security Tool Suite',
    freelancerEmail: 'harini.chandrasekaran@freelancehub.dev',
    proposedPrice: 75000,
    estimatedDays: 15,
    status: 'PENDING',
    coverLetter: 'I will integrate SonarQube, Trivy container security scanners, and SAST/DAST checks directly into your deployment pipelines.'
  },

  {
    projectTitle: 'Telecom On-Premise to Cloud Migration',
    freelancerEmail: 'vivek.nambiar@freelancehub.dev',
    proposedPrice: 190000,
    estimatedDays: 60,
    status: 'PENDING',
    coverLetter: 'I have led multiple enterprise data center to AWS migrations with zero data loss, detailed cutover runbooks, and cost optimization.'
  },
  {
    projectTitle: 'Telecom On-Premise to Cloud Migration',
    freelancerEmail: 'mohit.rajput@freelancehub.dev',
    proposedPrice: 195000,
    estimatedDays: 55,
    status: 'PENDING',
    coverLetter: 'I will containerize legacy workloads into Docker and Kubernetes on AWS with automated deployment testing and rollback plans.'
  },

  {
    projectTitle: 'IoT Device Management on AWS',
    freelancerEmail: 'vivek.nambiar@freelancehub.dev',
    proposedPrice: 82000,
    estimatedDays: 28,
    status: 'PENDING',
    coverLetter: 'I will configure AWS IoT Core, MQTT topic rules, DynamoDB time-series ingestion, and CloudWatch alerts for 10,000+ solar devices.'
  },
  {
    projectTitle: 'IoT Device Management on AWS',
    freelancerEmail: 'mohit.rajput@freelancehub.dev',
    proposedPrice: 84000,
    estimatedDays: 25,
    status: 'PENDING',
    coverLetter: 'I will automate the IoT infrastructure provisioning with Terraform and configure containerized microservices for device telemetry.'
  },

  // ── Digital Marketing Projects ───────────────────────────────────────────
  {
    projectTitle: 'Fashion Brand Google & Meta Ads Campaign',
    freelancerEmail: 'priyanka.dubey@freelancehub.dev',
    proposedPrice: 33000,
    estimatedDays: 30,
    status: 'PENDING',
    coverLetter: 'Managed ₹50L+ monthly ad spends for Indian apparel brands. I will structure high-converting Google Shopping and Meta catalogue ad funnels.'
  },
  {
    projectTitle: 'Fashion Brand Google & Meta Ads Campaign',
    freelancerEmail: 'rekha.nair@freelancehub.dev',
    proposedPrice: 32000,
    estimatedDays: 28,
    status: 'PENDING',
    coverLetter: 'I will pair paid Meta campaigns with viral Instagram Reels influencer seeding to maximize brand discovery and conversion.'
  },
  {
    projectTitle: 'Fashion Brand Google & Meta Ads Campaign',
    freelancerEmail: 'nilufar.shaikh@freelancehub.dev',
    proposedPrice: 34000,
    estimatedDays: 25,
    status: 'PENDING',
    coverLetter: 'I will optimize product catalogue feeds for Google Shopping and setup retargeting campaigns to lower customer acquisition cost.'
  },

  {
    projectTitle: 'Ayurveda Brand Digital Marketing Strategy',
    freelancerEmail: 'priyanka.dubey@freelancehub.dev',
    proposedPrice: 27000,
    estimatedDays: 20,
    status: 'PENDING',
    coverLetter: 'I will develop an omnichannel growth roadmap combining SEO, Google Local Ads, and content marketing tailored for tier-2 Indian consumers.'
  },
  {
    projectTitle: 'Ayurveda Brand Digital Marketing Strategy',
    freelancerEmail: 'rekha.nair@freelancehub.dev',
    proposedPrice: 26000,
    estimatedDays: 22,
    status: 'PENDING',
    coverLetter: 'Based in Kerala, I will drive an authentic Ayurvedic storytelling campaign across social channels with micro-influencer tie-ups.'
  },
  {
    projectTitle: 'Ayurveda Brand Digital Marketing Strategy',
    freelancerEmail: 'swapna.reddy@freelancehub.dev',
    proposedPrice: 25000,
    estimatedDays: 25,
    status: 'PENDING',
    coverLetter: 'I will write high-intent educational content and wellness pillar guides that rank organically on search engines.'
  },

  {
    projectTitle: 'Festival Season E-commerce Marketing Push',
    freelancerEmail: 'priyanka.dubey@freelancehub.dev',
    proposedPrice: 21000,
    estimatedDays: 15,
    status: 'PENDING',
    coverLetter: 'I will execute a blitz festive campaign across Meta Ads and Google Local to boost direct sweet box gifting sales by 40%.'
  },
  {
    projectTitle: 'Festival Season E-commerce Marketing Push',
    freelancerEmail: 'rekha.nair@freelancehub.dev',
    proposedPrice: 20000,
    estimatedDays: 16,
    status: 'PENDING',
    coverLetter: 'I will run localized WhatsApp marketing broadcasts, festival giveaway contests, and festive Instagram reels promotions.'
  },

  {
    projectTitle: 'Spice Brand Amazon & Organic SEO Campaign',
    freelancerEmail: 'priyanka.dubey@freelancehub.dev',
    proposedPrice: 17000,
    estimatedDays: 14,
    status: 'ACCEPTED',
    coverLetter: 'I will optimize Amazon listing copy with high-volume backend search terms, A+ content guidelines, and on-page website SEO.'
  },
  {
    projectTitle: 'Spice Brand Amazon & Organic SEO Campaign',
    freelancerEmail: 'swapna.reddy@freelancehub.dev',
    proposedPrice: 17500,
    estimatedDays: 15,
    status: 'REJECTED',
    coverLetter: 'I will write persuasive product bullet points, recipe blog posts, and keyword-rich meta descriptions to drive search traffic.'
  },

  {
    projectTitle: 'Art Gallery Online Presence Growth',
    freelancerEmail: 'rekha.nair@freelancehub.dev',
    proposedPrice: 14000,
    estimatedDays: 14,
    status: 'PENDING',
    coverLetter: 'I will curate an aesthetically stunning Instagram and Pinterest presence with artist spotlight reels and gallery virtual tours.'
  },
  {
    projectTitle: 'Art Gallery Online Presence Growth',
    freelancerEmail: 'priyanka.dubey@freelancehub.dev',
    proposedPrice: 14500,
    estimatedDays: 12,
    status: 'PENDING',
    coverLetter: 'I will optimize your Google My Business profile, launch targeted local discovery ads, and establish monthly collector newsletters.'
  },

  // ── Content Writing Projects ─────────────────────────────────────────────
  {
    projectTitle: 'Author Website Blog Content - 20 Articles',
    freelancerEmail: 'swapna.reddy@freelancehub.dev',
    proposedPrice: 11500,
    estimatedDays: 15,
    status: 'PENDING',
    coverLetter: 'Experienced literary and SEO content writer. I will craft 20 deeply researched, warm articles on Indian literature and creative writing.'
  },
  {
    projectTitle: 'Author Website Blog Content - 20 Articles',
    freelancerEmail: 'priyanka.dubey@freelancehub.dev',
    proposedPrice: 12000,
    estimatedDays: 14,
    status: 'PENDING',
    coverLetter: 'I will research keyword opportunities and write engaging, search-optimized literary blog posts to grow organic author traffic.'
  },

  {
    projectTitle: 'Ayurveda Product Description Copywriting',
    freelancerEmail: 'swapna.reddy@freelancehub.dev',
    proposedPrice: 15000,
    estimatedDays: 12,
    status: 'PENDING',
    coverLetter: 'I have written AYUSH-compliant herbal product copy for multiple Indian wellness brands, highlighting ingredients and benefits persuasively.'
  },
  {
    projectTitle: 'Ayurveda Product Description Copywriting',
    freelancerEmail: 'rekha.nair@freelancehub.dev',
    proposedPrice: 15500,
    estimatedDays: 10,
    status: 'PENDING',
    coverLetter: 'I will deliver concise, engaging product descriptions with key benefits, usage tips, and clear call-to-actions for your 40 SKUs.'
  },

  {
    projectTitle: "Children's Book Series Content",
    freelancerEmail: 'swapna.reddy@freelancehub.dev',
    proposedPrice: 19000,
    estimatedDays: 18,
    status: 'PENDING',
    coverLetter: 'Published writer with experience in children\'s literature. I will write 5 heartwarming, culturally rich illustrated story manuscripts.'
  },
  {
    projectTitle: "Children's Book Series Content",
    freelancerEmail: 'priyanka.dubey@freelancehub.dev',
    proposedPrice: 19500,
    estimatedDays: 20,
    status: 'PENDING',
    coverLetter: 'I will create engaging storylines combining STEM concepts and Indian folklore tailored for children aged 6 to 10.'
  },

  {
    projectTitle: 'Folk Music Tour Press Kit & Web Copy',
    freelancerEmail: 'swapna.reddy@freelancehub.dev',
    proposedPrice: 9500,
    estimatedDays: 8,
    status: 'PENDING',
    coverLetter: 'I will write poetic, culturally resonant artist bios and press releases in English and Bengali for your upcoming concert tours.'
  },
  {
    projectTitle: 'Folk Music Tour Press Kit & Web Copy',
    freelancerEmail: 'rekha.nair@freelancehub.dev',
    proposedPrice: 9800,
    estimatedDays: 7,
    status: 'PENDING',
    coverLetter: 'I will deliver an impactful festival pitch package with engaging tour summaries and formatted press kit downloads.'
  },

  // ── Video & Animation Projects ───────────────────────────────────────────
  {
    projectTitle: 'OTT Platform Promotional Trailer Package',
    freelancerEmail: 'saurabh.ghosh@freelancehub.dev',
    proposedPrice: 42000,
    estimatedDays: 18,
    status: 'PENDING',
    coverLetter: 'Motion designer with experience editing web series trailers, cinematic color grading, kinetic titles, and multi-format video exports.'
  },
  {
    projectTitle: 'OTT Platform Promotional Trailer Package',
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    proposedPrice: 44000,
    estimatedDays: 20,
    status: 'PENDING',
    coverLetter: 'I will design high-energy animated lower thirds, title cards, and promotional teaser cuts for YouTube and OTT platforms.'
  },

  {
    projectTitle: 'Folk Music Concert Highlight Reel',
    freelancerEmail: 'saurabh.ghosh@freelancehub.dev',
    proposedPrice: 17000,
    estimatedDays: 10,
    status: 'PENDING',
    coverLetter: 'I will edit multi-cam concert footage with balanced audio mixing, dynamic camera switches, and 4K color grading.'
  },
  {
    projectTitle: 'Folk Music Concert Highlight Reel',
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    proposedPrice: 17500,
    estimatedDays: 12,
    status: 'PENDING',
    coverLetter: 'I will produce a 5-minute main highlight video and 30-second vertical social cutdowns with branded title overlays.'
  },

  {
    projectTitle: 'Fashion Brand Reels Content Package',
    freelancerEmail: 'saurabh.ghosh@freelancehub.dev',
    proposedPrice: 23000,
    estimatedDays: 15,
    status: 'ACCEPTED',
    coverLetter: 'I will edit 12 trendy, fast-paced Instagram Reels with beat-synced transitions, text animations, and color grading per month.'
  },
  {
    projectTitle: 'Fashion Brand Reels Content Package',
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    proposedPrice: 24000,
    estimatedDays: 16,
    status: 'REJECTED',
    coverLetter: 'I will create stylish, high-fashion social video templates with bespoke animated stickers and branded intro/outro screens.'
  },

  {
    projectTitle: 'Explainer Videos for Edtech Platform',
    freelancerEmail: 'saurabh.ghosh@freelancehub.dev',
    proposedPrice: 56000,
    estimatedDays: 25,
    status: 'PENDING',
    coverLetter: 'I will create 10 clean 2D animated explainer lessons in After Effects with synchronized Hindi/English voiceover tracks.'
  },
  {
    projectTitle: 'Explainer Videos for Edtech Platform',
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    proposedPrice: 58000,
    estimatedDays: 28,
    status: 'PENDING',
    coverLetter: 'I will design custom vector educational characters and diagram animations in Illustrator and After Effects for engaging learning.'
  },

  // ── E-commerce Projects ──────────────────────────────────────────────────
  {
    projectTitle: 'Handloom Export Shopify Store Setup',
    freelancerEmail: 'nilufar.shaikh@freelancehub.dev',
    proposedPrice: 30000,
    estimatedDays: 14,
    status: 'PENDING',
    coverLetter: 'Shopify expert with experience setting up international multi-currency checkout, DHL shipping rules, and SEO category pages.'
  },
  {
    projectTitle: 'Handloom Export Shopify Store Setup',
    freelancerEmail: 'vaibhav.joshi@freelancehub.dev',
    proposedPrice: 31000,
    estimatedDays: 16,
    status: 'PENDING',
    coverLetter: 'I will configure your Shopify store with high-resolution image zoom, currency switchers, and custom responsive collection pages.'
  },

  {
    projectTitle: 'Organic Food D2C WooCommerce Store',
    freelancerEmail: 'vaibhav.joshi@freelancehub.dev',
    proposedPrice: 38000,
    estimatedDays: 18,
    status: 'PENDING',
    coverLetter: 'I will build a custom WooCommerce store with subscription box recurring orders, GST invoices, and WhatsApp order alerts.'
  },
  {
    projectTitle: 'Organic Food D2C WooCommerce Store',
    freelancerEmail: 'nilufar.shaikh@freelancehub.dev',
    proposedPrice: 39000,
    estimatedDays: 16,
    status: 'PENDING',
    coverLetter: 'I will optimize the WooCommerce checkout funnel, integrate loyalty rewards, and configure automated shipping rates.'
  },
  {
    projectTitle: 'Organic Food D2C WooCommerce Store',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 40000,
    estimatedDays: 15,
    status: 'PENDING',
    coverLetter: 'I can deliver a high-speed e-commerce storefront with custom recurring billing integration and instant inventory sync.'
  },

  {
    projectTitle: 'South Indian Textile Brand Online Store',
    freelancerEmail: 'nilufar.shaikh@freelancehub.dev',
    proposedPrice: 36000,
    estimatedDays: 16,
    status: 'PENDING',
    coverLetter: 'I will set up your e-commerce storefront with saree draping video modules, cash-on-delivery management, and fast mobile browsing.'
  },
  {
    projectTitle: 'South Indian Textile Brand Online Store',
    freelancerEmail: 'vaibhav.joshi@freelancehub.dev',
    proposedPrice: 37000,
    estimatedDays: 18,
    status: 'PENDING',
    coverLetter: 'I will configure a lightweight WooCommerce store with regional language options and automated PAN-India courier tracking.'
  },

  {
    projectTitle: 'Silk Saree Export Bilingual Online Store',
    freelancerEmail: 'nilufar.shaikh@freelancehub.dev',
    proposedPrice: 33000,
    estimatedDays: 15,
    status: 'PENDING',
    coverLetter: 'I will build a dual-language (Kannada + English) Shopify store with PayPal and Razorpay integration tailored for NRI customers.'
  },
  {
    projectTitle: 'Silk Saree Export Bilingual Online Store',
    freelancerEmail: 'vaibhav.joshi@freelancehub.dev',
    proposedPrice: 34000,
    estimatedDays: 16,
    status: 'PENDING',
    coverLetter: 'I will configure high-definition fabric zoom, custom bulk inquiry forms, and international shipping calculation.'
  },

  {
    projectTitle: 'Authenticated Gemstone B2B Trading Platform',
    freelancerEmail: 'nilufar.shaikh@freelancehub.dev',
    proposedPrice: 52000,
    estimatedDays: 22,
    status: 'PENDING',
    coverLetter: 'I will build a wholesale B2B Shopify portal with certificate attachment uploads, tiered pricing, and buyer verification gates.'
  },
  {
    projectTitle: 'Authenticated Gemstone B2B Trading Platform',
    freelancerEmail: 'vaibhav.joshi@freelancehub.dev',
    proposedPrice: 53000,
    estimatedDays: 24,
    status: 'PENDING',
    coverLetter: 'I will customize the B2B store with 360-degree product video embeds and request-for-quote (RFQ) workflows.'
  },
  {
    projectTitle: 'Authenticated Gemstone B2B Trading Platform',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 54000,
    estimatedDays: 20,
    status: 'PENDING',
    coverLetter: 'I can deliver a custom web application portal with secure wire transfer invoicing and encrypted gemological certificates.'
  },

  // ── Software & IT Projects ───────────────────────────────────────────────
  {
    projectTitle: 'Logistics ERP Module Customisation',
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    proposedPrice: 86000,
    estimatedDays: 30,
    status: 'PENDING',
    coverLetter: 'Experienced in Python and PostgreSQL ERP development. I will build custom fleet routing, fuel tracking, and maintenance logs.'
  },
  {
    projectTitle: 'Logistics ERP Module Customisation',
    freelancerEmail: 'deepa.krishnan@freelancehub.dev',
    proposedPrice: 88000,
    estimatedDays: 35,
    status: 'PENDING',
    coverLetter: 'I will map the fleet operations workflows, document technical specifications, and ensure data integrity across modules.'
  },
  {
    projectTitle: 'Logistics ERP Module Customisation',
    freelancerEmail: 'sumit.chaudhary@freelancehub.dev',
    proposedPrice: 85000,
    estimatedDays: 32,
    status: 'PENDING',
    coverLetter: 'I will optimize the PostgreSQL database performance for high-frequency GPS telematics and driver trip log aggregation.'
  },

  {
    projectTitle: 'Production Tracking System for Steel Fabrication',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 72000,
    estimatedDays: 28,
    status: 'PENDING',
    coverLetter: 'I will build a responsive web application for floor managers to track job orders, machine downtime, and raw material usage.'
  },
  {
    projectTitle: 'Production Tracking System for Steel Fabrication',
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    proposedPrice: 70000,
    estimatedDays: 30,
    status: 'PENDING',
    coverLetter: 'I will design the relational MySQL schema and REST API endpoints for batch quality inspection checklists and daily dispatch.'
  },
  {
    projectTitle: 'Production Tracking System for Steel Fabrication',
    freelancerEmail: 'deepa.krishnan@freelancehub.dev',
    proposedPrice: 74000,
    estimatedDays: 26,
    status: 'PENDING',
    coverLetter: 'I will conduct requirement analysis with factory stakeholders and design intuitive dashboard views for production efficiency.'
  },

  {
    projectTitle: 'Real Estate CRM with Automated Follow-Up',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 62000,
    estimatedDays: 24,
    status: 'PENDING',
    coverLetter: 'I will develop the custom CRM with automated portal lead webhooks, WhatsApp follow-up bots, and site visit calendar sync.'
  },
  {
    projectTitle: 'Real Estate CRM with Automated Follow-Up',
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    proposedPrice: 63000,
    estimatedDays: 25,
    status: 'PENDING',
    coverLetter: 'I will build the backend API managing lead stages, commission calculations, and automated SMS/email follow-up triggers.'
  },
  {
    projectTitle: 'Real Estate CRM with Automated Follow-Up',
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    proposedPrice: 64000,
    estimatedDays: 20,
    status: 'PENDING',
    coverLetter: 'I will craft an intuitive kanban pipeline frontend in React for agents to manage deals and track follow-up activities easily.'
  },

  {
    projectTitle: 'Port Logistics Workflow Digitisation',
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    proposedPrice: 105000,
    estimatedDays: 38,
    status: 'PENDING',
    coverLetter: 'I will design secure REST APIs with role-based approval hierarchies for customs clearance documents and vessel schedules.'
  },
  {
    projectTitle: 'Port Logistics Workflow Digitisation',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 108000,
    estimatedDays: 40,
    status: 'PENDING',
    coverLetter: 'I will build the web application replacing paper manifests with digital forms, electronic sign-offs, and audit trails.'
  },
  {
    projectTitle: 'Port Logistics Workflow Digitisation',
    freelancerEmail: 'deepa.krishnan@freelancehub.dev',
    proposedPrice: 106000,
    estimatedDays: 35,
    status: 'PENDING',
    coverLetter: 'I will map the end-to-end port workflow, identify bottlenecks, and ensure smooth digital adoption across operations teams.'
  },

  {
    projectTitle: 'Real Estate Property Listing & CRM System',
    freelancerEmail: 'shubham@gmail.com',
    proposedPrice: 76000,
    estimatedDays: 28,
    status: 'PENDING',
    coverLetter: 'I can deliver a complete property listing platform with geo-search, virtual tour embeds, and integrated lead CRM.'
  },
  {
    projectTitle: 'Real Estate Property Listing & CRM System',
    freelancerEmail: 'aryan.trivedi@freelancehub.dev',
    proposedPrice: 78000,
    estimatedDays: 25,
    status: 'PENDING',
    coverLetter: 'I will design and build an ultra-responsive property discovery UI with interactive floor plan viewers and map filters.'
  },
  {
    projectTitle: 'Real Estate Property Listing & CRM System',
    freelancerEmail: 'rahul.pandey@freelancehub.dev',
    proposedPrice: 75000,
    estimatedDays: 30,
    status: 'PENDING',
    coverLetter: 'I will implement the backend listing database with MySQL spatial indexing, lead assignment logic, and drip notification APIs.'
  },

  // ── Business & Consulting Projects ───────────────────────────────────────
  {
    projectTitle: 'Investment Platform Business Requirements Document',
    freelancerEmail: 'deepa.krishnan@freelancehub.dev',
    proposedPrice: 28000,
    estimatedDays: 12,
    status: 'PENDING',
    coverLetter: 'Business analyst with 8 years experience in banking and fintech. I will draft comprehensive BRD, process maps, and SEBI compliance specs.'
  },
  {
    projectTitle: 'Investment Platform Business Requirements Document',
    freelancerEmail: 'tanmay.iyer@freelancehub.dev',
    proposedPrice: 29000,
    estimatedDays: 14,
    status: 'PENDING',
    coverLetter: 'I will document data flow diagrams, reporting requirements, and database dictionary for the platform upgrade.'
  },

  {
    projectTitle: 'Edtech Growth Strategy & Market Analysis',
    freelancerEmail: 'deepa.krishnan@freelancehub.dev',
    proposedPrice: 24000,
    estimatedDays: 10,
    status: 'PENDING',
    coverLetter: 'I will conduct detailed competitor benchmarking, student acquisition funnel analysis, and deliver an actionable growth roadmap.'
  },
  {
    projectTitle: 'Edtech Growth Strategy & Market Analysis',
    freelancerEmail: 'tanmay.iyer@freelancehub.dev',
    proposedPrice: 23500,
    estimatedDays: 12,
    status: 'PENDING',
    coverLetter: 'I will analyze student enrollment data and regional educational trends to forecast expansion opportunities in Power BI.'
  },

  {
    projectTitle: 'Solar Energy Project Financial Modelling',
    freelancerEmail: 'deepa.krishnan@freelancehub.dev',
    proposedPrice: 33000,
    estimatedDays: 14,
    status: 'PENDING',
    coverLetter: 'I will build an institutional-grade financial model calculating project IRR, debt service coverage, and sensitivity matrices.'
  },
  {
    projectTitle: 'Solar Energy Project Financial Modelling',
    freelancerEmail: 'tanmay.iyer@freelancehub.dev',
    proposedPrice: 34000,
    estimatedDays: 12,
    status: 'PENDING',
    coverLetter: 'I will develop Python and Excel financial models with dynamic tariff structures, depreciation schedules, and visual dashboards.'
  },

  {
    projectTitle: 'Pharma Distribution Process Optimisation',
    freelancerEmail: 'deepa.krishnan@freelancehub.dev',
    proposedPrice: 26500,
    estimatedDays: 14,
    status: 'PENDING',
    coverLetter: 'I will conduct end-to-end supply chain value stream mapping, identify dispatch bottlenecks, and formulate standard operating procedures.'
  },
  {
    projectTitle: 'Pharma Distribution Process Optimisation',
    freelancerEmail: 'tanmay.iyer@freelancehub.dev',
    proposedPrice: 27000,
    estimatedDays: 15,
    status: 'PENDING',
    coverLetter: 'I will analyze historical warehouse picking and delivery turnaround data to pinpoint operational delays and design KPI dashboards.'
  }
]

// ─── SEED FUNCTIONS ─────────────────────────────────────────────────────────

async function seedCustomers() {
  console.log('\n[Seed] === Seeding Customers ===')
  let created = 0
  let skipped = 0

  for (const c of CUSTOMERS) {
    const { user, created: wasCreated } = await upsertUser({
      email: c.email,
      name: c.name,
      role: 'CUSTOMER',
      professionalTitle: null
    })

    if (!wasCreated) {
      skipped++
    } else {
      created++
    }

    // Create CustomerProfile if it doesn't exist
    const existingProfile = await prisma.customerProfile.findUnique({
      where: { userId: user.id }
    })

    if (!existingProfile) {
      await prisma.customerProfile.create({
        data: {
          userId: user.id,
          bio: c.bio,
          companyName: c.companyName,
          location: c.location,
          profileImage: null
        }
      })
    }
  }

  console.log(`[Seed] Customers done — Users Created: ${created}, Skipped (already exist): ${skipped}`)
  return { created, skipped }
}

async function seedFreelancers() {
  console.log('\n[Seed] === Seeding Freelancers ===')
  let created = 0
  let skipped = 0

  for (const f of FREELANCERS) {
    const { user, created: wasCreated } = await upsertUser({
      email: f.email,
      name: f.name,
      role: 'FREELANCER',
      professionalTitle: f.professionalTitle
    })

    if (!wasCreated) {
      skipped++
    } else {
      created++
    }

    // Create FreelancerProfile if it doesn't exist
    const existingProfile = await prisma.freelancerProfile.findUnique({
      where: { userId: user.id }
    })

    if (!existingProfile) {
      await prisma.freelancerProfile.create({
        data: {
          userId: user.id,
          bio: f.bio,
          hourlyRate: f.hourlyRate,
          experienceLevel: f.experienceLevel,
          location: f.location,
          availability: f.availability,
          profileImage: null
        }
      })
    }
  }

  console.log(`[Seed] Freelancers done — Users Created: ${created}, Skipped (already exist): ${skipped}`)
  return { created, skipped }
}

async function seedSkills() {
  console.log('\n[Seed] === Seeding Skills ===')
  let created = 0
  let skipped = 0

  for (const name of SKILL_NAMES) {
    const existing = await prisma.skill.findUnique({ where: { name } })
    if (existing) {
      skipped++
    } else {
      await prisma.skill.create({ data: { name } })
      created++
    }
  }

  console.log(`[Seed] Skills done — Created: ${created}, Skipped (already exist): ${skipped}`)
  return { created, skipped }
}

async function seedFreelancerSkills() {
  console.log('\n[Seed] === Seeding Freelancer-Skill Mappings ===')
  let created = 0
  let skipped = 0

  for (const [email, skillNames] of Object.entries(FREELANCER_SKILLS)) {
    // Resolve freelancer user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      console.warn(`  [WARN] Freelancer not found for email: ${email} — skipping.`)
      continue
    }

    // Resolve freelancer profile
    const profile = await prisma.freelancerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) {
      console.warn(`  [WARN] FreelancerProfile not found for email: ${email} — skipping.`)
      continue
    }

    for (const skillName of skillNames) {
      // Resolve skill (must already exist from seedSkills)
      const skill = await prisma.skill.findUnique({ where: { name: skillName } })
      if (!skill) {
        console.warn(`  [WARN] Skill not found: "${skillName}" — skipping mapping.`)
        continue
      }

      // Check if mapping already exists (composite PK)
      const existingMapping = await prisma.freelancerSkill.findUnique({
        where: {
          freelancerProfileId_skillId: {
            freelancerProfileId: profile.id,
            skillId: skill.id
          }
        }
      })

      if (existingMapping) {
        skipped++
      } else {
        await prisma.freelancerSkill.create({
          data: {
            freelancerProfileId: profile.id,
            skillId: skill.id
          }
        })
        created++
      }
    }
  }

  console.log(`[Seed] Freelancer-Skill mappings done — Created: ${created}, Skipped (already exist): ${skipped}`)
  return { created, skipped }
}

async function seedCategories() {
  console.log('\n[Seed] === Seeding Categories ===')
  let created = 0
  let skipped = 0

  for (const name of CATEGORY_NAMES) {
    const existing = await prisma.category.findUnique({ where: { name } })
    if (existing) {
      skipped++
    } else {
      await prisma.category.create({ data: { name } })
      created++
    }
  }

  console.log(`[Seed] Categories done — Created: ${created}, Skipped (already exist): ${skipped}`)
  return { created, skipped }
}

async function seedProjects() {
  console.log('\n[Seed] === Seeding Projects + Project-Skill Mappings ===')
  let projCreated = 0
  let projSkipped = 0
  let skillMappingCreated = 0
  let skillMappingSkipped = 0

  // Pre-load category and skill lookups to avoid N+1 per project
  const allCategories = await prisma.category.findMany()
  const categoryMap = Object.fromEntries(allCategories.map(c => [c.name, c.id]))

  const allSkills = await prisma.skill.findMany()
  const skillMap = Object.fromEntries(allSkills.map(s => [s.name, s.id]))

  for (const p of PROJECTS) {
    // Resolve client user
    const clientUser = await prisma.user.findUnique({ where: { email: p.clientEmail } })
    if (!clientUser) {
      console.warn(`  [WARN] Client not found: ${p.clientEmail} — skipping project "${p.title}".`)
      continue
    }

    const categoryId = categoryMap[p.categoryName]
    if (!categoryId) {
      console.warn(`  [WARN] Category not found: ${p.categoryName} — skipping project "${p.title}".`)
      continue
    }

    // Idempotency: check by (title, clientId)
    const existingProject = await prisma.project.findFirst({
      where: { title: p.title, clientId: clientUser.id }
    })

    let project
    if (existingProject) {
      projSkipped++
      project = existingProject
    } else {
      project = await prisma.project.create({
        data: {
          clientId: clientUser.id,
          categoryId,
          title: p.title,
          description: p.description,
          budget: p.budget,
          deadline: p.deadline ? new Date(p.deadline) : null,
          experienceLevel: p.experienceLevel,
          status: p.status
        }
      })
      projCreated++
    }

    // Assign required skills
    for (const skillName of (p.skills || [])) {
      const skillId = skillMap[skillName]
      if (!skillId) {
        console.warn(`  [WARN] Skill "${skillName}" not found — skipping mapping for project "${p.title}".`)
        continue
      }

      const existingMapping = await prisma.projectSkill.findUnique({
        where: { projectId_skillId: { projectId: project.id, skillId } }
      })

      if (existingMapping) {
        skillMappingSkipped++
      } else {
        await prisma.projectSkill.create({
          data: { projectId: project.id, skillId }
        })
        skillMappingCreated++
      }
    }
  }

  console.log(`[Seed] Projects done — Created: ${projCreated}, Skipped: ${projSkipped}`)
  console.log(`[Seed] Project-Skill mappings done — Created: ${skillMappingCreated}, Skipped: ${skillMappingSkipped}`)
  return { projCreated, projSkipped, skillMappingCreated, skillMappingSkipped }
}

async function seedPortfolios() {
  console.log('\n[Seed] === Seeding Freelancer Portfolio Projects + Skills ===')
  let portCreated = 0
  let portSkipped = 0
  let portSkillCreated = 0
  let portSkillSkipped = 0

  const allSkills = await prisma.skill.findMany()
  const skillMap = Object.fromEntries(allSkills.map(s => [s.name, s.id]))

  for (const item of PORTFOLIO_PROJECTS) {
    const user = await prisma.user.findUnique({ where: { email: item.freelancerEmail } })
    if (!user) {
      console.warn(`  [WARN] Freelancer user not found: ${item.freelancerEmail} — skipping portfolio "${item.title}".`)
      continue
    }

    const profile = await prisma.freelancerProfile.findUnique({ where: { userId: user.id } })
    if (!profile) {
      console.warn(`  [WARN] FreelancerProfile not found for: ${item.freelancerEmail} — skipping portfolio "${item.title}".`)
      continue
    }

    // Idempotency: check by (freelancerProfileId, title)
    const existing = await prisma.portfolioProject.findFirst({
      where: { freelancerProfileId: profile.id, title: item.title }
    })

    let portfolio
    if (existing) {
      portSkipped++
      portfolio = existing
    } else {
      portfolio = await prisma.portfolioProject.create({
        data: {
          freelancerProfileId: profile.id,
          title: item.title,
          description: item.description,
          projectUrl: item.projectUrl,
          imageUrl: item.imageUrl
        }
      })
      portCreated++
    }

    // Map skills for portfolio project
    for (const skillName of (item.skills || [])) {
      const skillId = skillMap[skillName]
      if (!skillId) {
        console.warn(`  [WARN] Skill "${skillName}" not found — skipping mapping for portfolio "${item.title}".`)
        continue
      }

      const existingMapping = await prisma.portfolioProjectSkill.findUnique({
        where: {
          portfolioProjectId_skillId: {
            portfolioProjectId: portfolio.id,
            skillId
          }
        }
      })

      if (existingMapping) {
        portSkillSkipped++
      } else {
        await prisma.portfolioProjectSkill.create({
          data: {
            portfolioProjectId: portfolio.id,
            skillId
          }
        })
        portSkillCreated++
      }
    }
  }

  console.log(`[Seed] Portfolios done — Created: ${portCreated}, Skipped: ${portSkipped}`)
  console.log(`[Seed] Portfolio-Skill mappings done — Created: ${portSkillCreated}, Skipped: ${portSkillSkipped}`)
  return { portCreated, portSkipped, portSkillCreated, portSkillSkipped }
}

async function seedProposals() {
  console.log('\n[Seed] === Seeding Proposals ===')
  let created = 0
  let skipped = 0

  const allProjects = await prisma.project.findMany({ select: { id: true, title: true } })
  const projectMap = Object.fromEntries(allProjects.map(p => [p.title, p.id]))

  const allFreelancers = await prisma.user.findMany({
    where: { role: 'FREELANCER' },
    select: { id: true, email: true, freelancerProfile: { select: { id: true } } }
  })
  const freelancerProfileMap = Object.fromEntries(
    allFreelancers.filter(f => f.freelancerProfile).map(f => [f.email, f.freelancerProfile.id])
  )

  for (const item of PROPOSALS) {
    const projectId = projectMap[item.projectTitle]
    if (!projectId) {
      console.warn(`  [WARN] Project "${item.projectTitle}" not found — skipping proposal.`)
      continue
    }

    const freelancerProfileId = freelancerProfileMap[item.freelancerEmail]
    if (!freelancerProfileId) {
      console.warn(`  [WARN] FreelancerProfile for "${item.freelancerEmail}" not found — skipping proposal.`)
      continue
    }

    const existing = await prisma.proposal.findUnique({
      where: {
        projectId_freelancerProfileId: {
          projectId,
          freelancerProfileId
        }
      }
    })

    if (existing) {
      skipped++
    } else {
      await prisma.proposal.create({
        data: {
          projectId,
          freelancerProfileId,
          proposedPrice: item.proposedPrice,
          estimatedDays: item.estimatedDays,
          status: item.status,
          coverLetter: item.coverLetter
        }
      })
      created++
    }
  }

  console.log(`[Seed] Proposals done — Created: ${created}, Skipped: ${skipped}`)
  return { created, skipped }
}

async function seedContracts() {
  console.log('\n[Seed] === Seeding Contracts from Accepted Proposals ===')
  let created = 0
  let skipped = 0

  // Find all ACCEPTED proposals with their related project and freelancerProfile
  const acceptedProposals = await prisma.proposal.findMany({
    where: { status: 'ACCEPTED' },
    include: {
      project: { select: { id: true, clientId: true, status: true } },
      freelancerProfile: { select: { id: true, userId: true } }
    }
  })

  for (const proposal of acceptedProposals) {
    // Check if contract already exists for this proposal
    const existing = await prisma.contract.findUnique({
      where: { proposalId: proposal.id }
    })

    if (existing) {
      skipped++
    } else {
      // Determine contract status and dates from project status
      const isCompleted = proposal.project.status === 'COMPLETED'
      const contractStatus = isCompleted ? 'COMPLETED' : 'ACTIVE'
      const startDate = isCompleted
        ? new Date('2026-07-15T09:00:00Z')
        : new Date('2026-08-10T09:00:00Z')
      const endDate = isCompleted
        ? new Date('2026-08-05T18:00:00Z')
        : null

      await prisma.contract.create({
        data: {
          projectId: proposal.projectId,
          proposalId: proposal.id,
          clientId: proposal.project.clientId,
          freelancerId: proposal.freelancerProfile.userId,
          agreedAmount: proposal.proposedPrice,
          startDate,
          endDate,
          status: contractStatus
        }
      })
      created++
    }
  }

  console.log(`[Seed] Contracts done — Created: ${created}, Skipped: ${skipped}`)
  return { created, skipped }
}

async function seedReviews() {
  console.log('\n[Seed] === Seeding Reviews for Completed Contracts ===')
  let created = 0
  let skipped = 0

  // Comments & ratings mapped by project title
  const REVIEW_DATA = {
    'Heritage Hotel Direct Booking Engine': {
      rating: 5,
      comment: 'Shubham did a stellar job building our hotel booking engine. The room availability calendar and Razorpay integration work seamlessly. Completed well within the agreed timeframe.'
    },
    'Interior Design Studio Website UX': {
      rating: 5,
      comment: 'Sneha is a fantastic designer. She deeply understood our aesthetic requirements and delivered an intuitive, elegant website prototype that our clients love.'
    },
    'Gourmet Spice Brand Packaging Design': {
      rating: 5,
      comment: 'Aishwarya created gorgeous packaging for our entire 15-SKU spice line. The print-ready die lines were flawless and vendors had zero issues during production.'
    },
    'Handmade Jewellery Brand Visual Identity': {
      rating: 4,
      comment: 'Great communication and creative execution. The brand identity and social media templates elevated our jewellery line significantly.'
    },
    'Spice Brand Amazon & Organic SEO Campaign': {
      rating: 5,
      comment: 'Priyanka helped boost our Amazon organic ranking and optimized all our product listings. We saw a noticeable uptick in organic sales within 3 weeks.'
    }
  }

  // Find all COMPLETED contracts with project and client/freelancer info
  const completedContracts = await prisma.contract.findMany({
    where: { status: 'COMPLETED' },
    include: {
      project: { select: { id: true, title: true } }
    }
  })

  for (const contract of completedContracts) {
    const existing = await prisma.review.findUnique({
      where: { contractId: contract.id }
    })

    if (existing) {
      skipped++
    } else {
      const reviewInfo = REVIEW_DATA[contract.project.title] || {
        rating: 5,
        comment: 'Great work, prompt communication and on-time delivery.'
      }

      await prisma.review.create({
        data: {
          projectId: contract.projectId,
          contractId: contract.id,
          reviewerId: contract.clientId,
          reviewedUserId: contract.freelancerId,
          rating: reviewInfo.rating,
          comment: reviewInfo.comment
        }
      })
      created++
    }
  }

  console.log(`[Seed] Reviews done — Created: ${created}, Skipped: ${skipped}`)
  return { created, skipped }
}

async function seedPayments() {
  console.log('\n[Seed] === Seeding Payments for Contracts ===')
  let created = 0
  let skipped = 0

  // Find all contracts with clientId and freelancerId
  const allContracts = await prisma.contract.findMany({
    include: {
      project: { select: { id: true, title: true } }
    }
  })

  for (const contract of allContracts) {
    // Idempotency: check by contractId (since contractId is @unique on Payment)
    const existing = await prisma.payment.findUnique({
      where: { contractId: contract.id }
    })

    if (existing) {
      skipped++
    } else {
      // Completed contracts -> COMPLETED payment
      // Active contracts -> PENDING payment (funds in escrow awaiting project delivery)
      const isCompleted = contract.status === 'COMPLETED'
      const paymentStatus = isCompleted ? 'COMPLETED' : 'PENDING'
      const createdAt = isCompleted
        ? (contract.endDate || new Date('2026-08-05T18:00:00Z'))
        : (contract.startDate || new Date('2026-08-10T09:00:00Z'))

      await prisma.payment.create({
        data: {
          contractId: contract.id,
          payerId: contract.clientId,
          receiverId: contract.freelancerId,
          amount: contract.agreedAmount,
          status: paymentStatus,
          createdAt
        }
      })
      created++
    }
  }

  console.log(`[Seed] Payments done — Created: ${created}, Skipped: ${skipped}`)
  return { created, skipped }
}

// ─── CONVERSATIONS & MESSAGES ────────────────────────────────────────────────
// 16 realistic customer-freelancer conversations (74 total messages)

const CONVERSATIONS = [
  // 1. Heritage Hotel Direct Booking Engine (COMPLETED contract)
  {
    clientEmail: 'ritika.bahl@luxurystay.in',
    freelancerEmail: 'shubham@gmail.com',
    messages: [
      { senderEmail: 'ritika.bahl@luxurystay.in', content: 'Hi Shubham, we received your proposal for the direct booking engine. Can this handle multi-room selection and seasonal weekend pricing tariffs?', sentOffsetMinutes: 20000, isRead: true },
      { senderEmail: 'shubham@gmail.com', content: 'Hello Ritika! Yes, absolutely. I have built custom dynamic pricing logic before. We can set weekend surge rules and seasonal discount tiers.', sentOffsetMinutes: 19800, isRead: true },
      { senderEmail: 'ritika.bahl@luxurystay.in', content: 'That sounds great. We have accepted your proposal and initiated the milestone.', sentOffsetMinutes: 19500, isRead: true },
      { senderEmail: 'shubham@gmail.com', content: 'Thank you! I have completed the Razorpay sandbox integration and room availability calendar. Please test via the staging link: staging.luxurystay.in/book', sentOffsetMinutes: 8000, isRead: true },
      { senderEmail: 'ritika.bahl@luxurystay.in', content: 'Tested the end-to-end payment and booking flow. Everything is working smoothly!', sentOffsetMinutes: 5000, isRead: true },
      { senderEmail: 'shubham@gmail.com', content: 'Awesome! Handed over the production credentials and documentation. Pleasure working with you!', sentOffsetMinutes: 4800, isRead: true }
    ]
  },

  // 2. SaaS Customer Dashboard with Usage Analytics (ACTIVE contract)
  {
    clientEmail: 'rahul.bhatia@cloudqube.in',
    freelancerEmail: 'shubham@gmail.com',
    messages: [
      { senderEmail: 'rahul.bhatia@cloudqube.in', content: 'Hi Shubham, wanted to check if you have experience with Chart.js or Recharts for rendering API usage histograms?', sentOffsetMinutes: 9000, isRead: true },
      { senderEmail: 'shubham@gmail.com', content: 'Hi Rahul, yes! I have used Recharts extensively with React and TypeScript for time-series aggregation.', sentOffsetMinutes: 8800, isRead: true },
      { senderEmail: 'rahul.bhatia@cloudqube.in', content: 'Perfect. We are glad to have you on board for this dashboard build.', sentOffsetMinutes: 8500, isRead: true },
      { senderEmail: 'shubham@gmail.com', content: 'Sharing a quick progress update: Completed authentication, RBAC middleware, and the usage metrics endpoint. Working on dark mode charts next.', sentOffsetMinutes: 2000, isRead: true },
      { senderEmail: 'rahul.bhatia@cloudqube.in', content: 'Looks solid! Please ensure export to CSV is available for the billing breakdown table.', sentOffsetMinutes: 1200, isRead: true }
    ]
  },

  // 3. Interior Design Studio Website UX (COMPLETED contract)
  {
    clientEmail: 'neha.joshi@studioneha.in',
    freelancerEmail: 'sneha.kulkarni@freelancehub.dev',
    messages: [
      { senderEmail: 'neha.joshi@studioneha.in', content: 'Hi Sneha, loved your portfolio on design systems! We want a minimalist, earth-toned look for our interior studio website.', sentOffsetMinutes: 18000, isRead: true },
      { senderEmail: 'sneha.kulkarni@freelancehub.dev', content: 'Hi Neha, thank you! I would love to help. I envision large visual hero grids and an interactive project lookbook.', sentOffsetMinutes: 17800, isRead: true },
      { senderEmail: 'neha.joshi@studioneha.in', content: 'That matches our brand vision completely. Contract approved!', sentOffsetMinutes: 17500, isRead: true },
      { senderEmail: 'sneha.kulkarni@freelancehub.dev', content: 'Here is the Figma link with complete wireframes, mood boards, and responsive prototypes.', sentOffsetMinutes: 6000, isRead: true },
      { senderEmail: 'neha.joshi@studioneha.in', content: 'The design is breathtaking! Feedback incorporated and contract marked as completed. Left you a 5-star review!', sentOffsetMinutes: 4000, isRead: true }
    ]
  },

  // 4. Investment Advisory App UI Redesign (ACTIVE contract)
  {
    clientEmail: 'siddharth.kapoor@bluechipinvest.co.in',
    freelancerEmail: 'sneha.kulkarni@freelancehub.dev',
    messages: [
      { senderEmail: 'siddharth.kapoor@bluechipinvest.co.in', content: 'Hi Sneha, our investment advisory platform needs to build trust while displaying dense portfolio metrics.', sentOffsetMinutes: 8000, isRead: true },
      { senderEmail: 'sneha.kulkarni@freelancehub.dev', content: 'Hello Siddharth! I specialize in fintech UX. We should use clear visual hierarchy and collapsible risk indicator cards.', sentOffsetMinutes: 7800, isRead: true },
      { senderEmail: 'siddharth.kapoor@bluechipinvest.co.in', content: 'Agreed. Let us kick off the project.', sentOffsetMinutes: 7500, isRead: true },
      { senderEmail: 'sneha.kulkarni@freelancehub.dev', content: 'I have shared the first draft of the portfolio breakdown screen on Figma. Please take a look at the asset allocation pie chart.', sentOffsetMinutes: 2500, isRead: true },
      { senderEmail: 'siddharth.kapoor@bluechipinvest.co.in', content: 'Reviewing with the team now. The typography and color coding look very professional.', sentOffsetMinutes: 1000, isRead: true }
    ]
  },

  // 5. Gourmet Spice Brand Packaging Design (COMPLETED contract)
  {
    clientEmail: 'rupali.tendulkar@saffronspice.in',
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    messages: [
      { senderEmail: 'rupali.tendulkar@saffronspice.in', content: 'Hi Aishwarya, we need premium pouch and tin packaging for 15 authentic Indian spice blends.', sentOffsetMinutes: 16000, isRead: true },
      { senderEmail: 'aishwarya.bhatt@freelancehub.dev', content: 'Hello Rupali! I can design heritage botanical illustrations with gold-foil accents and print-ready die lines.', sentOffsetMinutes: 15800, isRead: true },
      { senderEmail: 'rupali.tendulkar@saffronspice.in', content: 'Accepted your proposal. Can you start with the Garam Masala and Kashmiri Chilli pouches?', sentOffsetMinutes: 15500, isRead: true },
      { senderEmail: 'aishwarya.bhatt@freelancehub.dev', content: 'Sharing the vector print files and 3D mockups for the first 5 SKUs. Die lines are calibrated for 100g and 250g pouches.', sentOffsetMinutes: 7000, isRead: true },
      { senderEmail: 'rupali.tendulkar@saffronspice.in', content: 'Our packaging printer verified the vectors. Print quality is outstanding!', sentOffsetMinutes: 5000, isRead: true },
      { senderEmail: 'aishwarya.bhatt@freelancehub.dev', content: 'Wonderful! Final files for all 15 SKUs have been uploaded to the drive.', sentOffsetMinutes: 4500, isRead: true }
    ]
  },

  // 6. Handmade Jewellery Brand Visual Identity (COMPLETED contract)
  {
    clientEmail: 'nandini.bose@artisancraft.in',
    freelancerEmail: 'aishwarya.bhatt@freelancehub.dev',
    messages: [
      { senderEmail: 'nandini.bose@artisancraft.in', content: 'Hi Aishwarya, we are launching an artisan silver jewellery brand on Instagram and Etsy.', sentOffsetMinutes: 14000, isRead: true },
      { senderEmail: 'aishwarya.bhatt@freelancehub.dev', content: 'Hi Nandini! I will design a modern luxury logo mark, typography guide, and product unboxing insert cards.', sentOffsetMinutes: 13800, isRead: true },
      { senderEmail: 'nandini.bose@artisancraft.in', content: 'Sounds perfect. Excited to work together!', sentOffsetMinutes: 13500, isRead: true },
      { senderEmail: 'aishwarya.bhatt@freelancehub.dev', content: 'Here is the brand kit with vector logos, color palette, and editable Instagram story templates.', sentOffsetMinutes: 6000, isRead: true },
      { senderEmail: 'nandini.bose@artisancraft.in', content: 'The gold and ivory color palette is gorgeous! Completed the contract and left a review.', sentOffsetMinutes: 4000, isRead: true }
    ]
  },

  // 7. Spice Brand Amazon & Organic SEO Campaign (COMPLETED contract)
  {
    clientEmail: 'rupali.tendulkar@saffronspice.in',
    freelancerEmail: 'priyanka.dubey@freelancehub.dev',
    messages: [
      { senderEmail: 'rupali.tendulkar@saffronspice.in', content: 'Hi Priyanka, our Amazon spice listings have low organic discovery. Can you help optimize them?', sentOffsetMinutes: 15000, isRead: true },
      { senderEmail: 'priyanka.dubey@freelancehub.dev', content: 'Hi Rupali! Yes, I will perform high-intent keyword research, optimize backend search terms, and structure A+ content copy.', sentOffsetMinutes: 14800, isRead: true },
      { senderEmail: 'rupali.tendulkar@saffronspice.in', content: 'Let us proceed. Looking forward to ranking improvements.', sentOffsetMinutes: 14500, isRead: true },
      { senderEmail: 'priyanka.dubey@freelancehub.dev', content: 'Uploaded the revised titles, bullet points, and backend search terms for all 15 ASINs. Also submitted the on-page SEO recommendations.', sentOffsetMinutes: 6500, isRead: true },
      { senderEmail: 'rupali.tendulkar@saffronspice.in', content: 'We are already seeing our Kashmiri Chilli ranking in top 5 search results! Thank you for the great work.', sentOffsetMinutes: 3500, isRead: true }
    ]
  },

  // 8. Fashion Brand Reels Content Package (ACTIVE contract)
  {
    clientEmail: 'vikram.choudhary@trendsetters.in',
    freelancerEmail: 'saurabh.ghosh@freelancehub.dev',
    messages: [
      { senderEmail: 'vikram.choudhary@trendsetters.in', content: 'Hi Saurabh, we need 12 fast-paced fashion reels every month with trending audio for our ethnic wear launch.', sentOffsetMinutes: 7000, isRead: true },
      { senderEmail: 'saurabh.ghosh@freelancehub.dev', content: 'Hello Vikram! I can deliver beat-synced edits with dynamic text overlays, color grading, and vertical format optimization.', sentOffsetMinutes: 6800, isRead: true },
      { senderEmail: 'vikram.choudhary@trendsetters.in', content: 'Proposal accepted. Uploaded the raw 4K footage from our Jaipur shoot.', sentOffsetMinutes: 6500, isRead: true },
      { senderEmail: 'saurabh.ghosh@freelancehub.dev', content: 'Delivered the first batch of 4 reels via Vimeo review link. Please check the color grade and transitions.', sentOffsetMinutes: 1800, isRead: true },
      { senderEmail: 'vikram.choudhary@trendsetters.in', content: 'These look high-energy and trendy! Minor tweak on the price tag animation on reel #2, otherwise approved.', sentOffsetMinutes: 800, isRead: true }
    ]
  },

  // 9. Cloud Kitchen Food Ordering App (Discussion)
  {
    clientEmail: 'pooja.kulkarni@flavourfusion.in',
    freelancerEmail: 'pooja.menon@freelancehub.dev',
    messages: [
      { senderEmail: 'pooja.kulkarni@flavourfusion.in', content: 'Hi Pooja, we saw your Flutter mobile apps. Can you build live GPS order tracking with Google Maps SDK?', sentOffsetMinutes: 5000, isRead: true },
      { senderEmail: 'pooja.menon@freelancehub.dev', content: 'Hi Pooja! Yes, I have built real-time rider tracking with WebSockets and Google Maps in Flutter for food delivery apps.', sentOffsetMinutes: 4800, isRead: true },
      { senderEmail: 'pooja.kulkarni@flavourfusion.in', content: 'What about push notifications for order status changes like Preparing and Out for delivery?', sentOffsetMinutes: 4500, isRead: true },
      { senderEmail: 'pooja.menon@freelancehub.dev', content: 'We can use Firebase Cloud Messaging (FCM) for instant background and foreground push notifications.', sentOffsetMinutes: 4200, isRead: true }
    ]
  },

  // 10. Pharma Inventory Management Mobile App (Discussion)
  {
    clientEmail: 'kiran.reddy@pharmabridge.in',
    freelancerEmail: 'jayesh.patil@freelancehub.dev',
    messages: [
      { senderEmail: 'kiran.reddy@pharmabridge.in', content: 'Hello Jayesh, our pharma distribution warehouse needs rapid barcode scanning even in poor lighting.', sentOffsetMinutes: 4500, isRead: true },
      { senderEmail: 'jayesh.patil@freelancehub.dev', content: 'Hi Kiran! We can use Google ML Kit Barcode Scanning API with camera torch toggle and batch scan mode.', sentOffsetMinutes: 4300, isRead: true },
      { senderEmail: 'kiran.reddy@pharmabridge.in', content: 'Will it work offline if warehouse Wi-Fi drops?', sentOffsetMinutes: 4000, isRead: true },
      { senderEmail: 'jayesh.patil@freelancehub.dev', content: 'Yes, all scan logs will save to local SQLite and auto-sync with your ERP REST API once connectivity resumes.', sentOffsetMinutes: 3800, isRead: true }
    ]
  },

  // 11. Telecom On-Premise to Cloud Migration (Discussion)
  {
    clientEmail: 'tarun.gupta@indiatelecom.in',
    freelancerEmail: 'vivek.nambiar@freelancehub.dev',
    messages: [
      { senderEmail: 'tarun.gupta@indiatelecom.in', content: 'Hi Vivek, we have 30 legacy on-premise services. What is your recommended phased migration strategy to AWS?', sentOffsetMinutes: 6000, isRead: true },
      { senderEmail: 'vivek.nambiar@freelancehub.dev', content: 'Hello Tarun! I recommend Phase 1 lift-and-shift with AWS Application Migration Service, followed by containerizing core services on EKS.', sentOffsetMinutes: 5800, isRead: true },
      { senderEmail: 'tarun.gupta@indiatelecom.in', content: 'How do we ensure minimal downtime during the database cutover?', sentOffsetMinutes: 5500, isRead: true },
      { senderEmail: 'vivek.nambiar@freelancehub.dev', content: 'We will use AWS DMS (Database Migration Service) with continuous CDC replication until final DNS cutover.', sentOffsetMinutes: 5200, isRead: true }
    ]
  },

  // 12. Jewellery Inventory Demand Forecasting (Discussion)
  {
    clientEmail: 'manish.shah@diamonddisplay.in',
    freelancerEmail: 'karthik.sundar@freelancehub.dev',
    messages: [
      { senderEmail: 'manish.shah@diamonddisplay.in', content: 'Hi Karthik, our jewellery retail stores have heavy seasonal spikes during Diwali and wedding seasons.', sentOffsetMinutes: 4800, isRead: true },
      { senderEmail: 'karthik.sundar@freelancehub.dev', content: 'Hello Manish! We can build a hierarchical forecasting model in Python considering festival calendars, gold price index, and historical store footfalls.', sentOffsetMinutes: 4600, isRead: true },
      { senderEmail: 'manish.shah@diamonddisplay.in', content: 'Can the output feed directly into our store managers weekly reorder sheets?', sentOffsetMinutes: 4400, isRead: true },
      { senderEmail: 'karthik.sundar@freelancehub.dev', content: 'Yes, we can generate automated CSV exports and an interactive Power BI dashboard for store-level recommendations.', sentOffsetMinutes: 4100, isRead: true }
    ]
  },

  // 13. Handloom Export Shopify Store Setup (Discussion)
  {
    clientEmail: 'sunita.agarwal@craftsbyhand.in',
    freelancerEmail: 'nilufar.shaikh@freelancehub.dev',
    messages: [
      { senderEmail: 'sunita.agarwal@craftsbyhand.in', content: 'Hi Nilufar, we want to sell handloom rugs and textiles to US and UK buyers. Can Shopify handle multi-currency checkout?', sentOffsetMinutes: 5200, isRead: true },
      { senderEmail: 'nilufar.shaikh@freelancehub.dev', content: 'Hi Sunita! Yes, with Shopify Markets we can enable local currency pricing (USD, GBP, EUR) and automatic geo-IP redirection.', sentOffsetMinutes: 5000, isRead: true },
      { senderEmail: 'sunita.agarwal@craftsbyhand.in', content: 'What about DHL international shipping rate calculations at checkout?', sentOffsetMinutes: 4700, isRead: true },
      { senderEmail: 'nilufar.shaikh@freelancehub.dev', content: 'I will configure carrier-calculated shipping rates with DHL Express so customers see exact delivery costs and duties.', sentOffsetMinutes: 4400, isRead: true }
    ]
  },

  // 14. CI/CD Pipeline for Security Tool Suite (Discussion)
  {
    clientEmail: 'pranav.kulkarni@cybersecin.in',
    freelancerEmail: 'mohit.rajput@freelancehub.dev',
    messages: [
      { senderEmail: 'pranav.kulkarni@cybersecin.in', content: 'Hi Mohit, we want to integrate automated container scanning into our GitHub Actions workflow.', sentOffsetMinutes: 4200, isRead: true },
      { senderEmail: 'mohit.rajput@freelancehub.dev', content: 'Hi Pranav! We can integrate Trivy and Grype to fail builds automatically if high/critical CVEs are detected.', sentOffsetMinutes: 4000, isRead: true },
      { senderEmail: 'pranav.kulkarni@cybersecin.in', content: 'Can we also configure blue-green deployments on our AWS EKS cluster?', sentOffsetMinutes: 3700, isRead: true },
      { senderEmail: 'mohit.rajput@freelancehub.dev', content: 'Yes, using Argo Rollouts we can automate traffic shifting with instant automated rollbacks on error spike.', sentOffsetMinutes: 3400, isRead: true }
    ]
  },

  // 15. Author Website Blog Content - 20 Articles (Discussion)
  {
    clientEmail: 'shweta.iyer@iyerbooks.in',
    freelancerEmail: 'swapna.reddy@freelancehub.dev',
    messages: [
      { senderEmail: 'shweta.iyer@iyerbooks.in', content: 'Hi Swapna, I need 20 blog articles exploring themes in contemporary Indian historical fiction.', sentOffsetMinutes: 3600, isRead: true },
      { senderEmail: 'swapna.reddy@freelancehub.dev', content: 'Hello Shweta! As a long-form writer with a literary background, I would love to write in-depth essays with engaging storytelling.', sentOffsetMinutes: 3400, isRead: true },
      { senderEmail: 'shweta.iyer@iyerbooks.in', content: 'Could you share a sample outline for the first article on regional translation trends?', sentOffsetMinutes: 3100, isRead: true },
      { senderEmail: 'swapna.reddy@freelancehub.dev', content: 'Certainly! I will send over a detailed 3-part outline with proposed headings and reference sources by this evening.', sentOffsetMinutes: 2800, isRead: true }
    ]
  },

  // 16. Farmer-to-Buyer B2B Marketplace (Discussion)
  {
    clientEmail: 'gaurav.tiwari@agritech.farm',
    freelancerEmail: 'deepa.krishnan@freelancehub.dev',
    messages: [
      { senderEmail: 'gaurav.tiwari@agritech.farm', content: 'Hi Deepa, we need a Business Analyst to map our farmer onboarding and mandi price negotiation workflows.', sentOffsetMinutes: 3200, isRead: true },
      { senderEmail: 'deepa.krishnan@freelancehub.dev', content: 'Hello Gaurav! I have extensive experience modeling B2B workflows in BPMN 2.0 and drafting functional specifications.', sentOffsetMinutes: 3000, isRead: true },
      { senderEmail: 'gaurav.tiwari@agritech.farm', content: 'We also need standard operating procedures (SOPs) for our field executive app.', sentOffsetMinutes: 2700, isRead: true },
      { senderEmail: 'deepa.krishnan@freelancehub.dev', content: 'I can deliver end-to-end process maps, user stories for the engineering team, and illustrated field SOP manuals.', sentOffsetMinutes: 2400, isRead: true }
    ]
  }
]

async function seedMessages() {
  console.log('\n[Seed] === Seeding Conversations & Messages ===')
  let convsCreated = 0
  let convsSkipped = 0
  let msgsCreated = 0
  let msgsSkipped = 0

  const now = new Date()

  // Pre-load all users into a lookup map
  const allUsers = await prisma.user.findMany({ select: { id: true, email: true } })
  const userMap = Object.fromEntries(allUsers.map(u => [u.email, u.id]))

  for (const item of CONVERSATIONS) {
    const clientUserId = userMap[item.clientEmail]
    const freelancerUserId = userMap[item.freelancerEmail]

    if (!clientUserId || !freelancerUserId) {
      console.warn(`  [WARN] Users not found for conversation (${item.clientEmail} <-> ${item.freelancerEmail}) — skipping.`)
      continue
    }

    // Check if conversation already exists between clientUserId and freelancerUserId
    const clientConvs = await prisma.conversationParticipant.findMany({
      where: { userId: clientUserId },
      select: { conversationId: true }
    })
    const clientConvIds = clientConvs.map(c => c.conversationId)

    const existingShared = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: { in: clientConvIds },
        userId: freelancerUserId
      }
    })

    let conversationId
    if (existingShared) {
      convsSkipped++
      conversationId = existingShared.conversationId
    } else {
      const conv = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: clientUserId },
              { userId: freelancerUserId }
            ]
          }
        }
      })
      convsCreated++
      conversationId = conv.id
    }

    // Create messages inside the conversation
    for (const msg of item.messages) {
      const senderId = userMap[msg.senderEmail]
      if (!senderId) {
        console.warn(`  [WARN] Sender ${msg.senderEmail} not found — skipping message.`)
        continue
      }

      // Check if message already exists
      const existingMsg = await prisma.message.findFirst({
        where: {
          conversationId,
          senderId,
          content: msg.content
        }
      })

      if (existingMsg) {
        msgsSkipped++
      } else {
        const sentAt = new Date(now.getTime() - (msg.sentOffsetMinutes || 100) * 60 * 1000)
        await prisma.message.create({
          data: {
            conversationId,
            senderId,
            content: msg.content,
            isRead: msg.isRead ?? true,
            sentAt
          }
        })
        msgsCreated++
      }
    }
  }

  console.log(`[Seed] Conversations done — Created: ${convsCreated}, Skipped: ${convsSkipped}`)
  console.log(`[Seed] Messages done — Created: ${msgsCreated}, Skipped: ${msgsSkipped}`)
  return { convsCreated, convsSkipped, msgsCreated, msgsSkipped }
}

// ─── REPORTS & MODERATION ───────────────────────────────────────────────────
// 16 realistic moderation reports across customers and freelancers

const REPORTS = [
  // 1. Customer -> Freelancer | PENDING
  {
    reporterEmail: 'amit.banerjee@calcuttatech.in',
    reportedUserEmail: 'shubham@gmail.com',
    reason: 'Unresponsive freelancer after initial milestone',
    description: 'The freelancer has not responded to chat inquiries for 4 days after accepting the initial milestone scope.',
    status: 'PENDING',
    offsetDays: 3,
    resolvedAtOffsetDays: null
  },

  // 2. Customer -> Freelancer | PENDING
  {
    reporterEmail: 'vikram.choudhary@trendsetters.in',
    reportedUserEmail: 'aryan.trivedi@freelancehub.dev',
    reason: 'Off-platform payment and communication solicitation',
    description: 'Freelancer requested in direct messages to move communication to personal WhatsApp and settle payments via Google Pay outside FreelanceHub.',
    status: 'PENDING',
    offsetDays: 2,
    resolvedAtOffsetDays: null
  },

  // 3. Customer -> Freelancer | PENDING
  {
    reporterEmail: 'pooja.kulkarni@flavourfusion.in',
    reportedUserEmail: 'rahul.pandey@freelancehub.dev',
    reason: 'Delayed milestone delivery without prior notice',
    description: 'Delivery deadline for Phase 1 backend APIs passed 3 days ago without any extension request or code commits.',
    status: 'PENDING',
    offsetDays: 4,
    resolvedAtOffsetDays: null
  },

  // 4. Customer -> Freelancer | UNDER_REVIEW
  {
    reporterEmail: 'kiran.reddy@pharmabridge.in',
    reportedUserEmail: 'vaibhav.joshi@freelancehub.dev',
    reason: 'Incomplete source code delivery in repository',
    description: 'The submitted repository is missing build configuration files and database seed scripts required for deployment.',
    status: 'UNDER_REVIEW',
    offsetDays: 6,
    resolvedAtOffsetDays: null
  },

  // 5. Customer -> Freelancer | UNDER_REVIEW
  {
    reporterEmail: 'tarun.gupta@indiatelecom.in',
    reportedUserEmail: 'mohit.rajput@freelancehub.dev',
    reason: 'Potential plagiarism in architectural documentation',
    description: 'The submitted architecture design document contains verbatim excerpts copied from public AWS whitepapers without project-specific customizations.',
    status: 'UNDER_REVIEW',
    offsetDays: 8,
    resolvedAtOffsetDays: null
  },

  // 6. Customer -> Freelancer | RESOLVED
  {
    reporterEmail: 'ritika.bahl@luxurystay.in',
    reportedUserEmail: 'vivek.nambiar@freelancehub.dev',
    reason: 'Quality dispute on initial prototype',
    description: 'Initial wireframes did not match the agreed luxury hotel theme. Admin mediated a revision session and milestone requirements were realigned.',
    status: 'RESOLVED',
    offsetDays: 15,
    resolvedAtOffsetDays: 13
  },

  // 7. Customer -> Freelancer | RESOLVED
  {
    reporterEmail: 'rupali.tendulkar@saffronspice.in',
    reportedUserEmail: 'jayesh.patil@freelancehub.dev',
    reason: 'Inappropriate tone during design review',
    description: 'Unprofessional remarks made during feedback exchange. Admin issued a formal conduct warning to the freelancer.',
    status: 'RESOLVED',
    offsetDays: 18,
    resolvedAtOffsetDays: 16
  },

  // 8. Customer -> Freelancer | DISMISSED
  {
    reporterEmail: 'siddharth.kapoor@bluechipinvest.co.in',
    reportedUserEmail: 'karthik.sundar@freelancehub.dev',
    reason: 'Dispute over design color scheme',
    description: 'Client filed complaint claiming color palette was unsatisfactory. Admin found the colors strictly followed the client-provided branding guidelines document.',
    status: 'DISMISSED',
    offsetDays: 20,
    resolvedAtOffsetDays: 19
  },

  // 9. Customer -> Freelancer | DISMISSED
  {
    reporterEmail: 'neha.joshi@studioneha.in',
    reportedUserEmail: 'nilufar.shaikh@freelancehub.dev',
    reason: 'Alleged missed deadline',
    description: 'Client claimed project was late, but audit log confirmed client provided required asset bundle 4 days after the scheduled kickoff date.',
    status: 'DISMISSED',
    offsetDays: 22,
    resolvedAtOffsetDays: 21
  },

  // 10. Freelancer -> Customer | PENDING
  {
    reporterEmail: 'sneha.kulkarni@freelancehub.dev',
    reportedUserEmail: 'rahul.bhatia@cloudqube.in',
    reason: 'Excessive out-of-scope revision demands',
    description: 'Client is requesting a complete UI rewrite for 8 additional admin screens not included in the original project specification.',
    status: 'PENDING',
    offsetDays: 2,
    resolvedAtOffsetDays: null
  },

  // 11. Freelancer -> Customer | PENDING
  {
    reporterEmail: 'aishwarya.bhatt@freelancehub.dev',
    reportedUserEmail: 'nandini.bose@artisancraft.in',
    reason: 'Milestone approval delay',
    description: 'Completed brand asset package was submitted 10 days ago with zero feedback or milestone approval from the client.',
    status: 'PENDING',
    offsetDays: 3,
    resolvedAtOffsetDays: null
  },

  // 12. Freelancer -> Customer | UNDER_REVIEW
  {
    reporterEmail: 'priyanka.dubey@freelancehub.dev',
    reportedUserEmail: 'manish.shah@diamonddisplay.in',
    reason: 'Demanding uncompensated urgent turnaround',
    description: 'Client changed product launch date and demanded 24-hour delivery of 15 SEO campaigns without agreed rush-order compensation.',
    status: 'UNDER_REVIEW',
    offsetDays: 5,
    resolvedAtOffsetDays: null
  },

  // 13. Freelancer -> Customer | UNDER_REVIEW
  {
    reporterEmail: 'saurabh.ghosh@freelancehub.dev',
    reportedUserEmail: 'sunita.agarwal@craftsbyhand.in',
    reason: 'Unresponsive client holding up video rendering',
    description: 'High-resolution brand raw footage requested 6 days ago. Without these files, video color grading and rendering cannot proceed.',
    status: 'UNDER_REVIEW',
    offsetDays: 7,
    resolvedAtOffsetDays: null
  },

  // 14. Freelancer -> Customer | RESOLVED
  {
    reporterEmail: 'pooja.menon@freelancehub.dev',
    reportedUserEmail: 'pranav.kulkarni@cybersecin.in',
    reason: 'Scope creep on mobile app APIs',
    description: 'Client requested 4 extra third-party SDK integrations. Admin mediated a change request resulting in a ₹15,000 budget addition.',
    status: 'RESOLVED',
    offsetDays: 14,
    resolvedAtOffsetDays: 12
  },

  // 15. Freelancer -> Customer | RESOLVED
  {
    reporterEmail: 'swapna.reddy@freelancehub.dev',
    reportedUserEmail: 'shweta.iyer@iyerbooks.in',
    reason: 'Delayed review on submitted manuscripts',
    description: 'Client was traveling and did not review submitted articles for 2 weeks. Admin contacted client and review was completed within 24 hours.',
    status: 'RESOLVED',
    offsetDays: 16,
    resolvedAtOffsetDays: 15
  },

  // 16. Freelancer -> Customer | DISMISSED
  {
    reporterEmail: 'deepa.krishnan@freelancehub.dev',
    reportedUserEmail: 'gaurav.tiwari@agritech.farm',
    reason: 'Dispute over requirement clarification meetings',
    description: 'Freelancer complained about having 2 weekly standup calls. Admin noted that project terms agreed to weekly sync meetings.',
    status: 'DISMISSED',
    offsetDays: 24,
    resolvedAtOffsetDays: 23
  }
]

async function seedReports() {
  console.log('\n[Seed] === Seeding Moderation Reports ===')
  let created = 0
  let skipped = 0

  const now = new Date()
  const allUsers = await prisma.user.findMany({ select: { id: true, email: true, role: true } })
  const userMap = Object.fromEntries(allUsers.map(u => [u.email, u.id]))
  const adminUser = allUsers.find(u => u.role === 'ADMIN' || u.email === (process.env.ADMIN_EMAIL || 'admin@freelancehub.com'))
  const adminId = adminUser ? adminUser.id : 1

  for (const item of REPORTS) {
    const reporterId = userMap[item.reporterEmail]
    const reportedUserId = userMap[item.reportedUserEmail]

    if (!reporterId || !reportedUserId) {
      console.warn(`  [WARN] User not found for report (${item.reporterEmail} -> ${item.reportedUserEmail}) — skipping.`)
      continue
    }

    // Check if report already exists for (reporterId, reportedUserId, reason)
    const existing = await prisma.report.findFirst({
      where: {
        reporterId,
        reportedUserId,
        reason: item.reason
      }
    })

    if (existing) {
      skipped++
    } else {
      const createdAt = new Date(now.getTime() - (item.offsetDays || 5) * 24 * 60 * 60 * 1000)

      // Determine resolvedById and resolvedAt based on status rules
      let resolvedById = null
      let resolvedAt = null

      if (item.status === 'UNDER_REVIEW') {
        resolvedById = adminId
        resolvedAt = null
      } else if (item.status === 'RESOLVED' || item.status === 'DISMISSED') {
        resolvedById = adminId
        resolvedAt = item.resolvedAtOffsetDays
          ? new Date(now.getTime() - item.resolvedAtOffsetDays * 24 * 60 * 60 * 1000)
          : new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000)
      }

      await prisma.report.create({
        data: {
          reporterId,
          reportedUserId,
          resolvedById,
          reason: item.reason,
          description: item.description,
          status: item.status,
          createdAt,
          resolvedAt
        }
      })
      created++
    }
  }

  console.log(`[Seed] Reports done — Created: ${created}, Skipped: ${skipped}`)
  return { created, skipped }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[Seed] ===== FreelanceHub Development Seed =====')

  console.log('[Seed] Step 1: Admin account')
  await seedAdmin()

  console.log('[Seed] Step 2: Customer accounts + profiles')
  await seedCustomers()

  console.log('[Seed] Step 3: Freelancer accounts + profiles')
  await seedFreelancers()

  console.log('[Seed] Step 4: Skills')
  await seedSkills()

  console.log('[Seed] Step 5: Freelancer-skill mappings')
  await seedFreelancerSkills()

  console.log('[Seed] Step 6: Categories')
  await seedCategories()

  console.log('[Seed] Step 7: Projects + Project-Skill mappings')
  await seedProjects()

  console.log('[Seed] Step 8: Freelancer Portfolio projects + Skills')
  await seedPortfolios()

  console.log('[Seed] Step 9: Project Proposals')
  await seedProposals()

  console.log('[Seed] Step 10: Contracts from Accepted Proposals')
  await seedContracts()

  console.log('[Seed] Step 11: Reviews for Completed Contracts')
  await seedReviews()

  console.log('[Seed] Step 12: Payments for Contracts')
  await seedPayments()

  console.log('[Seed] Step 13: Conversations & Messages')
  await seedMessages()

  console.log('[Seed] Step 14: Moderation Reports')
  await seedReports()

  // ── Final Verification ───────────────────────────────────────────────────
  console.log('\n[Seed] ===== FINAL VERIFICATION =====')

  const usersByRole = await prisma.user.groupBy({ by: ['role'], _count: { id: true } })
  for (const r of usersByRole) {
    console.log(`  ${r.role}: ${r._count.id} user(s)`)
  }

  const cpCount = await prisma.customerProfile.count()
  const fpCount = await prisma.freelancerProfile.count()
  console.log(`  CustomerProfiles: ${cpCount}`)
  console.log(`  FreelancerProfiles: ${fpCount}`)

  const skillCount = await prisma.skill.count()
  console.log(`  Skills: ${skillCount}`)

  const fskillCount = await prisma.freelancerSkill.count()
  console.log(`  Freelancer-Skill mappings: ${fskillCount}`)

  // Verify every freelancer has at least one skill
  const freelancerProfiles = await prisma.freelancerProfile.findMany({ select: { id: true, userId: true } })
  let noSkillCount = 0
  for (const fp of freelancerProfiles) {
    const mappings = await prisma.freelancerSkill.count({ where: { freelancerProfileId: fp.id } })
    if (mappings === 0) noSkillCount++
  }
  console.log(`  Freelancer profiles with 0 skills: ${noSkillCount}`)

  // Orphan check — FreelancerSkill rows pointing to missing profiles or skills
  const orphanFS = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM FreelancerSkill fs
    LEFT JOIN FreelancerProfile fp ON fs.freelancerProfileId = fp.id
    LEFT JOIN Skill s ON fs.skillId = s.id
    WHERE fp.id IS NULL OR s.id IS NULL
  `
  console.log(`  Orphan Freelancer-Skill mappings: ${Number(orphanFS[0].cnt)}`)

  // Duplicate skill names
  const dupSkills = await prisma.$queryRaw`SELECT name, COUNT(*) as cnt FROM Skill GROUP BY name HAVING cnt > 1`
  console.log(`  Duplicate skill names: ${dupSkills.length}`)

  const catCount = await prisma.category.count()
  console.log(`  Categories: ${catCount}`)

  const dupCats = await prisma.$queryRaw`SELECT name, COUNT(*) as cnt FROM Category GROUP BY name HAVING cnt > 1`
  console.log(`  Duplicate categories: ${dupCats.length}`)

  const projectCount = await prisma.project.count()
  console.log(`  Projects: ${projectCount}`)

  const pskillCount = await prisma.projectSkill.count()
  console.log(`  Project-Skill mappings: ${pskillCount}`)

  // Every project has at least 1 skill
  const allProjects = await prisma.project.findMany({ select: { id: true } })
  let projNoSkill = 0
  for (const proj of allProjects) {
    const cnt = await prisma.projectSkill.count({ where: { projectId: proj.id } })
    if (cnt === 0) projNoSkill++
  }
  console.log(`  Projects with 0 required skills: ${projNoSkill}`)

  // Orphan projects (client missing)
  const orphanProj = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Project p
    LEFT JOIN User u ON p.clientId = u.id
    WHERE u.id IS NULL
  `
  console.log(`  Orphan Projects (missing client): ${Number(orphanProj[0].cnt)}`)

  // Orphan project-skill mappings
  const orphanPS = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM ProjectSkill ps
    LEFT JOIN Project p ON ps.projectId = p.id
    LEFT JOIN Skill s ON ps.skillId = s.id
    WHERE p.id IS NULL OR s.id IS NULL
  `
  console.log(`  Orphan Project-Skill mappings: ${Number(orphanPS[0].cnt)}`)

  // Duplicate project-skill check
  const dupPS = await prisma.$queryRaw`SELECT projectId, skillId, COUNT(*) as cnt FROM ProjectSkill GROUP BY projectId, skillId HAVING cnt > 1`
  console.log(`  Duplicate Project-Skill mappings: ${dupPS.length}`)

  // ── Portfolio Verification ──
  const portfolioCount = await prisma.portfolioProject.count()
  console.log(`  Portfolio Projects: ${portfolioCount}`)

  const portSkillMapCount = await prisma.portfolioProjectSkill.count()
  console.log(`  Portfolio-Skill mappings: ${portSkillMapCount}`)

  // Orphan Portfolio Projects (missing freelancerProfile)
  const orphanPort = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM PortfolioProject pp
    LEFT JOIN FreelancerProfile fp ON pp.freelancerProfileId = fp.id
    WHERE fp.id IS NULL
  `
  console.log(`  Orphan Portfolio Projects: ${Number(orphanPort[0].cnt)}`)

  // Orphan Portfolio-Skill mappings
  const orphanPortSkill = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM PortfolioProjectSkill pps
    LEFT JOIN PortfolioProject pp ON pps.portfolioProjectId = pp.id
    LEFT JOIN Skill s ON pps.skillId = s.id
    WHERE pp.id IS NULL OR s.id IS NULL
  `
  console.log(`  Orphan Portfolio-Skill mappings: ${Number(orphanPortSkill[0].cnt)}`)

  // Duplicate portfolio projects per freelancer check
  const dupPort = await prisma.$queryRaw`
    SELECT freelancerProfileId, title, COUNT(*) as cnt
    FROM PortfolioProject
    GROUP BY freelancerProfileId, title
    HAVING cnt > 1
  `
  console.log(`  Duplicate Portfolio records: ${dupPort.length}`)

  // Freelancers without portfolio items
  let fpWithoutPortfolio = 0
  for (const fp of freelancerProfiles) {
    const pCount = await prisma.portfolioProject.count({ where: { freelancerProfileId: fp.id } })
    if (pCount === 0) fpWithoutPortfolio++
  }
  console.log(`  Freelancers with 0 portfolio items: ${fpWithoutPortfolio}`)

  // ── Proposals Verification ──
  const proposalCount = await prisma.proposal.count()
  console.log(`  Proposals: ${proposalCount}`)

  // Orphan Proposals
  const orphanProposals = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Proposal p
    LEFT JOIN Project pr ON p.projectId = pr.id
    LEFT JOIN FreelancerProfile fp ON p.freelancerProfileId = fp.id
    WHERE pr.id IS NULL OR fp.id IS NULL
  `
  console.log(`  Orphan Proposals: ${Number(orphanProposals[0].cnt)}`)

  // Duplicate Proposals per (projectId, freelancerProfileId)
  const dupProposals = await prisma.$queryRaw`
    SELECT projectId, freelancerProfileId, COUNT(*) as cnt
    FROM Proposal
    GROUP BY projectId, freelancerProfileId
    HAVING cnt > 1
  `
  console.log(`  Duplicate Proposals: ${dupProposals.length}`)

  // Proposal status distribution
  const proposalStatusCounts = await prisma.proposal.groupBy({
    by: ['status'],
    _count: { id: true }
  })
  console.log(`  Proposal Status Breakdown: ${JSON.stringify(Object.fromEntries(proposalStatusCounts.map(s => [s.status, s._count.id])))}`)

  // ── Contracts Verification ──
  const acceptedCount = await prisma.proposal.count({ where: { status: 'ACCEPTED' } })
  const contractCount = await prisma.contract.count()
  const completedContractCount = await prisma.contract.count({ where: { status: 'COMPLETED' } })
  console.log(`  Accepted Proposals: ${acceptedCount}`)
  console.log(`  Contracts: ${contractCount}`)
  console.log(`  Completed Contracts: ${completedContractCount}`)

  // Non-accepted proposal contracts check
  const nonAcceptedContracts = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Contract c
    JOIN Proposal p ON c.proposalId = p.id
    WHERE p.status != 'ACCEPTED'
  `
  console.log(`  Contracts linked to non-ACCEPTED proposals: ${Number(nonAcceptedContracts[0].cnt)}`)

  // Orphan Contracts (missing project, proposal, client, or freelancer)
  const orphanContracts = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Contract c
    LEFT JOIN Project p ON c.projectId = p.id
    LEFT JOIN Proposal pr ON c.proposalId = pr.id
    LEFT JOIN User cl ON c.clientId = cl.id
    LEFT JOIN User fl ON c.freelancerId = fl.id
    WHERE p.id IS NULL OR pr.id IS NULL OR cl.id IS NULL OR fl.id IS NULL
  `
  console.log(`  Orphan Contracts: ${Number(orphanContracts[0].cnt)}`)

  // Duplicate Contracts per projectId or proposalId
  const dupContractProjects = await prisma.$queryRaw`
    SELECT projectId, COUNT(*) as cnt FROM Contract GROUP BY projectId HAVING cnt > 1
  `
  const dupContractProposals = await prisma.$queryRaw`
    SELECT proposalId, COUNT(*) as cnt FROM Contract GROUP BY proposalId HAVING cnt > 1
  `
  console.log(`  Duplicate Contracts by projectId: ${dupContractProjects.length}`)
  console.log(`  Duplicate Contracts by proposalId: ${dupContractProposals.length}`)

  // Contract status distribution
  const contractStatusCounts = await prisma.contract.groupBy({
    by: ['status'],
    _count: { id: true }
  })
  console.log(`  Contract Status Breakdown: ${JSON.stringify(Object.fromEntries(contractStatusCounts.map(s => [s.status, s._count.id])))}`)

  // ── Reviews Verification ──
  const reviewCount = await prisma.review.count()
  console.log(`  Reviews: ${reviewCount}`)

  // Reviews on non-completed contracts
  const nonCompletedReviews = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Review r
    JOIN Contract c ON r.contractId = c.id
    WHERE c.status != 'COMPLETED'
  `
  console.log(`  Reviews on non-COMPLETED contracts: ${Number(nonCompletedReviews[0].cnt)}`)

  // Orphan Reviews (missing project, contract, reviewer, or reviewedUser)
  const orphanReviews = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Review r
    LEFT JOIN Project p ON r.projectId = p.id
    LEFT JOIN Contract c ON r.contractId = c.id
    LEFT JOIN User rev ON r.reviewerId = rev.id
    LEFT JOIN User revd ON r.reviewedUserId = revd.id
    WHERE p.id IS NULL OR c.id IS NULL OR rev.id IS NULL OR revd.id IS NULL
  `
  console.log(`  Orphan Reviews: ${Number(orphanReviews[0].cnt)}`)

  // Duplicate Reviews by contractId or projectId
  const dupReviewContracts = await prisma.$queryRaw`
    SELECT contractId, COUNT(*) as cnt FROM Review GROUP BY contractId HAVING cnt > 1
  `
  const dupReviewProjects = await prisma.$queryRaw`
    SELECT projectId, COUNT(*) as cnt FROM Review GROUP BY projectId HAVING cnt > 1
  `
  console.log(`  Duplicate Reviews by contractId: ${dupReviewContracts.length}`)
  console.log(`  Duplicate Reviews by projectId: ${dupReviewProjects.length}`)

  // Rating distribution
  const ratingDistribution = await prisma.review.groupBy({
    by: ['rating'],
    _count: { id: true }
  })
  console.log(`  Rating Distribution: ${JSON.stringify(Object.fromEntries(ratingDistribution.map(r => [r.rating, r._count.id])))}`)

  // ── Payments Verification ──
  const paymentCount = await prisma.payment.count()
  console.log(`  Payments: ${paymentCount}`)

  // Orphan Payments (missing contract, payer, or receiver)
  const orphanPayments = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Payment p
    LEFT JOIN Contract c ON p.contractId = c.id
    LEFT JOIN User payer ON p.payerId = payer.id
    LEFT JOIN User receiver ON p.receiverId = receiver.id
    WHERE c.id IS NULL OR payer.id IS NULL OR receiver.id IS NULL
  `
  console.log(`  Orphan Payments: ${Number(orphanPayments[0].cnt)}`)

  // Duplicate Payments by contractId
  const dupPayments = await prisma.$queryRaw`
    SELECT contractId, COUNT(*) as cnt FROM Payment GROUP BY contractId HAVING cnt > 1
  `
  console.log(`  Duplicate Payments by contractId: ${dupPayments.length}`)

  // Inconsistent payment amounts with contract agreedAmount
  const inconsistentAmounts = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Payment p
    JOIN Contract c ON p.contractId = c.id
    WHERE p.amount != c.agreedAmount
  `
  console.log(`  Payments with mismatched contract amount: ${Number(inconsistentAmounts[0].cnt)}`)

  // Completed contracts without COMPLETED payment
  const completedWithoutCompletedPayment = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Payment p
    JOIN Contract c ON p.contractId = c.id
    WHERE c.status = 'COMPLETED' AND p.status != 'COMPLETED'
  `
  console.log(`  Completed contracts without COMPLETED payment: ${Number(completedWithoutCompletedPayment[0].cnt)}`)

  // Active contracts without PENDING payment
  const activeWithoutPendingPayment = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Payment p
    JOIN Contract c ON p.contractId = c.id
    WHERE c.status = 'ACTIVE' AND p.status != 'PENDING'
  `
  console.log(`  Active contracts without PENDING payment: ${Number(activeWithoutPendingPayment[0].cnt)}`)

  // Payment status breakdown
  const paymentStatusCounts = await prisma.payment.groupBy({
    by: ['status'],
    _count: { id: true }
  })
  console.log(`  Payment Status Breakdown: ${JSON.stringify(Object.fromEntries(paymentStatusCounts.map(s => [s.status, s._count.id])))}`)

  // Total transaction volume sum
  const paymentSumResult = await prisma.payment.aggregate({
    _sum: { amount: true }
  })
  console.log(`  Total Transaction Volume: ₹${Number(paymentSumResult._sum.amount).toLocaleString('en-IN')}`)

  // ── Messaging Verification ──
  const conversationCount = await prisma.conversation.count()
  const messageCount = await prisma.message.count()
  console.log(`  Conversations: ${conversationCount}`)
  console.log(`  Messages: ${messageCount}`)

  // Conversations with invalid participants
  const invalidParticipants = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM ConversationParticipant cp
    LEFT JOIN User u ON cp.userId = u.id
    LEFT JOIN Conversation c ON cp.conversationId = c.id
    WHERE u.id IS NULL OR c.id IS NULL
  `
  console.log(`  Conversations with invalid participants: ${Number(invalidParticipants[0].cnt)}`)

  // Messages with invalid conversations
  const invalidMessages = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Message m
    LEFT JOIN Conversation c ON m.conversationId = c.id
    WHERE c.id IS NULL
  `
  console.log(`  Messages with invalid conversations: ${Number(invalidMessages[0].cnt)}`)

  // Messages sent by non-participants
  const nonParticipantMessages = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Message m
    LEFT JOIN ConversationParticipant cp ON m.conversationId = cp.conversationId AND m.senderId = cp.userId
    WHERE cp.userId IS NULL
  `
  console.log(`  Messages sent by non-participants: ${Number(nonParticipantMessages[0].cnt)}`)

  // Duplicate conversations (same two participants in multiple conversations)
  const dupConversations = await prisma.$queryRaw`
    SELECT cp1.userId as u1, cp2.userId as u2, COUNT(*) as cnt
    FROM ConversationParticipant cp1
    JOIN ConversationParticipant cp2 ON cp1.conversationId = cp2.conversationId AND cp1.userId < cp2.userId
    GROUP BY cp1.userId, cp2.userId
    HAVING cnt > 1
  `
  console.log(`  Duplicate Conversations: ${dupConversations.length}`)

  // ── Reports Verification ──
  const reportCount = await prisma.report.count()
  console.log(`  Reports: ${reportCount}`)

  // Status breakdown
  const reportStatusCounts = await prisma.report.groupBy({
    by: ['status'],
    _count: { id: true }
  })
  console.log(`  Report Status Breakdown: ${JSON.stringify(Object.fromEntries(reportStatusCounts.map(s => [s.status, s._count.id])))}`)

  // Orphan Reports (missing reporter or reportedUser)
  const orphanReports = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Report r
    LEFT JOIN User rep ON r.reporterId = rep.id
    LEFT JOIN User repd ON r.reportedUserId = repd.id
    WHERE rep.id IS NULL OR repd.id IS NULL
  `
  console.log(`  Orphan Reports: ${Number(orphanReports[0].cnt)}`)

  // Self reports (reporter == reportedUser)
  const selfReports = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Report WHERE reporterId = reportedUserId
  `
  console.log(`  Self Reports (reporter == reportedUser): ${Number(selfReports[0].cnt)}`)

  // Invalid resolver (resolvedById not pointing to valid user)
  const invalidResolvers = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Report r
    LEFT JOIN User res ON r.resolvedById = res.id
    WHERE r.resolvedById IS NOT NULL AND res.id IS NULL
  `
  console.log(`  Invalid Resolvers: ${Number(invalidResolvers[0].cnt)}`)

  // PENDING reports with non-null resolvedById or resolvedAt
  const invalidPendingReports = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Report
    WHERE status = 'PENDING' AND (resolvedById IS NOT NULL OR resolvedAt IS NOT NULL)
  `
  console.log(`  Invalid PENDING Reports (has resolver or resolvedAt): ${Number(invalidPendingReports[0].cnt)}`)

  // RESOLVED/DISMISSED reports missing resolver or resolvedAt
  const invalidCompletedReports = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM Report
    WHERE status IN ('RESOLVED', 'DISMISSED') AND (resolvedById IS NULL OR resolvedAt IS NULL)
  `
  console.log(`  Invalid RESOLVED/DISMISSED Reports (missing resolver or resolvedAt): ${Number(invalidCompletedReports[0].cnt)}`)

  // Duplicate reports by (reporterId, reportedUserId, reason)
  const dupReports = await prisma.$queryRaw`
    SELECT reporterId, reportedUserId, reason, COUNT(*) as cnt
    FROM Report
    GROUP BY reporterId, reportedUserId, reason
    HAVING cnt > 1
  `
  console.log(`  Duplicate Reports: ${dupReports.length}`)

  // Orphan check — profiles
  const orphanCP = await prisma.$queryRaw`SELECT COUNT(*) as cnt FROM CustomerProfile cp LEFT JOIN User u ON cp.userId = u.id WHERE u.id IS NULL`
  const orphanFP = await prisma.$queryRaw`SELECT COUNT(*) as cnt FROM FreelancerProfile fp LEFT JOIN User u ON fp.userId = u.id WHERE u.id IS NULL`
  console.log(`  Orphan CustomerProfiles: ${Number(orphanCP[0].cnt)}`)
  console.log(`  Orphan FreelancerProfiles: ${Number(orphanFP[0].cnt)}`)

  // Duplicate email check
  const dupEmails = await prisma.$queryRaw`SELECT email, COUNT(*) as cnt FROM User GROUP BY email HAVING cnt > 1`
  console.log(`  Duplicate emails: ${dupEmails.length}`)

  // Admin check
  const admin = await prisma.user.findUnique({ where: { email: process.env.ADMIN_EMAIL || 'admin@freelancehub.com' } })
  console.log(`  Admin account preserved: ${admin ? `YES (id: ${admin.id})` : 'NO — WARNING!'}`)

  console.log('\n[Seed] ===== SEED COMPLETE =====')
}

main()
  .catch((e) => {
    console.error('[Seed] Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
