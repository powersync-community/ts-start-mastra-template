import { createServerFn } from '@tanstack/react-start'
import { Agent } from '@mastra/core/agent'

const chatAgent = new Agent({
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
    const result = await chatAgent.generate(data.messages)
    return { text: result.text }
  })
