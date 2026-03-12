import { createServerFn } from '@tanstack/react-start'
import { Agent } from '@mastra/core/agent'
import * as jose from 'jose'
import pg from 'pg'

const chatAgent = new Agent({
  id: 'chat-assistant',
  name: 'Chat Assistant',
  instructions:
    'You are a helpful chat assistant. Keep responses concise, friendly, and informative. Respond in plain text.',
  model: 'openrouter/minimax/minimax-m2.5',
})

export const chat = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
    }) => data,
  )
  .handler(async ({ data }) => {
    console.log('[chat] Request received, message count:', data.messages.length)
    const result = await chatAgent.generate(`${data.messages.map((m) => `${m.role}: ${m.content}`).join('\n')}`)
    console.log('[chat] Response generated, length:', result.text?.length ?? 0)
    return { text: result.text }
  })

const POWERSYNC_URL = process.env.POWERSYNC_URL ?? 'http://localhost:8080'
const JWT_SECRET = process.env.JWT_SECRET ?? 'my-powersync-dev-jwt-secret-key!'
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/chat'

export const getPowerSyncCredentials = createServerFn({ method: 'GET' }).handler(async () => {
  const secret = new TextEncoder().encode(JWT_SECRET)
  const token = await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('dev-user')
    .setIssuedAt()
    .setExpirationTime('1h')
    .setAudience('powersync')
    .sign(secret)
  return {
    endpoint: POWERSYNC_URL,
    token,
    expiresAt: new Date(Date.now() + 3600_000),
  }
})

const ALLOWED_TABLES = new Set(['messages'])

export const uploadPowerSyncData = createServerFn({ method: 'POST' })
  .inputValidator((data: { operations: Array<{ id: string; op: string; table: string; opData?: Record<string, unknown> }> }) => data)
  .handler(async ({ data }) => {
    const pool = new pg.Pool({ connectionString: DATABASE_URL })
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const op of data.operations) {
        if (!ALLOWED_TABLES.has(op.table)) {
          throw new Error(`Unknown table: ${op.table}`)
        }
        switch (op.op) {
          case 'PUT': {
            const cols = Object.keys(op.opData ?? {})
            const vals = Object.values(op.opData ?? {})
            const placeholders = cols.map((_, i) => `$${i + 2}`).join(', ')
            const updateSet = cols.map((c, i) => `${c} = $${i + 2}`).join(', ')
            await client.query(
              `INSERT INTO ${op.table} (id, ${cols.join(', ')}) VALUES ($1, ${placeholders})
               ON CONFLICT (id) DO UPDATE SET ${updateSet}`,
              [op.id, ...vals],
            )
            break
          }
          case 'PATCH': {
            const cols = Object.keys(op.opData ?? {})
            const vals = Object.values(op.opData ?? {})
            const setClause = cols.map((c, i) => `${c} = $${i + 2}`).join(', ')
            await client.query(`UPDATE ${op.table} SET ${setClause} WHERE id = $1`, [op.id, ...vals])
            break
          }
          case 'DELETE':
            await client.query(`DELETE FROM ${op.table} WHERE id = $1`, [op.id])
            break
        }
      }
      await client.query('COMMIT')
      return { success: true }
    } catch (err) {
      await client.query('ROLLBACK')
      console.error('[uploadPowerSyncData]', err)
      return { success: false, error: (err as Error).message }
    } finally {
      client.release()
      await pool.end()
    }
  })
