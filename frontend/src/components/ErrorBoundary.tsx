import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Error en la aplicación</h2>
          <p style={{ color: '#374151', marginBottom: '1rem' }}>
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
          <details style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#4b5563' }}>Detalles del error</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', color: '#991b1b', marginTop: '0.5rem' }}>
              {this.state.error?.toString()}
            </pre>
            {this.state.errorInfo && (
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
