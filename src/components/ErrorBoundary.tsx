import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Copy, Check, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Enterprise ErrorBoundary intercepted failure:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleCopyDiagnostic = () => {
    const diagnostic = `MADURA HOUSE PLATFORM DIAGNOSTIC:
Error: ${this.state.error?.message || 'Unknown'}
Stack: ${this.state.error?.stack || 'No stack'}
Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}`;

    navigator.clipboard.writeText(diagnostic);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    localStorage.removeItem('madura_records');
    localStorage.removeItem('madura_users');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#212529] text-white flex items-center justify-center p-6 select-text">
          <div className="max-w-xl w-full bg-[#2a2f34] border border-red-500/30 rounded-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Application Resilience Alert
                </h1>
                <p className="text-xs text-slate-400">
                  Madura House Maintenance Platform encountered an isolated runtime exception.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-black/40 border border-white/10 font-mono text-xs space-y-2 overflow-x-auto max-h-48 text-red-200">
              <div className="font-bold text-red-400">
                {this.state.error?.name || 'Error'}: {this.state.error?.message}
              </div>
              {this.state.errorInfo && (
                <div className="text-[10px] text-slate-400 leading-tight">
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={this.handleCopyDiagnostic}
                className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Copied Diagnostic
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Telemetry
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={this.handleResetCache}
                  className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset Local State
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2 rounded-lg bg-[#0ab39c] hover:bg-[#089380] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Reload Platform
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
