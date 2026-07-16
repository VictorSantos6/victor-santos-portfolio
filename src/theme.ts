import type { CSSProperties } from 'react'

export const FONT_BODY = "'Inter', system-ui, sans-serif" as const
export const FONT_HEADING = "'Space Grotesk', system-ui, sans-serif" as const
export const FONT_HERO = "'Orbitron', 'Space Grotesk', sans-serif" as const
export const FONT_UI = "'IBM Plex Sans', system-ui, sans-serif" as const
export const FONT_HUD = "'Chakra Petch', 'Space Grotesk', sans-serif" as const
export const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace" as const

export type SectionId = 'top' | 'profile' | 'experience' | 'projects' | 'contact'
export type PlanetVariant = 'exoplanet' | 'earth' | 'mars' | 'neptune' | 'saturn' | 'moon'

export interface PlanetTheme {
  variant: PlanetVariant
  surface: string
  detail: string
  atmosphere: string
  highlight: string
  ring: string
  scale: number
  rotationSpeed: number
  position: readonly [number, number, number]
  camera: readonly [number, number, number]
  cameraTarget: readonly [number, number, number]
}

export interface SectionTheme {
  id: SectionId
  name: string
  primary: string
  secondary: string
  glow: string
  background: string
  surface: string
  text: string
  muted: string
  fog: string
  particle: string
  light: string
  planet: PlanetTheme
}

const exoplanet: PlanetTheme = {
  variant: 'exoplanet',
  surface: '#0a192f',
  detail: '#4a90e2',
  atmosphere: '#e0f4ff',
  highlight: '#ff6b35',
  ring: '#4a90e2',
  scale: 1,
  rotationSpeed: 0.025,
  position: [2.65, 0.1, -2.3],
  camera: [0, 0.35, 8.2],
  cameraTarget: [0, -0.2, -1.4],
}

const earth: PlanetTheme = {
  variant: 'earth',
  surface: '#1468b3',
  detail: '#45b96b',
  atmosphere: '#8bdcff',
  highlight: '#e9fbff',
  ring: '#38bdf8',
  scale: 0.96,
  rotationSpeed: 0.055,
  position: [2.7, -0.05, -2.45],
  camera: [-0.25, 0.12, 7.9],
  cameraTarget: [0.15, -0.3, -1.55],
}

const mars: PlanetTheme = {
  variant: 'mars',
  surface: '#9d3f25',
  detail: '#e16a3d',
  atmosphere: '#ffb37a',
  highlight: '#ffd0a6',
  ring: '#fb923c',
  scale: 0.9,
  rotationSpeed: 0.038,
  position: [-2.65, -0.2, -2.2],
  camera: [0.35, -0.05, 7.65],
  cameraTarget: [-0.15, -0.42, -1.45],
}

const neptune: PlanetTheme = {
  variant: 'neptune',
  surface: '#1d4ed8',
  detail: '#22d3ee',
  atmosphere: '#86f1ff',
  highlight: '#c4b5fd',
  ring: '#67e8f9',
  scale: 1.04,
  rotationSpeed: 0.07,
  position: [2.75, -0.18, -2.65],
  camera: [-0.15, -0.22, 7.35],
  cameraTarget: [0.2, -0.5, -1.7],
}

export const saturnPlanet: PlanetTheme = {
  variant: 'saturn',
  surface: '#c9904b',
  detail: '#f2cf86',
  atmosphere: '#ffe9b0',
  highlight: '#fff4d1',
  ring: '#e7bd72',
  scale: 0.82,
  rotationSpeed: 0.045,
  position: [-2.6, -0.1, -2.55],
  camera: [0.2, -0.15, 7.6],
  cameraTarget: [-0.2, -0.42, -1.6],
}

const moon: PlanetTheme = {
  variant: 'moon',
  surface: '#778394',
  detail: '#b9c4d1',
  atmosphere: '#c4b5fd',
  highlight: '#eef4ff',
  ring: '#cbd5e1',
  scale: 0.86,
  rotationSpeed: 0.022,
  position: [-2.7, 0, -2.45],
  camera: [0.15, -0.12, 7.8],
  cameraTarget: [-0.15, -0.38, -1.55],
}

export const sectionThemes: Record<SectionId, SectionTheme> = {
  top: {
    id: 'top',
    name: 'Exoplanet',
    primary: '#4a90e2',
    secondary: '#ff6b35',
    glow: '#e0f4ff',
    background: '#0a192f',
    surface: '#102642',
    text: '#f4f7f6',
    muted: '#d6ebfa',
    fog: '#0a192f',
    particle: '#f4f7f6',
    light: '#f4f7f6',
    planet: exoplanet,
  },
  profile: {
    id: 'profile',
    name: 'Earth',
    primary: '#38bdf8',
    secondary: '#4ade80',
    glow: '#bae6fd',
    background: '#061a24',
    surface: '#0b2933',
    text: '#f4fbff',
    muted: '#c6e7ef',
    fog: '#071d27',
    particle: '#dff9ff',
    light: '#f1fdff',
    planet: earth,
  },
  experience: {
    id: 'experience',
    name: 'Mars',
    primary: '#fb923c',
    secondary: '#ef4444',
    glow: '#fdba74',
    background: '#1b0c0a',
    surface: '#321510',
    text: '#fff8f3',
    muted: '#f4d4c4',
    fog: '#200d09',
    particle: '#ffe3cf',
    light: '#fff1e7',
    planet: mars,
  },
  projects: {
    id: 'projects',
    name: 'Neptune',
    primary: '#22d3ee',
    secondary: '#8b5cf6',
    glow: '#67e8f9',
    background: '#050b24',
    surface: '#0d1738',
    text: '#f4f8ff',
    muted: '#c9d8f5',
    fog: '#060c27',
    particle: '#dffbff',
    light: '#eef8ff',
    planet: neptune,
  },
  contact: {
    id: 'contact',
    name: 'Moon',
    primary: '#cbd5e1',
    secondary: '#a78bfa',
    glow: '#e2e8f0',
    background: '#090b14',
    surface: '#171928',
    text: '#f8fafc',
    muted: '#d1d7e2',
    fog: '#0c0d18',
    particle: '#f8fafc',
    light: '#ffffff',
    planet: moon,
  },
}

export const sectionOrder: readonly SectionId[] = ['top', 'profile', 'experience', 'projects', 'contact']

function hexToRgbChannels(hex: string) {
  const value = hex.replace('#', '')
  const normalized = value.length === 3 ? value.split('').map((digit) => digit + digit).join('') : value
  const integer = Number.parseInt(normalized, 16)
  return `${(integer >> 16) & 255}, ${(integer >> 8) & 255}, ${integer & 255}`
}

export type ThemeCSSProperties = CSSProperties & Record<`--${string}`, string>

export function themeCssVariables(theme: SectionTheme): ThemeCSSProperties {
  return {
    '--ink': theme.text,
    '--muted': theme.muted,
    '--subtle': theme.muted,
    '--cyan': theme.primary,
    '--blue': theme.glow,
    '--amber': theme.secondary,
    '--violet': theme.glow,
    '--cta': theme.secondary,
    '--surface': theme.surface,
    '--surface-strong': theme.background,
    '--line': theme.primary,
    '--theme-primary': theme.primary,
    '--theme-secondary': theme.secondary,
    '--theme-glow': theme.glow,
    '--theme-background': theme.background,
    '--theme-surface': theme.surface,
    '--theme-text': theme.text,
    '--theme-muted': theme.muted,
    '--accent-rgb': hexToRgbChannels(theme.primary),
    '--cta-rgb': hexToRgbChannels(theme.secondary),
    '--glow-rgb': hexToRgbChannels(theme.glow),
    '--space-rgb': hexToRgbChannels(theme.background),
    '--surface-rgb': hexToRgbChannels(theme.surface),
  }
}
