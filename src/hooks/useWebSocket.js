import { useCallback, useEffect, useRef, useState } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'

export function useWebSocket(onMessage) {
  const wsRef          = useRef(null)
  const onMessageRef   = useRef(onMessage)
  const [connected, setConnected] = useState(false)

  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen  = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = (e) => console.error('[WS] error', e)
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onMessageRef.current?.(data)
      } catch {
        console.error('[WS] invalid JSON', e.data)
      }
    }

    return () => ws.close()
  }, [])

  const send = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  return { send, connected }

}