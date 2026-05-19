import '../styles/Timer.css'

export default function Timer({ timeLeft, maxTime = 10 }) {
  const pct     = Math.max(0, (timeLeft / maxTime) * 100)
  const urgent  = timeLeft <= 3
  const warning = timeLeft <= 6

  const color = urgent ? '#ef4444' : warning ? '#f97316' : '#22c55e'

  return (
    <div className="timer">
      <div
        className={`timer__bar ${urgent ? 'timer__bar--urgent' : ''}`}
        style={{ '--pct': `${pct}%`, '--color': color }}
      />
      <span className={`timer__label ${urgent ? 'timer__label--urgent' : ''}`}>
        {timeLeft}s
      </span>
    </div>
  )
}
