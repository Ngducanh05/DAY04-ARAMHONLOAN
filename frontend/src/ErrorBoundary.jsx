import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ResearchAgentUI] render failed', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fatal-error" role="alert">
          <div className="fatal-error-card">
            <p className="eyebrow">UI RUNTIME ERROR</p>
            <h1>Giao diện gặp lỗi khi render</h1>
            <p>{this.state.error.message}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Reload application
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
