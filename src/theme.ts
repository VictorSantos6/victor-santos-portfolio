import type { CSSProperties } from 'react'

export const FONT_BODY = "'Inter', system-ui, sans-serif" as const
export const FONT_HEADING = "'Space Grotesk', system-ui, sans-serif" as const
export const FONT_HERO = "'Space Grotesk', system-ui, sans-serif" as const
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
  surface: '#172842',
  detail: '#978c67',
  atmosphere: '#546d93',
  highlight: '#d5d3c4',
  ring: '#546d93',
  scale: 0.96,
  rotationSpeed: 0.055,
  position: [2.7, -0.05, -2.45],
  camera: [-0.25, 0.12, 7.9],
  cameraTarget: [0.15, -0.3, -1.55],
}

const mars: PlanetTheme = {
  variant: 'mars',
  surface: '#cb6f4a',
  detail: '#ab4f41',
  atmosphere: '#eb975e',
  highlight: '#faf7eb',
  ring: '#eecb88',
  scale: 0.9,
  rotationSpeed: 0.038,
  position: [-2.65, -0.2, -2.2],
  camera: [0.35, -0.05, 7.65],
  cameraTarget: [-0.15, -0.42, -1.45],
}

const neptune: PlanetTheme = {
  variant: 'neptune',
  surface: '#31557e',
  detail: '#4f8c9e',
  atmosphere: '#74bfba',
  highlight: '#a0e0c8',
  ring: '#1b255d',
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
  surface: '#6f6d72',
  detail: '#333136',
  atmosphere: '#b4b1b8',
  highlight: '#e9e8ee',
  ring: '#101b39',
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
    primary: '#d5d3c4',
    secondary: '#978c67',
    glow: '#546d93',
    background: '#0f161d',
    surface: '#172842',
    text: '#d5d3c4',
    muted: '#978c67',
    fog: '#0f161d',
    particle: '#d5d3c4',
    light: '#d5d3c4',
    planet: earth,
  },
  experience: {
    id: 'experience',
    name: 'Mars',
    primary: '#faf7eb',
    secondary: '#fecb88',
    glow: '#eb975e',
    background: '#5d1f1e',
    surface: '#ab4f41',
    text: '#faf7eb',
    muted: '#faf7eb',
    fog: '#5d1f1e',
    particle: '#eecb88',
    light: '#faf7eb',
    planet: mars,
  },
  projects: {
    id: 'projects',
    name: 'Neptune',
    primary: '#a0e0c8',
    secondary: '#74bfba',
    glow: '#4f8c9e',
    background: '#0d021c',
    surface: '#120b3c',
    text: '#a0e0c8',
    muted: '#74bfba',
    fog: '#0d021c',
    particle: '#74bfba',
    light: '#a0e0c8',
    planet: neptune,
  },
  contact: {
    id: 'contact',
    name: 'Moon',
    primary: '#e9e8ee',
    secondary: '#b4b1b8',
    glow: '#6f6d72',
    background: '#101b39',
    surface: '#333136',
    text: '#e9e8ee',
    muted: '#b4b1b8',
    fog: '#101b39',
    particle: '#b4b1b8',
    light: '#e9e8ee',
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
