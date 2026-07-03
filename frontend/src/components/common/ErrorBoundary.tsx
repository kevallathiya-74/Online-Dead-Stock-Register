import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Unhandled React component exception caught by ErrorBoundary', error, {
      componentStack: errorInfo.componentStack,
    });
    toast.error('An unexpected UI error occurred');
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-xl font-bold font-display text-slate-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>

          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Try Again
          </button>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-6 max-w-lg w-full overflow-auto">
              <pre className="text-left text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 whitespace-pre-wrap">
                {this.state.error.toString()}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;