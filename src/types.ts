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

export interface Contact {
  email: string
  linkedin: string
  resume: string
}
