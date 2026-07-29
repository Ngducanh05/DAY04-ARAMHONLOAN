const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status = 0, detail = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

async function request(path, options = {}) {
  const {
    timeoutMs = 10000,
    headers,
    ...fetchOptions
  } = options
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: {
        Accept: 'application/json',
        ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      signal: controller.signal,
    })

    const contentType = response.headers.get('content-type') || ''
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text()

    if (!response.ok) {
      const detail = typeof payload === 'object' ? payload?.detail : payload
      throw new ApiError(detail || `API request failed with status ${response.status}`, {
        status: response.status,
        detail: payload,
      })
    }

    return payload
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError(`API timeout after ${Math.round(timeoutMs / 1000)}s`)
    }
    if (error instanceof ApiError) throw error
    throw new ApiError(error?.message || 'Unable to reach Research Agent API')
  } finally {
    window.clearTimeout(timer)
  }
}

export function getHealth() {
  return request('/health', { timeoutMs: 5000 })
}

export function getTools() {
  return request('/tools', { timeoutMs: 5000 })
}

export function sendChat({ message, sessionId = '', version = 'v3', history = [] }) {
  return request('/chat', {
    method: 'POST',
    timeoutMs: 120000,
    body: JSON.stringify({
      message,
      session_id: sessionId,
      version,
      history,
    }),
  })
}

export function listTranscripts() {
  return request('/transcripts', { timeoutMs: 5000 })
}

export function getTranscript(filename) {
  return request(`/transcripts/${encodeURIComponent(filename)}`, { timeoutMs: 5000 })
}

export { API_BASE_URL }
