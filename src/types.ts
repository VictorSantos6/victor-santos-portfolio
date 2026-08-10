export interface Education {
  institution: string
  location: string
  degree: string
  graduation: string
  gpa: string
  coursework: string[]
}

export interface Experience {
  id: string
  organization: string
  role: string
  location: string
  period: string
  eyebrow: string
  summary: string
  highlights: string[]
  featured?: boolean
  impact?: Array<{
    value: string
    label: string
  }>
}

export interface Project {
  id: string
  name: string
  period: string
  stack: string[]
  signal: string
  problem: string
  contribution: string
  outcomes: string[]
  accent: 'cyan' | 'blue' | 'amber' | 'violet'
}

export interface SkillGroup {
  label: string
  skills: string[]
}

export interface Certification {
  id: string
  name: string
  issuer: string
  issued: string
  detail: string
  credentialId: string
  verificationUrl: string
  imageKey: string | null
  imageName: string
}

export interface Contact {
  email: string
  linkedin: string
  github?: string
  intro: string
  resumeKey: string | null
  resumeName: string
}

export interface Identity {
  name: string
  role: string
  kicker: string
  headlineLead: string
  headlineMiddle: string
  headlineEmphasis: string
  summary: string
  building: string
  status: string
  location: string
}

export interface PortfolioContent {
  identity: Identity
  education: Education
  certifications: Certification[]
  skillGroups: SkillGroup[]
  experienceIntro: string
  experiences: Experience[]
  projectsIntro: string
  projects: Project[]
  contact: Contact
}

export interface PortfolioRevision {
  id: number
  content: PortfolioContent
  updatedAt: string
  publishedAt: string | null
}
