import { useState } from 'react'

function detectWebGL() {
  if (typeof window === 'undefined' || !('WebGLRenderingContext' in window)) return false

  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function useWebGL() {
  const [supported] = useState(detectWebGL)
  return supported
}
