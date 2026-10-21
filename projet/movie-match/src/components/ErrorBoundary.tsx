import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Movie Match', error, info.componentStack);
  }
  render() {
    if (this.state.failed)
      return (
        <div className="empty-state" role="alert">
          <p>Une erreur est survenue.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Recharger l’application
          </button>
        </div>
      );
    return this.props.children;
  }
}
