import { useEffect, useState } from 'react'
import '../styles/BombDisplay.css'

export default function BombDisplay({ syllable, isMyTurn, currentPlayer }) {
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 400)
    return () => clearTimeout(t)
  }, [syllable])

  return (
    <div className={`bomb ${isMyTurn ? 'bomb--my-turn' : ''}`}>
      <div className="bomb__body">
        <span className="bomb__emoji">💣</span>
        <div className={`bomb__syllable ${flash ? 'bomb__syllable--flash' : ''}`}>
          {syllable}
        </div>
      </div>
      <p className="bomb__turn-label">
        {isMyTurn
          ? "C'est ton tour !"
          : `Tour de ${currentPlayer}`}
      </p>
    </div>
  )
}
