
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center border border-gray-200 dark:border-slate-700">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Une erreur est survenue
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Nous sommes désolés, mais l'application a rencontré une erreur inattendue.
            </p>
            
            {this.props.showDetails && this.state.error && (
              <div className="mb-6 text-left bg-gray-100 dark:bg-slate-900 p-3 rounded text-xs font-mono overflow-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <Button onClick={this.handleReset} className="w-full gap-2">
              <RefreshCcw className="h-4 w-4" />
              Recharger la page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
