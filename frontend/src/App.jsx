import { useEffect, useMemo, useState } from 'react'

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

const providerModels = {
  openrouter: 'openai/gpt-4o-mini',
  openai: 'configured-model',
  mock: 'local-fixture',
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
  const rounds = turns.flatMap((turn) => turn.rounds || [])
  return (
    <div className="trace-list">
      {rounds.map((round) => {
        const event = round.tool_results?.[0]
        const hasError = event?.result?.error || event?.status === 'error'
        const tone = hasError ? 'danger' : event?.status === 'fallback' ? 'warning' : 'success'
        return (
          <article className="trace-card" key={`${round.round}-${event?.tool}`}>
            <div className="trace-heading">
              <span className="round-number">ROUND {String(round.round).padStart(2, '0')}</span>
              <StatusBadge tone={tone}>{hasError ? 'error' : event?.status === 'fallback' ? 'fallback' : 'success'}</StatusBadge>
            </div>
            <div className="trace-tool"><span className="tool-dot" />{event?.tool || round.tool_calls?.[0]?.name}</div>
            <div className="trace-columns">
              <div><small>ARGS</small><JsonBlock value={event?.args || round.tool_calls?.[0]?.args || {}} /></div>
              <div><small>{hasError ? 'ERROR' : 'RESULT'}</small><JsonBlock value={event?.result || event?.error || {}} /></div>
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

function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [mode, setMode] = useState('live')
  const [scenarioId, setScenarioId] = useState('main-news')
  const [version, setVersion] = useState('v3')
  const [provider, setProvider] = useState('openrouter')
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState('')
  const evidence = mode === 'fallback' ? fallbackEvidence : liveEvidence
  const scenario = scenarios.find((item) => item.id === scenarioId) || scenarios[0]
  const baseTurn = scenarioId === 'missing-info' ? boundaryTurn : evidence.transcript.turns[0]
  const turn = useMemo(() => {
    if (mode !== 'fallback' || scenarioId === 'main-news') return baseTurn
    return {
      ...baseTurn,
      status: 'fallback',
      assistant_text: 'Đang dùng transcript dự phòng. Bạn muốn lấy 5 bài đăng gần nhất từ tài khoản nào?',
      rounds: baseTurn.rounds.map((round) => ({
        ...round,
        tool_results: round.tool_results.map((event) => ({ ...event, status: 'fallback' })),
      })),
    }
  }, [baseTurn, mode, scenarioId])
  const selectedMetrics = versionRows.find((item) => item.version === version) || versionRows.at(-1)
  const displayRun = useMemo(() => ({
    ...evidence.run,
    version,
    artifact_version: mode === 'fallback'
      ? `${version}+fallback-prompt+fallback-tools`
      : `${version}+p${evidence.run.prompt_hash}+t${evidence.run.tools_hash}`,
    provider,
    model: providerModels[provider],
    status: mode === 'fallback' ? 'fallback' : turn.status,
  }), [evidence.run, mode, provider, turn.status, version])
  const displayTranscript = useMemo(() => ({
    ...evidence.transcript,
    transcript_id: `${mode === 'fallback' ? 'fallback' : 'mock'}_${version}_${provider}_${scenarioId}`,
    status: displayRun.status,
    turns: [turn],
  }), [displayRun.status, evidence.transcript, mode, provider, scenarioId, turn, version])
  const toolCount = turn.rounds.reduce((count, round) => count + (round.tool_calls?.length || 0), 0)
  const payloadPreview = useMemo(() => ({ run: displayRun, transcript: displayTranscript }), [displayRun, displayTranscript])
  const statusTone = mode === 'fallback' || turn.status !== 'answered' ? 'warning' : 'success'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('research-agent-theme', theme)
  }, [theme])

  function runScenario() {
    setRunning(true)
    setNotice('')
    window.setTimeout(() => {
      setRunning(false)
      setNotice(mode === 'fallback' ? 'Đã mở lại fallback run/transcript.' : 'Scenario đã chạy xong và evidence đã được ghi nhận.')
    }, 650)
  }

  function submitPrompt(event) {
    event.preventDefault()
    if (!draft.trim()) return
    setNotice('Prompt đã được thêm vào demo queue. Backend adapter sẽ nhận input này khi ghép API.')
    setDraft('')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">RA</div>
          <div><p className="eyebrow">DAY 04 / TOOL EVAL</p><h1>Research Agent Console</h1></div>
        </div>
        <div className="topbar-actions">
          <StatusBadge tone={mode === 'fallback' ? 'warning' : 'success'}>{evidence.connection}</StatusBadge>
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
        <div className="control-group"><label htmlFor="scenario">Scenario</label><select id="scenario" value={scenarioId} onChange={(event) => setScenarioId(event.target.value)}>{scenarios.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.title}</option>)}</select></div>
        <div className="control-group"><label htmlFor="version">Artifact version</label><select id="version" value={version} onChange={(event) => setVersion(event.target.value)}><option value="v3">v3 · current</option><option value="v2">v2 · argument rules</option><option value="v1">v1 · routing hints</option><option value="v0">v0 · baseline</option></select></div>
        <div className="control-group"><label htmlFor="provider">Provider / model</label><select id="provider" value={provider} onChange={(event) => setProvider(event.target.value)}><option value="openrouter">OpenRouter · gpt-4o-mini</option><option value="openai">OpenAI · configured model</option><option value="mock">Mock provider · local</option></select></div>
        <div className="mode-switch" role="group" aria-label="Evidence source"><button className={mode === 'live' ? 'active' : ''} onClick={() => setMode('live')}>Live mock</button><button className={mode === 'fallback' ? 'active fallback' : ''} onClick={() => setMode('fallback')}>Fallback</button></div>
      </section>

      <main className="dashboard-grid">
        <section className="panel conversation-panel">
          <div className="section-heading"><div><p className="eyebrow">LIVE SCENARIO</p><h2>{scenario.title}</h2></div><StatusBadge tone={statusTone}>{displayRun.status}</StatusBadge></div>
          <div className="scenario-prompt"><span>REQUEST</span><p>{scenario.prompt}</p></div>
          <div className="conversation">
            <div className="message user-message"><div className="avatar user-avatar">U</div><div><div className="message-meta">USER <time>09:15</time></div><p>{turn.user}</p></div></div>
            <div className="message assistant-message"><div className="avatar assistant-avatar">✦</div><div><div className="message-meta">AGENT <time>{mode === 'fallback' ? 'snapshot' : '09:15'}</time></div><p>{turn.assistant_text}</p><div className="answer-chip"><span>✓</span>{toolCount} tool calls · {turn.rounds.length} rounds · transcript saved</div></div></div>
          </div>
          <form className="composer" onSubmit={submitPrompt}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Thử một yêu cầu research khác..." aria-label="Research prompt" /><button type="submit">Queue prompt <span>↗</span></button></form>
          {notice && <p className="notice">{notice}</p>}
          <div className="scenario-actions"><button className="primary-button" onClick={runScenario} disabled={running}>{running ? 'Running scenario…' : '▶  Run main scenario'}</button><span>{mode === 'fallback' ? fallbackEvidence.fallbackReason : 'Evidence preview · no external request from this UI'}</span></div>
        </section>

        <aside className="evidence-column">
          <section className="panel summary-panel"><div className="section-heading"><div><p className="eyebrow">RUN SUMMARY</p><h2>Evidence snapshot</h2></div><span className="source-label">{evidence.source}</span></div><div className="metric-grid"><Metric label="Case accuracy" value={`${Math.round(selectedMetrics.accuracy * 100)}%`} tone="blue" /><Metric label="Tool routing" value={`${Math.round(selectedMetrics.routing * 100)}%`} tone="purple" /><Metric label="Argument accuracy" value={`${Math.round(selectedMetrics.args * 100)}%`} tone="green" /><Metric label="Tool events" value={toolCount} tone="orange" /></div></section>
          <section className="panel artifact-panel"><div className="section-heading"><div><p className="eyebrow">ARTIFACT IDENTITY</p><h2>Version is visible</h2></div><span className="hash-icon">#</span></div><div className="artifact-version">{displayRun.artifact_version}</div>{displayRun.error && <div className="error-strip"><strong>{displayRun.error.code}</strong><span>{displayRun.error.message}</span></div>}<div className="hash-list"><div><span>prompt hash</span><code>{displayRun.prompt_hash}</code></div><div><span>tools hash</span><code>{displayRun.tools_hash}</code></div><div><span>provider</span><code>{displayRun.provider}</code></div><div><span>generated</span><code>{displayRun.generated_at}</code></div></div></section>
          <section className="panel files-panel"><div className="section-heading"><div><p className="eyebrow">SAVED EVIDENCE</p><h2>Files to hand off</h2></div></div><div className="file-list"><div className="file-row"><span className="file-icon">{'{ }'}</span><div><strong>Run JSON</strong><small>{displayRun.files.run}</small></div><span className="file-status">ready</span></div><div className="file-row"><span className="file-icon">≡</span><div><strong>Transcript JSON</strong><small>{displayRun.files.transcript}</small></div><span className="file-status">ready</span></div><div className="file-row"><span className="file-icon">▤</span><div><strong>Version log</strong><small>{displayRun.files.versionLog}</small></div><span className="file-status">ready</span></div></div></section>
        </aside>
      </main>

      <section className="panel trace-panel"><div className="section-heading trace-section-heading"><div><p className="eyebrow">OBSERVABILITY</p><h2>Tool trace / result / error</h2></div><div className="trace-summary"><span><i className="legend-dot success-dot" />{toolCount} successful calls</span><span><i className="legend-dot warning-dot" />fallback is selectable</span></div></div><ToolTrace turns={evidence.transcript.turns} /></section>

      <section className="bottom-grid">
        <section className="panel comparison-panel"><div className="section-heading"><div><p className="eyebrow">VERSION COMPARISON</p><h2>Same scenario, visible progress</h2></div></div><div className="comparison-table"><div className="table-row table-head"><span>VERSION</span><span>CASE ACC.</span><span>ROUTING</span><span>ARGS</span><span>CHANGE</span></div>{versionRows.map((row) => <div className={`table-row ${row.version === version ? 'current-row' : ''}`} key={row.version}><span><b>{row.version}</b> {row.label}</span><span>{Math.round(row.accuracy * 100)}%</span><span>{Math.round(row.routing * 100)}%</span><span>{Math.round(row.args * 100)}%</span><span className="delta">{row.delta}</span></div>)}</div></section>
        <section className="panel raw-panel"><div className="section-heading"><div><p className="eyebrow">DEBUG PAYLOAD</p><h2>Contract preview</h2></div></div><details><summary>Open run + transcript JSON</summary><JsonBlock value={payloadPreview} /></details></section>
      </section>

      <footer><span>Research Agent Lab · frontend evidence console</span><span>Mock data is replaceable with the team backend contract.</span></footer>
    </div>
  )
}

export default App
