import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './Root.tsx'
import {
  FONT_BODY,
  FONT_HEADING,
  FONT_HERO,
  FONT_HUD,
  FONT_MONO,
  FONT_UI,
} from './theme.ts'

const rootStyle = document.documentElement.style

rootStyle.setProperty('--font-body', FONT_BODY)
rootStyle.setProperty('--font-heading', FONT_HEADING)
rootStyle.setProperty('--font-hero', FONT_HERO)
rootStyle.setProperty('--font-ui', FONT_UI)
rootStyle.setProperty('--font-hud', FONT_HUD)
rootStyle.setProperty('--font-mono', FONT_MONO)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
