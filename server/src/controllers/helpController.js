/**
 * Help & FAQ Data & Controller
 * Provides categorized knowledge base and search endpoint for Customer and Freelancer.
 */

export const faqData = [
  {
    category: 'Account',
    icon: 'UserRound',
    title: 'Account & Identity',
    description: 'Registration, sign in, profiles, credentials, and settings.',
    faqs: [
      {
        id: 'acc-1',
        question: 'How do I register as a Customer or Freelancer?',
        answer: 'You can choose between "Hire talent" (Customer) and "Find work" (Freelancer) during registration. A Customer can post projects and hire, while a Freelancer can apply to jobs and collaborate.',
        tags: ['register', 'signup', 'role', 'customer', 'freelancer']
      },
      {
        id: 'acc-2',
        question: 'How do I update my profile details and skills?',
        answer: 'Navigate to your Profile page in your workspace. Freelancers can customize their professional title, hourly rate, bio, availability, location, and verified skills. Customers can manage company name and location.',
        tags: ['profile', 'skills', 'bio', 'hourly rate', 'company']
      },
      {
        id: 'acc-3',
        question: 'How can I change my password?',
        answer: 'Go to Settings in your workspace. Enter your current password and your new password (minimum 6 characters) to securely update your credentials.',
        tags: ['password', 'security', 'settings', 'account']
      },
      {
        id: 'acc-4',
        question: 'What happens if an account is blocked?',
        answer: 'Blocked accounts cannot access workspace features or perform transactions. If you believe your account was blocked in error, file a support request via Customer Care.',
        tags: ['blocked', 'status', 'moderation', 'access']
      }
    ]
  },
  {
    category: 'Projects',
    icon: 'FolderKanban',
    title: 'Projects & Proposals',
    description: 'Creating project briefs, submitting proposals, and managing delivery.',
    faqs: [
      {
        id: 'proj-1',
        question: 'How do Customers post new projects?',
        answer: 'From the Customer workspace, go to "My projects" and click "Post a project". Provide a title, clear description, budget, category, required skills, experience level, and deadline.',
        tags: ['post project', 'create project', 'customer', 'brief']
      },
      {
        id: 'proj-2',
        question: 'How do Freelancers apply to open projects?',
        answer: 'Browse available projects under "Find work". Open any project in OPEN status, fill out your proposed price, estimated delivery duration, and cover letter, then click "Submit proposal".',
        tags: ['apply', 'proposals', 'find work', 'bid']
      },
      {
        id: 'proj-3',
        question: 'What are the different project statuses?',
        answer: 'Projects move from OPEN (accepting proposals) to IN_PROGRESS (when a contract is awarded), COMPLETED (work finished and approved), or CANCELLED.',
        tags: ['status', 'lifecycle', 'open', 'completed', 'in progress']
      },
      {
        id: 'proj-4',
        question: 'How is a contract formed after a proposal is accepted?',
        answer: 'When a customer accepts your proposal, a formal contract is automatically generated. Both parties can monitor progress and track payments in their Contracts view.',
        tags: ['contract', 'accept proposal', 'agreement']
      }
    ]
  },
  {
    category: 'Payments',
    icon: 'CircleDollarSign',
    title: 'Payments & Earnings',
    description: 'Transaction records, contract payments, and financial summaries.',
    faqs: [
      {
        id: 'pay-1',
        question: 'How do payments work on FreelanceHub?',
        answer: 'Payments are recorded per contract engagement. Payer and receiver details, amounts, and statuses (PENDING, COMPLETED, REFUNDED) are tracked in the database.',
        tags: ['payments', 'transactions', 'contract', 'finance']
      },
      {
        id: 'pay-2',
        question: 'Where can Freelancers view their received earnings?',
        answer: 'The Payments page in the Freelancer workspace displays total received earnings, individual transaction breakdowns, and counterparty customer details.',
        tags: ['earnings', 'freelancer', 'income', 'payout']
      },
      {
        id: 'pay-3',
        question: 'What should I do if there is a payment dispute?',
        answer: 'If there is an issue with payment release or amount calculation, first communicate through project messaging. If unresolved, submit a Support Ticket under "Payments" or file a Report.',
        tags: ['dispute', 'payment issue', 'refund', 'support']
      }
    ]
  },
  {
    category: 'Collaboration',
    icon: 'Sparkles',
    title: 'Freelancer Collaboration & Internships',
    description: 'Work together with other freelancers, mentorships, and verified experience.',
    faqs: [
      {
        id: 'collab-1',
        question: 'What is FreelanceHub Collaboration?',
        answer: 'FreelanceHub allows freelancers to create collaboration opportunities (such as project collaboration, assistance, team roles, or internships) to partner with other freelancers.',
        tags: ['collaboration', 'internship', 'fresher', 'team', 'experience']
      },
      {
        id: 'collab-2',
        question: 'How do freshers or inexperienced freelancers build verified work history?',
        answer: 'New freelancers can join open collaboration opportunities. Once the project owner completes the collaboration, a verified work experience entry is permanently added to the participant’s profile.',
        tags: ['verified', 'portfolio', 'fresher', 'experience', 'proof']
      },
      {
        id: 'collab-3',
        question: 'What compensation models are supported for collaboration?',
        answer: 'Opportunities can be designated as Unpaid (Internship/learning), Paid (stipend/fixed amount), or Negotiable based on mutual agreement between freelancers.',
        tags: ['paid', 'unpaid', 'stipend', 'compensation']
      },
      {
        id: 'collab-4',
        question: 'What is the difference between a self-added portfolio item and verified collaboration?',
        answer: 'Self-added portfolio items are user-submitted examples of past work. Verified collaborations are authenticated platform records tied to completed opportunities and confirmed by collaborating partners.',
        tags: ['verification', 'trust', 'portfolio vs collaboration']
      }
    ]
  },
  {
    category: 'Messaging',
    icon: 'MessageSquare',
    title: 'Real-Time Messaging & Communication',
    description: 'Direct conversations between customers, freelancers, and collaborators.',
    faqs: [
      {
        id: 'msg-1',
        question: 'Who can message whom on FreelanceHub?',
        answer: 'Customers can message Freelancers, and Freelancers can message other Freelancers (for collaboration). Direct messaging with Admin is restricted; admin communications take place via Customer Care Support tickets.',
        tags: ['messaging', 'rules', 'allowed', 'admin']
      },
      {
        id: 'msg-2',
        question: 'Are my conversations private and secure?',
        answer: 'Yes. All conversations require database authentication. Only verified participants of a conversation thread can read or send messages.',
        tags: ['privacy', 'security', 'authorization', 'chat']
      },
      {
        id: 'msg-3',
        question: 'Can I start a conversation from a project or freelancer profile?',
        answer: 'Yes. Clicking "Start a conversation" or "Message Customer" on any profile or project automatically opens or creates a direct thread.',
        tags: ['start chat', 'message freelancer', 'contact']
      }
    ]
  },
  {
    category: 'Reports & Safety',
    icon: 'Flag',
    title: 'Safety, Moderation & Reporting',
    description: 'Reporting misconduct, scam prevention, fraud handling, and safety.',
    faqs: [
      {
        id: 'rep-1',
        question: 'How do I report a fraudulent user or suspicious activity?',
        answer: 'Navigate to "Reports" in your workspace or use the report option on user profiles. Select the violation category (Fraud, Scam, Harassment, Fake Profile, etc.) and provide detailed documentation.',
        tags: ['report', 'fraud', 'scam', 'abuse', 'safety']
      },
      {
        id: 'rep-2',
        question: 'How are reports handled by the moderation team?',
        answer: 'Platform administrators review reports in the Moderation queue. Status progresses from PENDING to UNDER_REVIEW, then RESOLVED or DISMISSED with recorded resolution notes.',
        tags: ['moderation', 'admin', 'resolution', 'investigation']
      },
      {
        id: 'rep-3',
        question: 'Can I track the status of reports I submitted?',
        answer: 'Yes. All reports submitted by your account are visible in your workspace "Reports" tab with live status badges and resolution details.',
        tags: ['status', 'my reports', 'tracking']
      }
    ]
  }
]

export const getFaq = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase()
    const category = String(req.query.category || '').trim().toLowerCase()

    let results = faqData

    if (category) {
      results = results.filter((cat) => cat.category.toLowerCase() === category)
    }

    if (q) {
      results = results
        .map((cat) => {
          const matchedFaqs = cat.faqs.filter(
            (faq) =>
              faq.question.toLowerCase().includes(q) ||
              faq.answer.toLowerCase().includes(q) ||
              faq.tags.some((tag) => tag.toLowerCase().includes(q))
          )
          return matchedFaqs.length > 0 ? { ...cat, faqs: matchedFaqs } : null
        })
        .filter(Boolean)
    }

    return res.status(200).json({
      success: true,
      data: results,
      totalCategories: results.length,
      totalFaqs: results.reduce((sum, cat) => sum + cat.faqs.length, 0)
    })
  } catch (error) {
    console.error('FAQ fetch error:', error)
    return res.status(500).json({ success: false, message: 'Unable to load FAQ data' })
  }
}
