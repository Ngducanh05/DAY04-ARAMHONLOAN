import { useEffect, useMemo, useState } from 'react'
import {
  API_BASE_URL,
  getHealth,
  getTools,
  getTranscript,
  listTranscripts,
  sendChat,
} from './api/researchAgentApi'

const scenarios = [
  {
    id: 'main-news',
    label: 'Main scenario',
    title: 'AI news briefing',
    prompt: 'Tìm các tin AI nổi bật hôm nay, lấy tối đa 3 nguồn và trình bày thành digest ngắn gọn.',
  },
  {
    id: 'missing-info',
    label: 'Boundary check',
    title: 'Missing information',
    prompt: 'Tóm tắt 5 tweet mới nhất giúp mình.',
  },
]

const liveEvidence = {
  source: 'mock-live',
  connection: 'Provider ready',
  run: {
    run_id: 'mock_v3_B_main_20260729T091500',
    version: 'v3',
    artifact_version: 'v3+pa1b2c3d4e5f6+t1a2b3c4d5e6f',
    prompt_hash: 'a1b2c3d4e5f6',
    tools_hash: '1a2b3c4d5e6f',
    provider: 'openrouter',
    model: 'openai/gpt-4o-mini',
    generated_at: '2026-07-29T09:15:00',
    status: 'answered',
    files: {
      run: 'runs/mock_v3_B_main_20260729T091500.json',
      transcript: 'transcripts/mock_v3_openrouter_20260729T091500.transcript.json',
      versionLog: 'artifacts/version_log.csv',
    },
  },
  transcript: {
    transcript_id: 'mock_v3_openrouter_20260729T091500',
    status: 'answered',
    turns: [
      {
        turn_index: 1,
        user: 'Tìm các tin AI nổi bật hôm nay, lấy tối đa 3 nguồn và trình bày thành digest ngắn gọn.',
        assistant_text: 'Mình đã tìm 3 nguồn và tổng hợp thành digest. Các nguồn được giữ lại để bạn kiểm tra.',
        status: 'answered',
        rounds: [
          {
            round: 1,
            tool_calls: [{ name: 'lookup', args: { query: 'AI', topic: 'news', timeframe: 'day', max_results: 3 } }],
            tool_results: [{
              tool: 'lookup',
              status: 'ok',
              result: {
                items: [
                  { title: 'AI safety evaluations move toward real-world tasks', source: 'research.example', url: 'https://example.com/ai-evals', summary: 'Mock source for the frontend demo.' },
                  { title: 'Open-source agents add stronger tool-use checks', source: 'labs.example', url: 'https://example.com/agents', summary: 'Mock source for the frontend demo.' },
                  { title: 'Teams standardize evidence logs for agent runs', source: 'engineering.example', url: 'https://example.com/evidence', summary: 'Mock source for the frontend demo.' },
                ],
              },
            }],
          },
          {
            round: 2,
            tool_calls: [{ name: 'format', args: { template: 'sections', headline: 'AI news briefing' } }],
            tool_results: [{
              tool: 'format',
              status: 'ok',
              result: { item_count: 3, markdown: '## AI news briefing\n\n- 3 mock sources grouped into a concise digest.' },
            }],
          },
        ],
      },
    ],
  },
}

const fallbackEvidence = {
  ...liveEvidence,
  source: 'fallback',
  connection: 'Offline snapshot',
  run: {
    ...liveEvidence.run,
    run_id: 'fallback_v3_B_main_20260729T000000',
    artifact_version: 'v3+fallback-prompt+fallback-tools',
    generated_at: '2026-07-29T00:00:00',
    status: 'fallback',
    error: { code: 'PROVIDER_TIMEOUT', message: 'Provider timeout after 10s; fallback evidence was retained.' },
    files: {
      run: 'fallback/fallback_v3_B_main.json',
      transcript: 'fallback/fallback_v3_main.transcript.json',
      versionLog: 'artifacts/version_log.csv',
    },
  },
  transcript: {
    ...liveEvidence.transcript,
    transcript_id: 'fallback_v3_main',
    status: 'fallback',
    turns: [{
      ...liveEvidence.transcript.turns[0],
      status: 'fallback',
      assistant_text: 'Mạng đang chập chờn. Đây là transcript mẫu đã lưu để tiếp tục demo và kiểm tra trace.',
      rounds: liveEvidence.transcript.turns[0].rounds.map((round) => ({
        ...round,
        tool_results: round.tool_results.map((event) => ({ ...event, status: 'fallback' })),
      })),
    }],
  },
  fallbackReason: 'Provider timeout after 10s; retained the last known scenario snapshot.',
}

const boundaryTurn = {
  turn_index: 1,
  user: 'Tóm tắt 5 tweet mới nhất giúp mình.',
  assistant_text: 'Bạn muốn lấy 5 bài đăng gần nhất từ tài khoản nào?',
  status: 'waiting_for_user',
  rounds: [{
    round: 1,
    tool_calls: [{ name: 'clarify', args: { question: 'Bạn muốn lấy bài đăng từ tài khoản nào?', response_type: 'text' } }],
    tool_results: [{
      tool: 'clarify',
      status: 'ok',
      result: {
        awaiting_user: true,
        question: 'Bạn muốn lấy bài đăng từ tài khoản nào?',
        response_type: 'text',
      },
    }],
  }],
}

const versionRows = [
  { version: 'v0', label: 'Baseline', accuracy: 0.6, routing: 0.7, args: 0.6, delta: '—' },
  { version: 'v1', label: 'Routing hints', accuracy: 0.7, routing: 0.8, args: 0.7, delta: '+10%' },
  { version: 'v2', label: 'Argument rules', accuracy: 0.8, routing: 0.9, args: 0.8, delta: '+10%' },
  { version: 'v3', label: 'Current', accuracy: 1, routing: 1, args: 1, delta: '+20%' },
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

function ToolTrace({ turns }) {
  const events = turns.flatMap((turn) => (turn.rounds || []).flatMap((round) => {
    const results = round.tool_results || []
    if (results.length) {
      return results.map((event, index) => ({
        ...event,
        round: round.round,
        args: event.args || round.tool_calls?.[index]?.args || {},
        tool: event.tool || round.tool_calls?.[index]?.name || 'unknown',
      }))
    }
    return (round.tool_calls || []).map((call) => ({
      round: round.round,
      tool: call.name,
      args: call.args || {},
      result: { status: 'No tool result returned' },
      status: 'error',
    }))
  }))

  if (!events.length) {
    return <p className="empty-state">Không có tool call trong lượt này.</p>
  }

  return (
    <div className="trace-list">
      {events.map((event, index) => {
        const hasError = event?.error || event?.result?.error || event?.status === 'error'
        const tone = hasError ? 'danger' : event?.status === 'fallback' ? 'warning' : 'success'
        return (
          <article className="trace-card" key={`${event.round}-${event.tool}-${index}`}>
            <div className="trace-heading">
              <span className="round-number">ROUND {String(event.round).padStart(2, '0')}</span>
              <StatusBadge tone={tone}>{hasError ? 'error' : event?.status === 'fallback' ? 'fallback' : 'success'}</StatusBadge>
            </div>
            <div className="trace-tool"><span className="tool-dot" />{event.tool}</div>
            <div className="trace-columns">
              <div><small>ARGS</small><JsonBlock value={event.args || {}} /></div>
              <div><small>{hasError ? 'ERROR' : 'RESULT'}</small><JsonBlock value={event.error || event.result || {}} /></div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem('research-agent-theme')
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function parseArtifactVersion(artifactVersion = '') {
  const match = artifactVersion.match(/^[^+]+\+p([^+]+)\+t(.+)$/)
  return {
    promptHash: match?.[1] || 'not-exposed',
    toolsHash: match?.[2] || 'not-exposed',
  }
}

function normalizeTurn({ message, response, turnIndex = 1 }) {
  return {
    turn_index: turnIndex,
    user: message,
    assistant_text: response.assistant_text || response.error || 'Không có nội dung trả về.',
    status: response.status || (response.error ? 'error' : 'answered'),
    rounds: response.rounds || [],
  }
}

function storedTranscriptToTurn(transcript) {
  if (!transcript) return null
  if (Array.isArray(transcript.turns) && transcript.turns.length) {
    return transcript.turns.at(-1)
  }
  if (!transcript.user_message) return null
  return {
    turn_index: transcript.history_turns + 1 || 1,
    user: transcript.user_message,
    assistant_text: transcript.assistant_text || transcript.error || '',
    status: transcript.status || 'answered',
    rounds: transcript.rounds || [],
  }
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [mode, setMode] = useState('live')
  const [scenarioId, setScenarioId] = useState('main-news')
  const [version, setVersion] = useState('v3')
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState('')
  const [apiState, setApiState] = useState({ status: 'checking', health: null, error: null })
  const [toolCatalog, setToolCatalog] = useState([])
  const [apiResponse, setApiResponse] = useState(null)
  const [apiTurn, setApiTurn] = useState(null)
  const [sessionId, setSessionId] = useState('')
  const [history, setHistory] = useState([])
  const [latestTranscriptName, setLatestTranscriptName] = useState('')
  const [storedTranscript, setStoredTranscript] = useState(null)
  const [lastRequestAt, setLastRequestAt] = useState('')

  const evidence = mode === 'fallback' ? fallbackEvidence : liveEvidence
  const scenario = scenarios.find((item) => item.id === scenarioId) || scenarios[0]
  const scenarioTurn = scenarioId === 'missing-info' ? boundaryTurn : liveEvidence.transcript.turns[0]
  const storedTurn = useMemo(() => storedTranscriptToTurn(storedTranscript), [storedTranscript])
  const turn = useMemo(() => {
    if (mode === 'live') return apiTurn || scenarioTurn
    const fallbackBase = storedTurn || (
      scenarioId === 'missing-info'
        ? boundaryTurn
        : fallbackEvidence.transcript.turns[0]
    )
    return {
      ...fallbackBase,
      status: 'fallback',
      rounds: (fallbackBase.rounds || []).map((round) => ({
        ...round,
        tool_results: (round.tool_results || []).map((event) => ({ ...event, status: 'fallback' })),
      })),
    }
  }, [apiTurn, mode, scenarioId, scenarioTurn, storedTurn])

  const selectedMetrics = versionRows.find((item) => item.version === version) || versionRows.at(-1)
  const resolvedArtifactVersion = apiResponse?.artifact_version
    || storedTranscript?.artifact_version
    || (mode === 'fallback' ? fallbackEvidence.run.artifact_version : liveEvidence.run.artifact_version)
  const artifactHashes = parseArtifactVersion(resolvedArtifactVersion)
  const displayRun = useMemo(() => {
    const responseError = apiResponse?.error
    const connectionError = apiState.status === 'offline'
      ? apiState.error
      : null
    return {
      ...evidence.run,
      run_id: apiResponse?.session_id ? `chat_${apiResponse.session_id}` : evidence.run.run_id,
      version,
      artifact_version: resolvedArtifactVersion,
      prompt_hash: artifactHashes.promptHash,
      tools_hash: artifactHashes.toolsHash,
      provider: apiState.health?.provider_ready ? 'server-configured' : 'unavailable',
      model: 'not-exposed-by-api',
      generated_at: lastRequestAt || storedTranscript?.created_at || apiState.health?.timestamp || evidence.run.generated_at,
      status: mode === 'fallback' ? 'fallback' : turn.status,
      error: responseError || connectionError
        ? {
            code: responseError ? 'CHAT_ERROR' : 'API_UNREACHABLE',
            message: responseError || connectionError,
          }
        : undefined,
      files: {
        run: 'API missing: GET /runs',
        transcript: latestTranscriptName
          ? `transcripts/${latestTranscriptName}`
          : apiResponse ? 'Saved; filename not returned by POST /chat' : 'No transcript selected',
        versionLog: 'API missing: GET /versions',
      },
    }
  }, [
    apiResponse,
    apiState,
    artifactHashes.promptHash,
    artifactHashes.toolsHash,
    evidence.run,
    lastRequestAt,
    latestTranscriptName,
    mode,
    resolvedArtifactVersion,
    storedTranscript,
    turn.status,
    version,
  ])
  const displayTranscript = useMemo(() => ({
    ...evidence.transcript,
    transcript_id: latestTranscriptName || apiResponse?.session_id || `${mode}_${version}_${scenarioId}`,
    status: displayRun.status,
    turns: [turn],
  }), [apiResponse, displayRun.status, evidence.transcript, latestTranscriptName, mode, scenarioId, turn, version])
  const toolCount = turn.rounds.reduce((count, round) => count + (round.tool_calls?.length || 0), 0)
  const toolErrorCount = turn.rounds.reduce(
    (count, round) => count + (round.tool_results || []).filter(
      (event) => event.error || event.result?.error || event.status === 'error',
    ).length,
    0,
  )
  const payloadPreview = useMemo(() => ({ run: displayRun, transcript: displayTranscript }), [displayRun, displayTranscript])
  const statusTone = turn.status === 'error'
    ? 'danger'
    : mode === 'fallback' || turn.status !== 'answered' ? 'warning' : 'success'
  const connectionLabel = mode === 'fallback'
    ? 'Offline snapshot'
    : apiState.status === 'checking'
      ? 'Checking API'
      : apiState.status === 'online'
        ? apiState.health?.provider_ready ? 'API ready' : 'API · provider missing'
        : 'API offline'
  const connectionTone = mode === 'fallback' || apiState.status === 'checking'
    ? 'warning'
    : apiState.status === 'online' && apiState.health?.provider_ready ? 'success' : 'danger'
  const sourceLabel = mode === 'fallback'
    ? storedTurn ? 'saved-transcript' : 'fallback'
    : apiResponse ? 'api-live' : apiState.status === 'online' ? 'api-ready' : 'mock-preview'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('research-agent-theme', theme)
  }, [theme])

  useEffect(() => {
    let active = true

    async function bootstrapApi() {
      const [healthResult, toolsResult, transcriptsResult] = await Promise.allSettled([
        getHealth(),
        getTools(),
        listTranscripts(),
      ])
      if (!active) return

      if (healthResult.status === 'fulfilled') {
        setApiState({ status: 'online', health: healthResult.value, error: null })
      } else {
        setApiState({
          status: 'offline',
          health: null,
          error: healthResult.reason?.message || 'Unable to reach API',
        })
      }

      if (toolsResult.status === 'fulfilled') {
        setToolCatalog(toolsResult.value.tools || [])
      }

      if (transcriptsResult.status === 'fulfilled') {
        const filename = transcriptsResult.value.transcripts?.[0]
        if (filename) {
          setLatestTranscriptName(filename)
          try {
            const transcript = await getTranscript(filename)
            if (active) setStoredTranscript(transcript)
          } catch {
            // The transcript index is still useful even when this file was rotated.
          }
        }
      }
    }

    bootstrapApi()
    return () => {
      active = false
    }
  }, [])

  async function refreshLatestTranscript() {
    try {
      const payload = await listTranscripts()
      const filename = payload.transcripts?.[0] || ''
      setLatestTranscriptName(filename)
      if (filename) {
        const transcript = await getTranscript(filename)
        setStoredTranscript(transcript)
      }
    } catch {
      // POST /chat succeeded; transcript discovery is best-effort until the API
      // returns transcript_filename directly.
    }
  }

  async function executeChat(message) {
    if (mode === 'fallback') {
      setNotice('Đang ở fallback mode. Chuyển sang Live API để gửi request mới.')
      return
    }

    setRunning(true)
    setNotice('')
    try {
      const response = await sendChat({
        message,
        sessionId,
        version,
        history,
      })
      const nextTurn = normalizeTurn({
        message,
        response,
        turnIndex: Math.floor(history.length / 2) + 1,
      })
      const nextHistory = [
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: response.assistant_text || response.error || '' },
      ].slice(-10)

      setApiResponse(response)
      setApiTurn(nextTurn)
      setSessionId(response.session_id || sessionId)
      setHistory(nextHistory)
      setLastRequestAt(new Date().toISOString())
      setApiState((current) => ({
        ...current,
        status: 'online',
        health: current.health || { provider_ready: true },
        error: null,
      }))
      setNotice(response.error
        ? `API trả về lỗi: ${response.error}`
        : 'Scenario đã chạy qua FastAPI và tool trace đã được cập nhật.')
      await refreshLatestTranscript()
    } catch (error) {
      setApiState((current) => ({
        ...current,
        status: 'offline',
        error: error.message,
      }))
      setMode('fallback')
      setNotice(`Không gọi được API: ${error.message}. Đã chuyển sang fallback transcript.`)
    } finally {
      setRunning(false)
    }
  }

  function selectScenario(nextScenarioId) {
    setScenarioId(nextScenarioId)
    setApiResponse(null)
    setApiTurn(null)
    setNotice('')
  }

  function runScenario() {
    executeChat(scenario.prompt)
  }

  function submitPrompt(event) {
    event.preventDefault()
    if (!draft.trim()) return
    const message = draft.trim()
    setDraft('')
    executeChat(message)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">RA</div>
          <div><p className="eyebrow">DAY 04 / TOOL EVAL</p><h1>Research Agent Console</h1></div>
        </div>
        <div className="topbar-actions">
          <StatusBadge tone={connectionTone}>{connectionLabel}</StatusBadge>
          <span className="version-pill">{displayRun.version} <b>{version === 'v3' ? 'current' : 'preview'}</b></span>
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === 'dark' ? 'Chuyển sang theme sáng' : 'Chuyển sang theme tối'}
            aria-pressed={theme === 'light'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <section className="control-bar panel">
        <div className="control-group"><label htmlFor="scenario">Scenario</label><select id="scenario" value={scenarioId} onChange={(event) => selectScenario(event.target.value)}>{scenarios.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.title}</option>)}</select></div>
        <div className="control-group"><label htmlFor="version">Artifact version</label><select id="version" value={version} onChange={(event) => setVersion(event.target.value)}><option value="v3">v3 · current</option><option value="v2">v2 · argument rules</option><option value="v1">v1 · routing hints</option><option value="v0">v0 · baseline</option></select></div>
        <div className="control-group"><label htmlFor="provider">Backend provider</label><select id="provider" value="server" disabled><option value="server">{apiState.health?.provider_ready ? `Server configured · ${toolCatalog.length} tools` : 'Configured by AGENT_PROVIDER'}</option></select></div>
        <div className="mode-switch" role="group" aria-label="Evidence source"><button className={mode === 'live' ? 'active' : ''} onClick={() => setMode('live')}>Live API</button><button className={mode === 'fallback' ? 'active fallback' : ''} onClick={() => setMode('fallback')}>Fallback</button></div>
      </section>

      <main className="dashboard-grid">
        <section className="panel conversation-panel">
          <div className="section-heading"><div><p className="eyebrow">LIVE SCENARIO</p><h2>{scenario.title}</h2></div><StatusBadge tone={statusTone}>{displayRun.status}</StatusBadge></div>
          <div className="scenario-prompt"><span>REQUEST</span><p>{turn.user}</p></div>
          <div className="conversation">
            <div className="message user-message"><div className="avatar user-avatar">U</div><div><div className="message-meta">USER <time>{lastRequestAt ? 'latest' : 'preview'}</time></div><p>{turn.user}</p></div></div>
            <div className="message assistant-message"><div className="avatar assistant-avatar">✦</div><div><div className="message-meta">AGENT <time>{mode === 'fallback' ? 'snapshot' : apiResponse ? 'live API' : 'preview'}</time></div><p>{turn.assistant_text}</p><div className="answer-chip"><span>✓</span>{toolCount} tool calls · {turn.rounds.length} rounds · {latestTranscriptName ? 'transcript discovered' : 'transcript pending'}</div></div></div>
          </div>
          <form className="composer" onSubmit={submitPrompt}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={mode === 'fallback' ? 'Chuyển sang Live API để gửi yêu cầu…' : 'Thử một yêu cầu research khác...'} aria-label="Research prompt" disabled={running || mode === 'fallback'} /><button type="submit" disabled={running || mode === 'fallback'}>{running ? 'Running…' : 'Send to API'} <span>↗</span></button></form>
          {notice && <p className="notice">{notice}</p>}
          <div className="scenario-actions"><button className="primary-button" onClick={runScenario} disabled={running}>{running ? 'Running scenario…' : '▶  Run selected scenario'}</button><span>{mode === 'fallback' ? fallbackEvidence.fallbackReason : `FastAPI: ${API_BASE_URL} · session: ${sessionId || 'new'}`}</span></div>
        </section>

        <aside className="evidence-column">
          <section className="panel summary-panel"><div className="section-heading"><div><p className="eyebrow">RUN SUMMARY</p><h2>Evidence snapshot</h2></div><span className="source-label">{sourceLabel}</span></div><div className="metric-grid"><Metric label="Case accuracy · mock" value={`${Math.round(selectedMetrics.accuracy * 100)}%`} tone="blue" /><Metric label="Tool routing · mock" value={`${Math.round(selectedMetrics.routing * 100)}%`} tone="purple" /><Metric label="Loaded tools · API" value={toolCatalog.length || '—'} tone="green" /><Metric label="Tool events · API" value={toolCount} tone="orange" /></div></section>
          <section className="panel artifact-panel"><div className="section-heading"><div><p className="eyebrow">ARTIFACT IDENTITY</p><h2>Version is visible</h2></div><span className="hash-icon">#</span></div><div className="artifact-version">{displayRun.artifact_version}</div>{displayRun.error && <div className="error-strip"><strong>{displayRun.error.code}</strong><span>{displayRun.error.message}</span></div>}<div className="hash-list"><div><span>prompt hash</span><code>{displayRun.prompt_hash}</code></div><div><span>tools hash</span><code>{displayRun.tools_hash}</code></div><div><span>provider</span><code>{displayRun.provider}</code></div><div><span>generated</span><code>{displayRun.generated_at}</code></div></div></section>
          <section className="panel files-panel"><div className="section-heading"><div><p className="eyebrow">SAVED EVIDENCE</p><h2>Files to hand off</h2></div></div><div className="file-list"><div className="file-row"><span className="file-icon">{'{ }'}</span><div><strong>Run JSON</strong><small>{displayRun.files.run}</small></div><span className="file-status missing">missing</span></div><div className="file-row"><span className="file-icon">≡</span><div><strong>Transcript JSON</strong><small>{displayRun.files.transcript}</small></div><span className={`file-status ${latestTranscriptName ? '' : 'pending'}`}>{latestTranscriptName ? 'ready' : 'pending'}</span></div><div className="file-row"><span className="file-icon">▤</span><div><strong>Version metrics</strong><small>{displayRun.files.versionLog}</small></div><span className="file-status missing">missing</span></div></div></section>
        </aside>
      </main>

      <section className="panel trace-panel"><div className="section-heading trace-section-heading"><div><p className="eyebrow">OBSERVABILITY</p><h2>Tool trace / result / error</h2></div><div className="trace-summary"><span><i className="legend-dot success-dot" />{Math.max(0, toolCount - toolErrorCount)} successful calls</span><span><i className="legend-dot warning-dot" />{toolErrorCount} errors</span></div></div><ToolTrace turns={displayTranscript.turns} /></section>

      <section className="bottom-grid">
        <section className="panel comparison-panel"><div className="section-heading"><div><p className="eyebrow">VERSION COMPARISON</p><h2>Same scenario, visible progress</h2></div></div><div className="comparison-table"><div className="table-row table-head"><span>VERSION</span><span>CASE ACC.</span><span>ROUTING</span><span>ARGS</span><span>CHANGE</span></div>{versionRows.map((row) => <div className={`table-row ${row.version === version ? 'current-row' : ''}`} key={row.version}><span><b>{row.version}</b> {row.label}</span><span>{Math.round(row.accuracy * 100)}%</span><span>{Math.round(row.routing * 100)}%</span><span>{Math.round(row.args * 100)}%</span><span className="delta">{row.delta}</span></div>)}</div></section>
        <section className="panel raw-panel"><div className="section-heading"><div><p className="eyebrow">DEBUG PAYLOAD</p><h2>Contract preview</h2></div></div><details><summary>Open run + transcript JSON</summary><JsonBlock value={payloadPreview} /></details></section>
      </section>

      <footer><span>Research Agent Lab · FastAPI evidence console</span><span>Live chat/transcripts connected · run metrics remain mock until APIs are added.</span></footer>
    </div>
  )
}

export default App
