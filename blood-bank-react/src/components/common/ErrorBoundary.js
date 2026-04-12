/**
 * ============================================
 * ERROR BOUNDARY COMPONENT
 * ============================================
 * Catches component errors and prevents white screen crashes
 * Displays fallback UI when errors occur
 */

import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by Error Boundary:', error);
    console.error('Error Info:', errorInfo);

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Send to error tracking service in production
    // Example: Sentry.captureException(error);
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service
      console.log('Sending error to monitoring service...');
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1>Oops! Something went wrong</h1>
            <p className="error-message">
              {this.state.error && this.state.error.toString()}
            </p>

            {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
              <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
                <summary>Error Details (Development Only)</summary>
                {this.state.errorInfo.componentStack}
              </details>
            )}

            <div className="error-actions">
              <button
                className="error-button primary"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <button
                className="error-button secondary"
                onClick={() => (window.location.href = '/')}
              >
                Go Home
              </button>
            </div>

            {this.state.errorCount > 3 && (
              <p className="error-warning">
                Multiple errors detected. Please refresh the page.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
