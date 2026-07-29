const mockToolEvents = [
  {
    round: 1,
    tool: 'lookup',
    args: { query: 'OpenAI research agent evaluation', topic: 'general', timeframe: 'week' },
    status: 'ok',
    summary: '4 items returned',
  },
  {
    round: 1,
    tool: 'format',
    args: { template: 'sections', headline: 'Research digest' },
    status: 'ok',
    summary: 'Digest rendered',
  },
]

const mockRuns = {
  version: 'v3',
  artifact_version: 'v3-9f3a1c2',
  prompt_hash: 'prompt_7c91',
  tools_hash: 'tools_41ad',
  summary: {
    case_accuracy: 0.87,
    tool_routing_accuracy: 0.9,
    argument_accuracy: 0.84,
    multiturn_accuracy: 0.8,
  },
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Day 04 — Research Agent Lab</p>
          <h1>Research Agent Demo UI</h1>
        </div>
        <div className="version-pill">Version {mockRuns.version}</div>
      </header>

      <main className="layout">
        <section className="panel chat-panel">
          <div className="panel-header">
            <h2>Live chat</h2>
            <p>Nhập prompt, xem response và scenario demo.</p>
          </div>

          <div className="chat-list">
            <article className="message user">
              <span className="label">User</span>
              <p>Tóm tắt các bài viết gần đây về AI agent evaluation.</p>
            </article>
            <article className="message assistant">
              <span className="label">Assistant</span>
              <p>Tôi sẽ tìm nguồn, lấy dữ liệu và dựng digest cho bạn.</p>
            </article>
          </div>

          <div className="composer">
            <input placeholder="Nhập yêu cầu nghiên cứu..." />
            <button>Send</button>
          </div>
        </section>

        <aside className="right-column">
          <section className="panel meta-panel">
            <div className="panel-header">
              <h2>Run metadata</h2>
            </div>
            <div className="meta-grid">
              <Metric label="Artifact" value={mockRuns.artifact_version} />
              <Metric label="Prompt hash" value={mockRuns.prompt_hash} />
              <Metric label="Tools hash" value={mockRuns.tools_hash} />
              <Metric label="Case accuracy" value={`${Math.round(mockRuns.summary.case_accuracy * 100)}%`} />
            </div>
          </section>

          <section className="panel metrics-panel">
            <div className="panel-header">
              <h2>Key metrics</h2>
            </div>
            <div className="metric-list">
              <Metric label="Tool routing" value={`${Math.round(mockRuns.summary.tool_routing_accuracy * 100)}%`} />
              <Metric label="Args accuracy" value={`${Math.round(mockRuns.summary.argument_accuracy * 100)}%`} />
              <Metric label="Multi-turn" value={`${Math.round(mockRuns.summary.multiturn_accuracy * 100)}%`} />
            </div>
          </section>

          <section className="panel tools-panel">
            <div className="panel-header">
              <h2>Tool trace</h2>
            </div>
            <div className="trace-list">
              {mockToolEvents.map((event) => (
                <article className="trace-card" key={`${event.round}-${event.tool}`}>
                  <div className="trace-title">
                    <strong>Round {event.round}</strong>
                    <span className={`status ${event.status}`}>{event.status}</span>
                  </div>
                  <p className="tool-name">{event.tool}</p>
                  <pre>{JSON.stringify(event.args, null, 2)}</pre>
                  <p className="trace-summary">{event.summary}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}

export default App

