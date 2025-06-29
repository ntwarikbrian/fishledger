import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary Component
 * 
 * A React error boundary component that catches JavaScript errors anywhere
 * in the child component tree and displays a fallback UI.
 * 
 * Features:
 * - Catches and handles React component errors
 * - Displays user-friendly error messages
 * - Provides retry functionality
 * - Logs errors for debugging
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In a real application, you might want to log this to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    // Reset the error state to retry rendering
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-300">
              An error occurred while loading this report. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-md">
                <div className="text-sm font-mono text-red-800 dark:text-red-200">
                  {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                      Stack trace
                    </summary>
                    <pre className="text-xs text-red-700 dark:text-red-300 mt-1 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
