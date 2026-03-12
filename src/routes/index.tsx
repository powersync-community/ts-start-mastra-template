import { createFileRoute } from '@tanstack/react-router'
import { useQuery, usePowerSync, useStatus } from '@powersync/react'
import { useState, useRef, useEffect } from 'react'
import { chat } from '~/lib/server-fns'

export const Route = createFileRoute('/')(  {
  component: Chat,
})

function Chat() {
  const db = usePowerSync()
  const status = useStatus()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId] = useState(() => crypto.randomUUID())
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: messages } = useQuery(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [conversationId],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const content = input.trim()
    setInput('')
    setLoading(true)

    await db.execute(
      'INSERT INTO messages (id, role, content, conversation_id, created_at) VALUES (uuid(), ?, ?, ?, ?)',
      ['user', content, conversationId, new Date().toISOString()],
    )

    try {
      const history = (messages ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
      }))
      history.push({ role: 'user', content })

      const { text } = await chat({ data: { messages: history } })

      await db.execute(
        'INSERT INTO messages (id, role, content, conversation_id, created_at) VALUES (uuid(), ?, ?, ?, ?)',
        ['assistant', text, conversationId, new Date().toISOString()],
      )
    } catch (e) {
      console.error('Chat error:', e)
      await db.execute(
        'INSERT INTO messages (id, role, content, conversation_id, created_at) VALUES (uuid(), ?, ?, ?, ?)',
        ['assistant', 'Sorry, something went wrong.', conversationId, new Date().toISOString()],
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Chat</h1>
        <span style={styles.status}>
          <span
            style={{
              ...styles.dot,
              background: status.connected ? '#22c55e' : '#ef4444',
            }}
          />
          {status.connected ? 'Synced' : 'Local'}
        </span>
      </header>

      <div style={styles.messages}>
        {messages?.length === 0 && (
          <p style={styles.empty}>Send a message to start chatting</p>
        )}
        {messages?.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.bubble,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? '#2563eb' : '#262626',
              borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
              borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 16,
            }}
          >
            {msg.role === 'assistant' && (
              <span style={styles.roleLabel}>AI</span>
            )}
            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage()
        }}
        style={styles.form}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={{ ...styles.button, opacity: loading ? 0.5 : 1 }}>
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: 640,
    margin: '0 auto',
    padding: '0 16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 0',
    borderBottom: '1px solid #262626',
  },
  title: { margin: 0, fontSize: 20, fontWeight: 600 },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#888',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  messages: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '16px 0',
  },
  empty: {
    textAlign: 'center',
    color: '#555',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  bubble: {
    padding: '10px 14px',
    borderRadius: 16,
    maxWidth: '80%',
    fontSize: 14,
    lineHeight: 1.5,
  },
  roleLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: '#888',
    marginBottom: 2,
  },
  form: {
    display: 'flex',
    gap: 8,
    padding: '12px 0',
    borderTop: '1px solid #262626',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid #333',
    background: '#171717',
    color: '#e5e5e5',
    fontSize: 14,
    outline: 'none',
  },
  button: {
    padding: '10px 20px',
    borderRadius: 12,
    border: 'none',
    background: '#2563eb',
    color: 'white',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
}
