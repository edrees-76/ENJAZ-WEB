import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-8">
          <div className="glass-card p-10 rounded-3xl border-2 border-red-300 dark:border-red-500/30 shadow-2xl max-w-lg w-full text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              حدث خطأ غير متوقع
            </h2>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
              حدث خطأ أثناء تحميل هذا القسم. يرجى المحاولة مرة أخرى.
            </p>
            <details className="text-left bg-slate-100 dark:bg-white/5 p-4 rounded-xl text-xs font-mono text-red-600 dark:text-red-400 max-h-32 overflow-auto">
              <summary className="cursor-pointer font-bold mb-2">تفاصيل الخطأ</summary>
              {this.state.error?.message}
              <br />
              {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
            </details>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-3 mx-auto active:scale-95"
            >
              <RefreshCw className="w-5 h-5" />
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
