import { useState, useEffect } from 'react'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface TimerProps {
  startDate: string
  endDate?: string | null
  className?: string
}

export default function Timer({ startDate, endDate, className = '' }: TimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(startDate).getTime()
    const end = endDate ? new Date(endDate).getTime() : null

    function calc() {
      const now = end || Date.now()
      return Math.floor((now - start) / 1000)
    }

    setElapsed(calc())

    if (!end) {
      const id = setInterval(() => setElapsed(calc()), 1000)
      return () => clearInterval(id)
    }
  }, [startDate, endDate])

  return (
    <span className={`timer-display ${className}`}>
      {formatDuration(elapsed)}
    </span>
  )
}

export { formatDuration }
