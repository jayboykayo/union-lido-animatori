import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <p className="text-4xl mb-4">😵</p>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Qualcosa è andato storto</h2>
          <p className="text-gray-400 text-sm mb-6">Prova a ricaricare la pagina</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
            className="btn-primary px-6"
          >
            Ricarica
          </button>
        </div>
      )
    }
    return this.props.children
  }
}