import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { maintenanceAgent } from '@/lib/maintenance-agent';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack?: string } | null;
  ticketNumber: string | null;
}

export class MaintenanceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      ticketNumber: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }): void {
    const ticketNumber = maintenanceAgent.reportError(
      error,
      errorInfo.componentStack
    );

    this.setState({
      errorInfo,
      ticketNumber,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      ticketNumber: null,
    });
  };

  handleRefresh = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. The issue has been automatically reported.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.ticketNumber && (
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-sm text-muted-foreground">Reference Number</p>
                  <p className="font-mono text-lg font-semibold">{this.state.ticketNumber}</p>
                </div>
              )}
              {this.state.error && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Technical details
                  </summary>
                  <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button onClick={this.handleReset} className="w-full" variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <div className="flex w-full gap-2">
                <Button onClick={this.handleRefresh} variant="outline" className="flex-1">
                  Refresh Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to manually report errors from functional components
 */
export function useErrorHandler() {
  return {
    reportError: (error: Error, context?: { email?: string; userId?: string }) => {
      return maintenanceAgent.reportError(error, undefined, context);
    },
  };
}
