import { createServerFn } from '@tanstack/react-start'
import { Agent } from '@mastra/core/agent'

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
