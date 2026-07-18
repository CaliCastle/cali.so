'use client'

import { useCallback, useEffect, useState } from 'react'
import { ContourLines, PerlinNoise, Shader } from 'shaders/react'

const SHADER_READY_TIMEOUT_MS = 2000

function readForegroundInk() {
  return getComputedStyle(document.body).color
}

export function PortraitShaderField({ onUnavailable }: { onUnavailable: () => void }) {
  const [ink, setInk] = useState(readForegroundInk)
  const [ready, setReady] = useState(false)
  const handleReady = useCallback(() => setReady(true), [])

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setInk(readForegroundInk()))
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (ready) return
    const timer = window.setTimeout(onUnavailable, SHADER_READY_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [onUnavailable, ready])

  return (
    <span className="portrait-hidden-stage-shader-shell" data-ready={ready ? 'true' : 'false'}>
      <Shader
        className="portrait-hidden-stage-canvas"
        colorSpace="srgb"
        disableTelemetry
        onReady={handleReady}
      >
        <ContourLines
          levels={5}
          lineWidth={0.7}
          softness={0.1}
          gamma={0.72}
          colorMode="custom"
          lineColor={ink}
          backgroundColor="transparent"
        >
          <PerlinNoise
            colorA="#ffffff"
            colorB="#000000"
            colorSpace="oklch"
            scale={2.7}
            contrast={0.08}
            balance={-0.06}
            seed={19}
            speed={0.06}
          />
        </ContourLines>
      </Shader>
    </span>
  )
}
