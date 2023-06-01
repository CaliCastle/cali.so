'use client'

import React from 'react'
import { useReward } from 'react-rewards'

export function SubbedCelebration() {
  const { reward } = useReward('subbed-celebration', 'confetti', {
    position: 'absolute',
    elementCount: 160,
    spread: 80,
    elementSize: 8,
    lifetime: 400,
  })

  React.useEffect(() => {
    setTimeout(() => reward(), 500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div className="pb-16"></div>
}
