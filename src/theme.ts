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
  onPrimary: string
  fog: string
  particle: string
  light: string
  planet: PlanetTheme
}

export type PaletteName =
  | 'sun'
  | 'mercury'
  | 'earth'
  | 'mars'
  | 'venus'
  | 'uranus'
  | 'neptune'
  | 'saturn'
  | 'jupiter'
  | 'pluto'

export type PlanetPalette = readonly [string, string, string, string, string]

/** Exact left-to-right swatches from the supplied planetary palette reference. */
export const planetPalettes: Record<PaletteName, PlanetPalette> = {
  sun: ['#ffd7a4', '#f7ab57', '#f58021', '#f05e25', '#f36825'],
  mercury: ['#e5e6ea', '#c2c0c1', '#949494', '#858688', '#7f7f7f'],
  earth: ['#a2acb6', '#6d7b48', '#b18b74', '#161340', '#212d61'],
  mars: ['#e0a966', '#a07845', '#ae946f', '#52575d', '#22384d'],
  venus: ['#f8cdab', '#fbb076', '#dc6b31', '#6f2315', '#4f1f11'],
  uranus: ['#cfecfa', '#c4e6f0', '#bddee7', '#aacbd2', '#739098'],
  neptune: ['#ccdef2', '#867aba', '#7563ad', '#6851a3', '#4c3d82'],
  saturn: ['#f9e4c5', '#dcc593', '#b99f7a', '#8f6f40', '#412f21'],
  jupiter: ['#e2d39a', '#b3ae84', '#c2b686', '#e6d59f', '#9e9366'],
  pluto: ['#cfdcec', '#979fa2', '#798792', '#4d5063', '#434c5d'],
}

const [sunLight, sunWarm, sunSurface, sunDeep, sunAccent] = planetPalettes.sun
const [earthLight, earthGreen, earthClay, earthDeep, earthSurface] = planetPalettes.earth
const [marsLight, marsOchre, marsSand, marsSurface, marsDeep] = planetPalettes.mars
const [neptuneLight, neptuneSoft, neptuneMid, neptuneSurface, neptuneDeep] = planetPalettes.neptune
const [plutoLight, plutoSoft, plutoMid, plutoSurface, plutoDeep] = planetPalettes.pluto

const exoplanet: PlanetTheme = {
  variant: 'exoplanet',
  surface: sunAccent,
  detail: sunSurface,
  atmosphere: sunLight,
  highlight: sunWarm,
  ring: sunDeep,
  scale: 1,
  rotationSpeed: 0.025,
  position: [2.65, 0.1, -2.3],
  camera: [0, 0.35, 8.2],
  cameraTarget: [0, -0.2, -1.4],
}

const earth: PlanetTheme = {
  variant: 'earth',
  surface: earthSurface,
  detail: earthGreen,
  atmosphere: earthLight,
  highlight: earthClay,
  ring: earthLight,
  scale: 0.96,
  rotationSpeed: 0.055,
  position: [2.7, -0.05, -2.45],
  camera: [-0.25, 0.12, 7.9],
  cameraTarget: [0.15, -0.3, -1.55],
}

const mars: PlanetTheme = {
  variant: 'mars',
  surface: marsOchre,
  detail: marsSand,
  atmosphere: marsLight,
  highlight: marsSurface,
  ring: marsLight,
  scale: 0.9,
  rotationSpeed: 0.038,
  position: [-2.65, -0.2, -2.2],
  camera: [0.35, -0.05, 7.65],
  cameraTarget: [-0.15, -0.42, -1.45],
}

const neptune: PlanetTheme = {
  variant: 'neptune',
  surface: neptuneSurface,
  detail: neptuneMid,
  atmosphere: neptuneLight,
  highlight: neptuneSoft,
  ring: neptuneLight,
  scale: 1.04,
  rotationSpeed: 0.07,
  position: [2.75, -0.18, -2.65],
  camera: [-0.15, -0.22, 7.35],
  cameraTarget: [0.2, -0.5, -1.7],
}

export const saturnPlanet: PlanetTheme = {
  variant: 'saturn',
  surface: planetPalettes.saturn[2],
  detail: planetPalettes.saturn[3],
  atmosphere: planetPalettes.saturn[0],
  highlight: planetPalettes.saturn[1],
  ring: planetPalettes.saturn[3],
  scale: 0.82,
  rotationSpeed: 0.045,
  position: [-2.6, -0.1, -2.55],
  camera: [0.2, -0.15, 7.6],
  cameraTarget: [-0.2, -0.42, -1.6],
}

const moon: PlanetTheme = {
  variant: 'moon',
  surface: plutoSurface,
  detail: plutoMid,
  atmosphere: plutoLight,
  highlight: plutoSoft,
  ring: plutoLight,
  scale: 0.86,
  rotationSpeed: 0.022,
  position: [-2.7, 0, -2.45],
  camera: [0.15, -0.12, 7.8],
  cameraTarget: [-0.15, -0.38, -1.55],
}

export const sectionThemes: Record<SectionId, SectionTheme> = {
  top: {
    id: 'top',
    name: 'The Sun',
    primary: '#211207',
    secondary: sunWarm,
    glow: sunLight,
    background: sunAccent,
    surface: sunSurface,
    text: '#211207',
    muted: '#432008',
    onPrimary: sunLight,
    fog: sunAccent,
    particle: sunLight,
    light: sunLight,
    planet: exoplanet,
  },
  profile: {
    id: 'profile',
    name: 'Earth',
    primary: earthLight,
    secondary: earthGreen,
    glow: earthClay,
    background: earthDeep,
    surface: earthSurface,
    text: '#f8f7fb',
    muted: '#d7d5e3',
    onPrimary: earthDeep,
    fog: earthDeep,
    particle: earthLight,
    light: earthLight,
    planet: earth,
  },
  experience: {
    id: 'experience',
    name: 'Mars',
    primary: marsLight,
    secondary: marsOchre,
    glow: marsSand,
    background: marsDeep,
    surface: marsSurface,
    text: '#fbfaf7',
    muted: '#e8e1d8',
    onPrimary: marsDeep,
    fog: marsDeep,
    particle: marsLight,
    light: marsLight,
    planet: mars,
  },
  projects: {
    id: 'projects',
    name: 'Neptune',
    primary: neptuneLight,
    secondary: neptuneSoft,
    glow: neptuneMid,
    background: neptuneDeep,
    surface: neptuneSurface,
    text: '#faf9ff',
    muted: '#e3def1',
    onPrimary: neptuneDeep,
    fog: neptuneDeep,
    particle: neptuneLight,
    light: neptuneLight,
    planet: neptune,
  },
  contact: {
    id: 'contact',
    name: 'Pluto',
    primary: plutoLight,
    secondary: plutoSoft,
    glow: plutoMid,
    background: plutoDeep,
    surface: plutoSurface,
    text: '#fbfcff',
    muted: '#dce1e8',
    onPrimary: plutoDeep,
    fog: plutoDeep,
    particle: plutoLight,
    light: plutoLight,
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
    '--theme-on-primary': theme.onPrimary,
    '--accent-rgb': hexToRgbChannels(theme.primary),
    '--cta-rgb': hexToRgbChannels(theme.secondary),
    '--glow-rgb': hexToRgbChannels(theme.glow),
    '--space-rgb': hexToRgbChannels(theme.background),
    '--surface-rgb': hexToRgbChannels(theme.surface),
  }
}
