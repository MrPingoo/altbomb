import { useState, useEffect, useRef } from 'react'
import PlayerList  from './PlayerList'
import BombDisplay from './BombDisplay'
import Timer       from './Timer'
import WordInput   from './WordInput'
import '../styles/Game.css'

export default function Game({ state, onStartGame, onSubmitWord, onReset, connected }) {
  const {
    screen, roomCode, username, players,
    currentPlayer, syllable, timeLeft,
    lastWord, lastWordValid, winner,
  } = state

  const isMyTurn  = currentPlayer === username
  const isWaiting = screen === 'waiting'
  const isOver    = screen === 'gameover'

  const inputRef = useRef(null)
  useEffect(() => {
    if (isMyTurn) inputRef.current?.focus()
  }, [isMyTurn, currentPlayer])

  return (
    <div className="game">
      {/* Header */}
      <header className="game__header">
        <span className="game__logo">💣 AltBomb</span>
        <span className="game__room-code">
          Salon : <strong>{roomCode}</strong>
        </span>
        <span className={`game__dot ${connected ? 'game__dot--ok' : 'game__dot--err'}`} />
      </header>

      {/* Waiting room */}
      {isWaiting && (
        <div className="game__waiting">
          <h2>En attente de joueurs…</h2>
          <p className="game__waiting-hint">
            Partage le code <strong>{roomCode}</strong> à tes amis
          </p>
          <PlayerList players={players} currentPlayer={null} username={username} />
          <button
            className="btn btn--primary btn--lg"
            onClick={onStartGame}
            disabled={players.length < 2}
          >
            {players.length < 2
              ? `En attente (${players.length}/2 min.)`
              : `Lancer la partie (${players.length} joueurs)`}
          </button>
        </div>
      )}

      {/* Active game */}
      {screen === 'game' && (
        <div className="game__arena">
          <div className="game__left">
            <PlayerList players={players} currentPlayer={currentPlayer} username={username} />
          </div>

          <div className="game__center">
            <Timer timeLeft={timeLeft} maxTime={10} />
            <BombDisplay
              syllable={syllable}
              isMyTurn={isMyTurn}
              currentPlayer={currentPlayer}
            />

            {lastWord && (
              <div className={`game__feedback ${lastWordValid ? 'game__feedback--ok' : 'game__feedback--err'}`}>
                {lastWordValid
                  ? `✓ "${lastWord}" accepté !`
                  : `✗ "${lastWord}" refusé`}
              </div>
            )}

            <WordInput
              ref={inputRef}
              onSubmit={onSubmitWord}
              disabled={!isMyTurn}
              syllable={syllable}
              isMyTurn={isMyTurn}
            />

            {!isMyTurn && (
              <p className="game__waiting-player">
                En attente de <strong>{currentPlayer}</strong>…
              </p>
            )}
          </div>
        </div>
      )}

      {/* Game over */}
      {isOver && (
        <div className="game__over">
          <div className="game__over-bomb">💥</div>
          <h2 className="game__over-title">
            {winner === username ? '🏆 Tu as gagné !' : `${winner} a gagné !`}
          </h2>
          <PlayerList players={players} currentPlayer={null} username={username} showLives />
          <button className="btn btn--primary btn--lg" onClick={onReset}>
            Rejouer
          </button>
        </div>
      )}
    </div>
  )
}
