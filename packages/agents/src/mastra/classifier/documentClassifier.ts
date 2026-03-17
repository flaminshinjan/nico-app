import { groq } from "@ai-sdk/groq";
import { Agent } from "@mastra/core/agent";

export type DocumentType =
  | "email"
  | "letter"
  | "memo"
  | "report"
  | "proposal"
  | "contract"
  | "policy"
  | "job-description"
  | "article"
  | "press-release"
  | "social-post"
  | "lesson-plan"
  | "technical-doc"
  | "other"

const DOCUMENT_TYPE_KEYWORDS: Record<DocumentType, string[]> = {
  email: ["email", "e-mail", "mail", "send an email", "write an email", "cold email", "follow-up", "reply to"],
  letter: ["letter", "cover letter", "business letter", "personal letter", "letter to", "dear mr", "dear ms", "dear mrs"],
  memo: ["memo", "memorandum", "internal memo", "team memo", "department memo", "policy memo"],
  report: ["report", "annual report", "quarterly report", "status report", "progress report", "financial report", "analysis report"],
  proposal: ["proposal", "project proposal", "business proposal", "sales proposal", "grant proposal"],
  contract: ["contract", "agreement", "terms", "terms of service", "terms and conditions", "nda", "non-disclosure"],
  policy: ["policy", "guidelines", "procedures", "handbook", "employee handbook", "hr policy"],
  "job-description": ["job description", "job posting", "job ad", "position", "role requirements", "hiring"],
  article: ["article", "blog post", "blog", "write an article", "content piece", "feature"],
  "press-release": ["press release", "news release", "media release", "announcement"],
  "social-post": ["social media", "tweet", "linkedin", "instagram", "facebook post", "twitter", "content calendar"],
  "lesson-plan": ["lesson plan", "lesson", "curriculum", "teaching", "educational", "workshop"],
  "technical-doc": ["documentation", "readme", "api docs", "technical documentation", "runbook", "spec", "specification"],
  other: [],
}

function detectByKeywords(query: string): DocumentType | null {
  const lowerQuery = query.toLowerCase()
  
  for (const [docType, keywords] of Object.entries(DOCUMENT_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        return docType as DocumentType
      }
    }
  }
  
  return null
}

async function detectByLLM(query: string): Promise<DocumentType> {
  const classifier = new Agent({
    id: "documentTypeClassifier",
    name: "Document Type Classifier",
    instructions: `You are a document type classifier. Given a user's request, classify it into one of these document types:
- email: for sending messages via email
- letter: formal letters, cover letters
- memo: internal organizational documents
- report: analysis, status, annual reports
- proposal: business proposals, project bids
- contract: legal agreements, terms
- policy: guidelines, procedures, handbooks
- job-description: job postings, role descriptions
- article: blog posts, articles, features
- press-release: media announcements
- social-post: social media content
- lesson-plan: educational materials
- technical-doc: technical documentation
- other: anything that doesn't fit above

Respond with ONLY the document type (one word, lowercase, with hyphens where needed). No explanation, no quotes.`,
    model: groq("llama-3.1-8b-instant"),
  })

  const response = await classifier.generate(query)
  const result = response.text.trim().toLowerCase().replace(/[^a-z-]/g, "") as DocumentType
  
  const validTypes: DocumentType[] = [
    "email", "letter", "memo", "report", "proposal", "contract", "policy",
    "job-description", "article", "press-release", "social-post", "lesson-plan",
    "technical-doc", "other"
  ]
  
  return validTypes.includes(result) ? result as DocumentType : "other"
}

export async function classifyDocumentType(query: string): Promise<DocumentType> {
  const keywordResult = detectByKeywords(query)
  
  if (keywordResult && keywordResult !== "other") {
    return keywordResult
  }
  
  return detectByLLM(query)
}
