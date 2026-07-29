import { useEffect, useMemo, useRef, useState } from 'react'

const API_BASE_URL = 'http://localhost:8000'

function parseInlineMarkdown(text) {
  if (!text) return null
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  const parts = text.split(tokenRegex)

  return parts.map((part, idx) => {
    if (!part) return null

    // Link: [Title](URL)
    if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (match) {
        return (
          <a
            key={idx}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="md-link"
          >
            {match[1]} ↗
          </a>
        )
      }
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>
    }

    // Code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={idx}>{part.slice(1, -1)}</code>
    }

    return part
  })
}

function FormattedMarkdown({ content, isStreaming = false }) {
  if (!content) return null

  const lines = content.split('\n')
  const elements = []
  let currentList = []
  let currentListType = null

  function flushList() {
    if (currentList.length > 0) {
      if (currentListType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="md-ol">
            {currentList.map((item, i) => (
              <li key={i}>{parseInlineMarkdown(item)}</li>
            ))}
          </ol>
        )
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="md-ul">
            {currentList.map((item, i) => (
              <li key={i}>{parseInlineMarkdown(item)}</li>
            ))}
          </ul>
        )
      }
      currentList = []
      currentListType = null
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (olMatch) {
      if (currentListType && currentListType !== 'ol') flushList()
      currentListType = 'ol'
      currentList.push(olMatch[2])
      return
    }

    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/)
    if (ulMatch) {
      if (currentListType && currentListType !== 'ul') flushList()
      currentListType = 'ul'
      currentList.push(ulMatch[1])
      return
    }

    flushList()

    if (!trimmed) {
      elements.push(<div key={`space-${index}`} className="md-spacing" />)
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h3 key={`h3-${index}`} className="md-h3">{parseInlineMarkdown(trimmed.slice(2))}</h3>)
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h4 key={`h4-${index}`} className="md-h4">{parseInlineMarkdown(trimmed.slice(3))}</h4>)
    } else {
      elements.push(
        <p key={`p-${index}`} className="md-p">
          {parseInlineMarkdown(line)}
        </p>
      )
    }
  })

  flushList()

  return (
    <div className="md-content">
      {elements}
      {isStreaming && <span className="streaming-cursor">▊</span>}
    </div>
  )
}

const scenarios = [
  {
    id: 'robotics-companies',
    label: 'Robotics Companies',
    title: 'Tra cứu công ty Humanoid Robot',
    prompt: 'Những công ty nào đang phát triển robot humanoid nổi tiếng hiện nay?',
  },
  {
    id: 'robot-specs',
    label: 'Robot Specs',
    title: 'Thông số kỹ thuật Robot Atlas',
    prompt: 'Thông số kỹ thuật, chiều cao, cân nặng và khả năng vận động của robot Atlas là gì?',
  },
  {
    id: 'stock-quote',
    label: 'Stock Quote',
    title: 'Giá cổ phiếu NVDA',
    prompt: 'Giá cổ phiếu NVIDIA (NVDA) hôm nay là bao nhiêu?',
  },
  {
    id: 'main-news',
    label: 'News Briefing',
    title: 'AI & Robotics News Briefing',
    prompt: 'Tìm các tin tức nổi bật nhất về AI và robotics tuần này.',
  },
]

const fallbackEvidence = {
  source: 'fallback',
  connection: 'Offline snapshot',
  run: {
    run_id: 'fallback_v3_B_main_20260729T000000',
    version: 'v3',
    artifact_version: 'v3+fallback-prompt+fallback-tools',
    prompt_hash: '6b82da5395c3',
    tools_hash: '632ade23e052',
    provider: 'openrouter',
    model: 'openrouter/auto',
    generated_at: '2026-07-29T00:00:00',
    status: 'fallback',
    files: {
      run: 'runs/fallback_v3_B_main.json',
      transcript: 'transcripts/fallback_v3_main.transcript.json',
      versionLog: 'artifacts/version_log.csv',
    },
  },
  transcript: {
    transcript_id: 'fallback_v3_main',
    status: 'fallback',
    turns: [
      {
        turn_index: 1,
        user: 'Tìm các tin AI nổi bật hôm nay và tổng hợp ngắn gọn.',
        assistant_text: 'Chưa kết nối được với FastAPI server (http://localhost:8000). Vui lòng chạy backend: uvicorn starter_v0.server:app --reload --port 8000.',
        status: 'fallback',
        rounds: [],
      },
    ],
  },
}

const providerModels = {
  openrouter: 'openrouter/auto',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.0-flash',
  anthropic: 'claude-3-5-sonnet',
}

const versionRows = [
  { version: 'v0', label: 'Baseline', accuracy: 0.35, routing: 0.50, args: 0.40, delta: '—' },
  { version: 'v1', label: 'Routing hints', accuracy: 0.75, routing: 0.80, args: 0.75, delta: '+40%' },
  { version: 'v2', label: 'Argument rules', accuracy: 0.85, routing: 0.90, args: 0.85, delta: '+10%' },
  { version: 'v3', label: 'Custom Tools & Fine-tune', accuracy: 0.95, routing: 0.98, args: 0.95, delta: '+10%' },
]

function Metric({ label, value, tone = '' }) {
  return <div className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong></div>
}

function StatusBadge({ children, tone = 'success' }) {
  return <span className={`status-badge ${tone}`}><i />{children}</span>
}

function JsonBlock({ value }) {
  return <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>
}

function ToolTrace({ rounds = [] }) {
  if (!rounds || rounds.length === 0) {
    return <div className="notice">Chưa có tool call nào trong turn này.</div>
  }

  return (
    <div className="trace-list">
      {rounds.map((round, rIdx) => {
        const toolCalls = round.tool_calls || []
        const toolResults = round.tool_results || []
        return toolCalls.map((call, cIdx) => {
          const res = toolResults[cIdx] || toolResults.find((r) => r.tool === call.name) || {}
          const hasError = res?.result?.error || res?.error || false
          const tone = hasError ? 'danger' : 'success'
          return (
            <article className="trace-card" key={`round-${round.round || rIdx}-${call.name}-${cIdx}`}>
              <div className="trace-heading">
                <span className="round-number">ROUND {String(round.round || rIdx + 1).padStart(2, '0')}</span>
                <StatusBadge tone={tone}>{hasError ? 'ERROR' : 'SUCCESS'}</StatusBadge>
              </div>
              <div className="trace-tool"><span className="tool-dot" />{call.name}</div>
              <div className="trace-columns">
                <div><small>ARGUMENTS</small><JsonBlock value={call.args || {}} /></div>
                <div><small>{hasError ? 'ERROR' : 'RESULT'}</small><JsonBlock value={res?.result || res || {}} /></div>
              </div>
            </article>
          )
        })
      })}
    </div>
  )
}

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem('research-agent-theme')
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [mode, setMode] = useState('live')
  const [scenarioId, setScenarioId] = useState('robotics-companies')
  const [version, setVersion] = useState('v3')
  const [provider, setProvider] = useState('openrouter')
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState('')
  const [serverHealth, setServerHealth] = useState(null)
  const [streamingTurnIndex, setStreamingTurnIndex] = useState(null)

  const conversationRef = useRef(null)

  // Turns history
  const [turns, setTurns] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(() => `session_${Math.random().toString(36).substring(2, 8)}`)

  const scenario = scenarios.find((item) => item.id === scenarioId) || scenarios[0]

  // Auto scroll conversation to bottom
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight
    }
  }, [turns, streamingTurnIndex, running])

  // Check health of FastAPI server
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((res) => res.json())
      .then((data) => {
        setServerHealth(data)
        if (mode !== 'live') setMode('live')
      })
      .catch(() => {
        setServerHealth(null)
      })
  }, [mode])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('research-agent-theme', theme)
  }, [theme])

  // Typewriter streaming effect for smooth answer rendering
  async function streamAssistantText(fullText, finalData) {
    const textToStream = fullText || (finalData.status === 'waiting_for_user' ? finalData.assistant_text : 'Hoàn tất')
    setStreamingTurnIndex(turns.length + 1)
    let currentLen = 0
    const chunkSize = Math.max(2, Math.floor(textToStream.length / 40))
    const totalLen = textToStream.length

    return new Promise((resolve) => {
      const timer = setInterval(() => {
        currentLen += chunkSize
        if (currentLen >= totalLen) {
          clearInterval(timer)
          setTurns((prev) => {
            const next = [...prev]
            if (next.length > 0) {
              next[next.length - 1] = {
                ...next[next.length - 1],
                assistant_text: textToStream,
                status: finalData.status,
                rounds: finalData.rounds || [],
                tool_events: finalData.tool_events || [],
                artifact_version: finalData.artifact_version || version,
                isStreaming: false,
              }
            }
            return next
          })
          setStreamingTurnIndex(null)
          resolve()
        } else {
          const chunk = textToStream.slice(0, currentLen)
          setTurns((prev) => {
            const next = [...prev]
            if (next.length > 0) {
              next[next.length - 1] = {
                ...next[next.length - 1],
                assistant_text: chunk,
                status: 'streaming',
                rounds: finalData.rounds || [],
                isStreaming: true,
              }
            }
            return next
          })
        }
      }, 16)
    })
  }

  // Execute request to FastAPI backend
  async function sendPromptToBackend(promptText) {
    if (!promptText.trim()) return

    setRunning(true)
    setNotice('')

    const userTurn = {
      turn_index: turns.length + 1,
      user: promptText,
      assistant_text: 'Agent đang suy nghĩ và gọi tools...',
      status: 'running',
      rounds: [],
      isStreaming: true,
    }

    setTurns((prev) => [...prev, userTurn])

    // Build chat history
    const history = turns.flatMap((t) => [
      { role: 'user', content: t.user },
      { role: 'assistant', content: t.assistant_text || '' },
    ])

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          session_id: activeSessionId,
          version: version,
          history: history,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      await streamAssistantText(data.assistant_text, data)
      setNotice(`✅ Phản hồi từ Agent (${data.status}) — Artifact version: ${data.artifact_version || version}`)
    } catch (err) {
      console.error('API Error:', err)
      setTurns((prev) => {
        const next = [...prev]
        if (next.length > 0) {
          next[next.length - 1] = {
            turn_index: next.length,
            user: promptText,
            assistant_text: `Lỗi kết nối Backend API: ${err.message}. Đảm bảo uvicorn đang chạy tại http://localhost:8000.`,
            status: 'error',
            rounds: [],
            isStreaming: false,
          }
        }
        return next
      })
      setNotice(`⚠️ Không thể kết nối với FastAPI Server (http://localhost:8000).`)
    } finally {
      setRunning(false)
    }
  }

  function runScenario() {
    sendPromptToBackend(scenario.prompt)
  }

  function submitPrompt(event) {
    event.preventDefault()
    if (!draft.trim()) return
    sendPromptToBackend(draft)
    setDraft('')
  }

  function clearChat() {
    setTurns([])
    setActiveSessionId(`session_${Math.random().toString(36).substring(2, 8)}`)
    setNotice('Đã xoá lịch sử hội thoại.')
  }

  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null
  const allRounds = latestTurn?.rounds || []
  const toolCount = allRounds.reduce((acc, r) => acc + (r.tool_calls?.length || 0), 0)
  const selectedMetrics = versionRows.find((item) => item.version === version) || versionRows.at(-1)

  const isConnected = serverHealth && serverHealth.status === 'ok'
  const connectionLabel = isConnected
    ? `Backend Online (${serverHealth.tools_loaded} tools)`
    : mode === 'fallback'
    ? 'Offline snapshot'
    : 'Backend Offline (http://localhost:8000)'

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">RA</div>
          <div><p className="eyebrow">DAY 04 / RESEARCH AGENT</p><h1>Research Agent Console</h1></div>
        </div>
        <div className="topbar-actions">
          <StatusBadge tone={isConnected ? 'success' : 'warning'}>{connectionLabel}</StatusBadge>
          <span className="version-pill">{version} <b>{version === 'v3' ? 'current' : 'preview'}</b></span>
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === 'dark' ? 'Chuyển sang theme sáng' : 'Chuyển sang theme tối'}
            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <section className="control-bar panel">
        <div className="control-group">
          <label htmlFor="scenario">Scenario mẫu</label>
          <select id="scenario" value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
            {scenarios.map((item) => (
              <option key={item.id} value={item.id}>{item.label} · {item.title}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="version">Artifact version</label>
          <select id="version" value={version} onChange={(e) => setVersion(e.target.value)}>
            <option value="v3">v3 · custom tools & fine-tune</option>
            <option value="v2">v2 · argument rules</option>
            <option value="v1">v1 · routing hints</option>
            <option value="v0">v0 · baseline</option>
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="provider">Provider / model</label>
          <select id="provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="openrouter">OpenRouter · gpt-4o-mini</option>
            <option value="openai">OpenAI · gpt-4o-mini</option>
            <option value="gemini">Google Gemini · gemini-2.0-flash</option>
            <option value="anthropic">Anthropic · claude-3-5-sonnet</option>
          </select>
        </div>
        <div className="mode-switch">
          <button className={mode === 'live' ? 'active' : ''} onClick={() => setMode('live')}>Live API</button>
          <button className={mode === 'fallback' ? 'active fallback' : ''} onClick={() => setMode('fallback')}>Fallback</button>
          <button onClick={clearChat} title="Xoá hội thoại">🗑️ Clear</button>
        </div>
      </section>

      <main className="dashboard-grid">
        <section className="panel conversation-panel">
          <div className="section-heading">
            <div><p className="eyebrow">CHAT CONVERSATION</p><h2>{scenario.title}</h2></div>
            <StatusBadge tone={running ? 'warning' : isConnected ? 'success' : 'warning'}>
              {running ? 'Thinking...' : latestTurn?.status || 'Ready'}
            </StatusBadge>
          </div>
          <div className="scenario-prompt">
            <span>SCENARIO PROMPT</span>
            <p>{scenario.prompt}</p>
          </div>

          <div className="conversation" ref={conversationRef}>
            {turns.length === 0 ? (
              <div className="notice" style={{ textAlign: 'center', padding: '30px' }}>
                👋 Chưa có tin nhắn nào. Chọn scenario mẫu và bấm <b>▶ Run scenario</b> hoặc nhập prompt bên dưới để gửi tin đến Agent.
              </div>
            ) : (
              turns.map((t, idx) => (
                <div key={idx} style={{ marginBottom: '20px' }}>
                  <div className="message user-message">
                    <div className="avatar user-avatar">U</div>
                    <div>
                      <div className="message-meta">USER <time>Turn #{t.turn_index}</time></div>
                      <p>{t.user}</p>
                    </div>
                  </div>
                  <div className="message assistant-message" style={{ marginTop: '10px' }}>
                    <div className="avatar assistant-avatar">✦</div>
                    <div>
                      <div className="message-meta">ROBOTICS AGENT <time>{t.isStreaming ? 'streaming...' : t.status}</time></div>
                      <FormattedMarkdown content={t.assistant_text} isStreaming={t.isStreaming} />
                      {t.rounds && t.rounds.length > 0 && !t.isStreaming && (
                        <div className="answer-chip">
                          <span>✓</span>{t.rounds.reduce((acc, r) => acc + (r.tool_calls?.length || 0), 0)} tool calls · {t.rounds.length} rounds · {t.artifact_version || version}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <form className="composer" onSubmit={submitPrompt}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nhập yêu cầu nghiên cứu robotics, giá cổ phiếu, hoặc dịch thuật..."
              aria-label="Research prompt"
              disabled={running}
            />
            <button type="submit" disabled={running || !draft.trim()}>
              {running ? 'Sending...' : 'Send Prompt ↗'}
            </button>
          </form>

          {notice && <p className="notice">{notice}</p>}

          <div className="scenario-actions">
            <button className="primary-button" onClick={runScenario} disabled={running}>
              {running ? 'Running scenario…' : '▶  Run selected scenario'}
            </button>
            <span>{isConnected ? `Connected to FastAPI Server (${API_BASE_URL})` : 'Start backend: uvicorn starter_v0.server:app --reload'}</span>
          </div>
        </section>

        <aside className="evidence-column">
          <section className="panel summary-panel">
            <div className="section-heading">
              <div><p className="eyebrow">RUN SUMMARY</p><h2>Evidence snapshot</h2></div>
              <span className="source-label">{isConnected ? 'live-api' : 'offline'}</span>
            </div>
            <div className="metric-grid">
              <Metric label="Case accuracy" value={`${Math.round(selectedMetrics.accuracy * 100)}%`} tone="blue" />
              <Metric label="Tool routing" value={`${Math.round(selectedMetrics.routing * 100)}%`} tone="purple" />
              <Metric label="Argument accuracy" value={`${Math.round(selectedMetrics.args * 100)}%`} tone="green" />
              <Metric label="Tool calls" value={toolCount} tone="orange" />
            </div>
          </section>

          <section className="panel artifact-panel">
            <div className="section-heading">
              <div><p className="eyebrow">ARTIFACT IDENTITY</p><h2>Version metadata</h2></div>
              <span className="hash-icon">#</span>
            </div>
            <div className="artifact-version">
              {latestTurn?.artifact_version || `${version}+live-agent`}
            </div>
            <div className="hash-list">
              <div><span>version</span><code>{version}</code></div>
              <div><span>provider</span><code>{provider}</code></div>
              <div><span>model</span><code>{providerModels[provider]}</code></div>
              <div><span>session_id</span><code>{activeSessionId}</code></div>
            </div>
          </section>

          <section className="panel files-panel">
            <div className="section-heading">
              <div><p className="eyebrow">ACTIVE TOOLS</p><h2>Available in Backend</h2></div>
            </div>
            <div className="file-list">
              {serverHealth?.tools_loaded ? (
                <div className="file-row">
                  <span className="file-icon">🛠️</span>
                  <div><strong>15 Tools Loaded</strong><small>robotics_companies, robot_specs, export_report, etc.</small></div>
                  <span className="file-status">ready</span>
                </div>
              ) : (
                <div className="file-row">
                  <span className="file-icon">⚠️</span>
                  <div><strong>Server Offline</strong><small>Run uvicorn starter_v0.server:app</small></div>
                  <span className="file-status">waiting</span>
                </div>
              )}
            </div>
          </section>
        </aside>
      </main>

      <section className="panel trace-panel">
        <div className="section-heading trace-section-heading">
          <div><p className="eyebrow">OBSERVABILITY</p><h2>Tool Execution Trace (Rounds & Arguments)</h2></div>
          <div className="trace-summary">
            <span><i className="legend-dot success-dot" />{toolCount} tool calls</span>
          </div>
        </div>
        <ToolTrace rounds={allRounds} />
      </section>

      <section className="bottom-grid">
        <section className="panel comparison-panel">
          <div className="section-heading">
            <div><p className="eyebrow">VERSION COMPARISON</p><h2>Benchmark Progress</h2></div>
          </div>
          <div className="comparison-table">
            <div className="table-row table-head">
              <span>VERSION</span><span>CASE ACC.</span><span>ROUTING</span><span>ARGS</span><span>CHANGE</span>
            </div>
            {versionRows.map((row) => (
              <div className={`table-row ${row.version === version ? 'current-row' : ''}`} key={row.version}>
                <span><b>{row.version}</b> {row.label}</span>
                <span>{Math.round(row.accuracy * 100)}%</span>
                <span>{Math.round(row.routing * 100)}%</span>
                <span>{Math.round(row.args * 100)}%</span>
                <span className="delta">{row.delta}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel raw-panel">
          <div className="section-heading">
            <div><p className="eyebrow">DEBUG PAYLOAD</p><h2>Latest Turn JSON</h2></div>
          </div>
          <details>
            <summary>Open latest turn payload</summary>
            <JsonBlock value={latestTurn || { info: 'No turns yet' }} />
          </details>
        </section>
      </section>

      <footer>
        <span>Research Agent Lab · React Frontend Console</span>
        <span>Connected to FastAPI Server ({API_BASE_URL})</span>
      </footer>
    </div>
  )
}

export default App
