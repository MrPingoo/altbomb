import { forwardRef, useState } from 'react'
import '../styles/WordInput.css'

const WordInput = forwardRef(function WordInput({ onSubmit, disabled, syllable, isMyTurn }, ref) {
  const [word, setWord] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = word.trim()
    if (trimmed) {
      onSubmit(trimmed)
      setWord('')
    }
  }

  const hasSyllable = syllable
    ? word.toLowerCase().includes(syllable.toLowerCase())
    : false

  return (
    <form className="word-input" onSubmit={handleSubmit}>
      <div className="word-input__wrap">
        <input
          ref={ref}
          className={[
            'word-input__field',
            word && hasSyllable  ? 'word-input__field--valid'   : '',
            word && !hasSyllable ? 'word-input__field--invalid'  : '',
          ].join(' ')}
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          disabled={disabled}
          placeholder={isMyTurn ? `Mot avec "${syllable}"…` : 'Attend ton tour'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          maxLength={40}
        />
        <button
          className="btn btn--primary"
          type="submit"
          disabled={disabled || !word.trim()}
        >
          ↵
        </button>
      </div>
      {word && !hasSyllable && isMyTurn && (
        <p className="word-input__hint">
          Le mot doit contenir <strong>{syllable}</strong>
        </p>
      )}
    </form>
  )
})

export default WordInput
