import type { Contact, Education, Experience, Project, SkillGroup } from '../types'

export const education: Education = {
  institution: 'University of Puerto Rico Mayagüez',
  location: 'Mayagüez, PR',
  degree: 'B.S. Computer Science and Engineering',
  graduation: 'May 2028',
  gpa: '3.31',
  coursework: [
    'Data Structures',
    'Advanced Programming',
    'Fundamentals of Computing',
    'Introduction to Software Engineering',
    'Analysis and Design of Algorithms',
  ],
}

export const experiences: Experience[] = [
  {
    id: 'lidron',
    organization: 'LiDRON Research',
    role: 'Developer',
    location: 'Mayagüez, PR',
    period: 'May 2026 — Present',
    eyebrow: 'Autonomous systems · Primary mission',
    summary:
      'Contributing to a Lockheed Martin-sponsored research initiative focused on automating drone landing to reduce human error.',
    highlights: [
      'Engineered a cross-platform pipeline between macOS ARM64 and Ubuntu/Docker with volume-mapped source synchronization.',
      'Reduced build-test iteration cycles by 50% while maintaining 100% environment parity.',
      'Developed a real-time LiDAR perception pipeline in Python with signal-processing filters for raw point-cloud data.',
    ],
    featured: true,
  },
  {
    id: 'miuni',
    organization: 'MiUni',
    role: 'Developer',
    location: 'Mayagüez, PR',
    period: 'Jul 2025 — Present',
    eyebrow: 'Mobile systems · Product orbit',
    summary:
      'Building scalable Flutter experiences with Clean Architecture and predictable state management.',
    highlights: [
      'Developed the app tutorial onboarding flow that guides users through key features after their first login.',
      'Built a Pickleball tournament module for team management and live score tracking using Flutter, Dart, and Cubit.',
    ],
  },
  {
    id: 'skillsusa',
    organization: 'SkillsUSA',
    role: 'Technician and Programmer',
    location: 'Georgia, US',
    period: 'May 2023 — Jul 2023',
    eyebrow: 'Robotics · Ground station',
    summary:
      'Supported competition performance through hands-on robotic hardware assembly and maintenance.',
    highlights: [
      'Assembled and maintained Scorbot robotic-arm wiring components on the circuit board for reliable connectivity and function.',
    ],
  },
]

export const projects: Project[] = [
  {
    id: 'flash-cards',
    name: 'Flash Cards App',
    period: 'Jul 2025 — Aug 2025',
    stack: ['Flutter', 'Dart', 'BLoC/Cubit', 'Hive'],
    signal: '01 / LEARNING SYSTEM',
    problem:
      'Students and professionals need a focused study tool that remains useful without a network connection.',
    contribution:
      'Built a mobile flashcards application from scratch using Clean Architecture and BLoC/Cubit principles.',
    outcomes: [
      'Deck creation and flashcard editing',
      'Dark and light appearance modes',
      'Offline persistence with Hive',
    ],
    accent: 'cyan',
  },
  {
    id: 'esports-organizer',
    name: 'Esports Organizer',
    period: 'Jul 2025 — Present',
    stack: ['React', 'JavaScript', 'HTML', 'Figma'],
    signal: '02 / LIVE COMPETITION',
    problem:
      'Tournament audiences and teams need a clearer view of live match progress, team information, and history.',
    contribution:
      'Developed the Tournament Brackets Page in React and designed a responsive Team Profile Page in Figma.',
    outcomes: [
      'Interactive real-time match progression',
      'Team statistics and match-history prototype',
      'Structured GitHub commits and branches',
    ],
    accent: 'blue',
  },
  {
    id: 'vehicle-reservation',
    name: 'Vehicle Reservation System',
    period: 'Apr 2025 — May 2025',
    stack: ['Java', 'OOP', 'Data Structures'],
    signal: '03 / CAMPUS MOBILITY',
    problem:
      'UPRM students need a reliable way to reserve vehicles while handling conflicts, roles, and station operations.',
    contribution:
      'Created a multi-role terminal system with modular packages and object-oriented design for clients and owners.',
    outcomes: [
      'Conflict validation and waitlist management',
      'Undo and redo actions',
      'Real-time terminal reservations',
    ],
    accent: 'amber',
  },
  {
    id: 'space-invaders',
    name: 'Space Invaders',
    period: 'Apr 2024',
    stack: ['C++', 'Game Logic'],
    signal: '04 / DEEP SPACE',
    problem:
      'An existing C++ game needed more reliable collision detection, input handling, and gameplay behavior.',
    contribution:
      'Debugged and enhanced the game mechanics while working without external libraries.',
    outcomes: [
      'Refined collision detection',
      'Improved user input and game mechanics',
      'Optimized runtime performance',
    ],
    accent: 'violet',
  },
]

export const skillGroups: SkillGroup[] = [
  { label: 'Languages', skills: ['Dart', 'Java', 'C++', 'Python', 'JavaScript'] },
  { label: 'Interfaces', skills: ['Flutter', 'React', 'Figma'] },
  { label: 'Systems', skills: ['Docker', 'Automation', 'Git', 'GitHub'] },
  { label: 'Approach', skills: ['Clean Architecture', 'Teamwork', 'Testing'] },
]

export const contact: Contact = {
  email: 'victor.santos6@upr.edu',
  linkedin: 'https://linkedin.com/in/victor-santos-figueroa',
  resume: '/Victor-Santos-Resume.pdf',
}
