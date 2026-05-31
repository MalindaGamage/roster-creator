/**
 * Ollama API wrapper — calls the local Ollama server via Vite proxy (/ollama).
 */

const BASE = '/ollama'

export async function ollamaChat(model, messages, onChunk) {
  const stream = typeof onChunk === 'function'

  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream,
      options: { temperature: 0.3, num_predict: 2048 },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Ollama error ${res.status}: ${text || res.statusText}`)
  }

  if (!stream) {
    const data = await res.json()
    return data.message?.content || ''
  }

  // Streaming response
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n').filter(Boolean)) {
      try {
        const obj = JSON.parse(line)
        const token = obj.message?.content || ''
        full += token
        onChunk(token, full)
      } catch {}
    }
  }
  return full
}

export async function ollamaGenerate(model, prompt) {
  const res = await fetch(`${BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.2, num_predict: 4096 },
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Ollama error ${res.status}: ${text || res.statusText}`)
  }
  const data = await res.json()
  return data.response || ''
}

export async function listModels() {
  const res = await fetch(`${BASE}/api/tags`)
  if (!res.ok) throw new Error('Cannot reach Ollama')
  const data = await res.json()
  return (data.models || []).map((m) => m.name)
}

export async function pingOllama() {
  try {
    const res = await fetch(`${BASE}/api/tags`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

/** Extract JSON from a free-form text response */
export function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    // Try to fix truncated JSON
    try {
      return JSON.parse(match[0] + '}')
    } catch {
      return null
    }
  }
}
