export type Skill = {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: "professional" | "creative" | "technical" | "academic" | "business";
};

export const skills: Skill[] = [
  { id: "lawyer", name: "Legal Counsel", icon: "scale", description: "Contracts, legal memos, compliance", category: "professional" },
  { id: "creative-writer", name: "Creative Writer", icon: "pen", description: "Stories, essays, scripts, poetry", category: "creative" },
  { id: "technical-recruiter", name: "Technical Recruiter", icon: "users", description: "Job descriptions, outreach, offers", category: "professional" },
  { id: "technical-writer", name: "Technical Writer", icon: "file-code", description: "API docs, guides, READMEs", category: "technical" },
  { id: "copywriter", name: "Copywriter", icon: "megaphone", description: "Marketing copy, landing pages, ads", category: "creative" },
  { id: "academic-researcher", name: "Academic Researcher", icon: "graduation-cap", description: "Research papers, literature reviews", category: "academic" },
  { id: "business-analyst", name: "Business Analyst", icon: "bar-chart", description: "BRDs, PRDs, requirements specs", category: "business" },
  { id: "ux-writer", name: "UX Writer", icon: "layout", description: "Microcopy, UI strings, content design", category: "technical" },
  { id: "sales-strategist", name: "Sales Strategist", icon: "handshake", description: "Proposals, pitch decks, battle cards", category: "business" },
  { id: "hr-specialist", name: "HR Specialist", icon: "briefcase", description: "Policies, handbooks, reviews", category: "professional" },
  { id: "grant-writer", name: "Grant Writer", icon: "award", description: "Grant proposals, funding apps", category: "academic" },
  { id: "journalist", name: "Journalist", icon: "newspaper", description: "News articles, press releases", category: "creative" },
  { id: "product-manager", name: "Product Manager", icon: "rocket", description: "PRDs, roadmaps, release notes", category: "business" },
  { id: "data-analyst", name: "Data Analyst", icon: "pie-chart", description: "Reports, dashboards, data briefs", category: "technical" },
  { id: "email-writer", name: "Email Writer", icon: "mail", description: "Cold emails, newsletters, sequences", category: "business" },
  { id: "consultant", name: "Strategy Consultant", icon: "lightbulb", description: "Strategy decks, whitepapers", category: "business" },
  { id: "social-media", name: "Social Media", icon: "share", description: "Posts, threads, content calendars", category: "creative" },
  { id: "educator", name: "Educator", icon: "book-open", description: "Lesson plans, curricula, courses", category: "academic" },
  { id: "real-estate-agent", name: "Real Estate Agent", icon: "home", description: "Listings, market analyses, buyer guides", category: "professional" },
  { id: "scriptwriter", name: "Scriptwriter", icon: "film", description: "Screenplays, video scripts, dialogue", category: "creative" },
  { id: "medical-writer", name: "Medical Writer", icon: "heart-pulse", description: "Clinical summaries, patient guides", category: "professional" },
  { id: "financial-analyst", name: "Financial Analyst", icon: "dollar-sign", description: "Financial reports, investment memos", category: "business" },
  { id: "speechwriter", name: "Speechwriter", icon: "mic", description: "Keynotes, toasts, public addresses", category: "creative" },
  { id: "patent-writer", name: "Patent Writer", icon: "shield", description: "Patent apps, claims, prior art", category: "professional" },
  { id: "devops-engineer", name: "DevOps Engineer", icon: "server", description: "Runbooks, IaC docs, postmortems", category: "technical" },
  { id: "translator", name: "Translator", icon: "globe", description: "Translations, localization, glossaries", category: "creative" },
  { id: "nonprofit-writer", name: "Nonprofit Writer", icon: "heart", description: "Impact reports, donor letters", category: "professional" },
  { id: "compliance-officer", name: "Compliance Officer", icon: "clipboard-check", description: "SOPs, audit reports, regulatory filings", category: "professional" },
  { id: "game-designer", name: "Game Designer", icon: "gamepad", description: "GDDs, mechanics docs, narrative bibles", category: "creative" },
  { id: "event-planner", name: "Event Planner", icon: "calendar", description: "Event briefs, run-of-show, vendors", category: "business" },
];

export const skillCategories = [
  { id: "professional", label: "Professional" },
  { id: "creative", label: "Creative" },
  { id: "technical", label: "Technical" },
  { id: "academic", label: "Academic" },
  { id: "business", label: "Business" },
] as const;
