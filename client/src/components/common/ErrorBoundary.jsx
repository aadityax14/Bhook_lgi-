import React from 'react';

/*
 * If any screen crashes while drawing, show a friendly recovery screen
 * instead of a blank white page. "Fix & reload" clears saved data that
 * can break the app after an update (old cart / tracked order) but
 * keeps the person signed in.
 */

const RESETTABLE_KEYS = ['bhook_cart', 'bhook_active_order_id'];

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Screen crashed:', error, info?.componentStack);
  }

  reload = () => {
    window.location.reload();
  };

  resetAndReload = () => {
    try {
      RESETTABLE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Storage blocked: a plain reload is all we can do.
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-[#fffdf5] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 p-6 text-center">
          <div className="text-5xl mb-3">😵‍💫</div>
          <h1 className="text-xl font-black text-gray-900">
            {this.props.title || 'Oops, this screen had a problem'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Don't worry, your orders are safe. Tap below to load it again.
          </p>

          <button
            type="button"
            onClick={this.reload}
            className="mt-5 w-full rounded-xl bg-[#FFB800] py-3 font-black text-black"
          >
            Reload
          </button>

          <button
            type="button"
            onClick={this.resetAndReload}
            className="mt-2 w-full rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700"
          >
            Still broken? Fix & reload
          </button>

          <p className="mt-4 text-[11px] text-gray-400 break-words">
            {String(this.state.error?.message || this.state.error).slice(0, 160)}
          </p>
        </div>
      </div>
    );
  }
}
