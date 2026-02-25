/**
 * page.jsx — Main dashboard
 * Displays today's signals, active trades, performance metrics.
 */
'use client';

import { useState, useEffect } from 'react';
import SignalCard from '../components/signals/SignalCard';
import PerformancePanel from '../components/signals/PerformancePanel';
import SupportChat from '../components/support/SupportChat';
import AnalysisPanel from '../components/analysis/AnalysisPanel';
import MentionInput from '../components/analysis/MentionInput';

export default function Dashboard() {
  const [activeTab, setTab] = useState('signals');
  const [signals, setSignals] = useState([]);
  const [performance, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/signals/active').then(r => r.json()),
      fetch('/api/performance').then(r => r.json()),
    ]).then(([sigRes, perfRes]) => {
      setSignals(sigRes.data || []);
      setPerf(perfRes.data || null);
      setLoading(false);
    });
  }, []);

  const tabs = [
    { id: 'signals', label: "Today's Signals" },
    { id: 'analysis', label: 'On-Demand Analysis' },
    { id: 'performance', label: 'Performance' },
    { id: 'support', label: 'Support' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#e2e8f0] font-mono">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-b border-[#1e2530] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
          <span className="text-[#00ff88] text-sm font-bold tracking-widest uppercase">Clon</span>
          <span className="text-[#4a5568] text-xs">AI Trading Agent</span>
        </div>
        <div className="text-xs text-[#4a5568]">
          {new Date().toUTCString().replace(' GMT', ' UTC')}
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <nav className="border-b border-[#1e2530] px-6 flex gap-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-3 text-xs uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-[#00ff88] text-[#00ff88]'
                : 'border-transparent text-[#4a5568] hover:text-[#94a3b8]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Content ────────────────────────────────────────── */}
      <main className="p-6 max-w-6xl mx-auto">

        {activeTab === 'signals' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-lg tracking-wider">
                ACTIVE SIGNALS
                <span className="ml-3 text-xs text-[#4a5568]">({signals.length} open)</span>
              </h1>
              <span className="text-[10px] text-[#4a5568] bg-[#1e2530] px-3 py-1 rounded">
                AUTO-REFRESHES DAILY 08:00 UTC
              </span>
            </div>

            {loading ? (
              <div className="text-center text-[#4a5568] py-20 text-sm">Loading signals...</div>
            ) : signals.length === 0 ? (
              <div className="text-center text-[#4a5568] py-20 text-sm">
                No active signals. Check back after 08:00 UTC.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {signals.map(s => <SignalCard key={s.id} signal={s} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div>
            <h1 className="text-lg tracking-wider mb-2">ON-DEMAND ANALYSIS</h1>
            <p className="text-xs text-[#4a5568] mb-6">
              Type a mention like <code className="text-[#00ff88]">@tradebot should I long BTC?</code>
            </p>
            <MentionInput />
          </div>
        )}

        {activeTab === 'performance' && performance && (
          <div>
            <h1 className="text-lg tracking-wider mb-6">PERFORMANCE TRACKER</h1>
            <PerformancePanel data={performance} />
          </div>
        )}

        {activeTab === 'support' && (
          <div>
            <h1 className="text-lg tracking-wider mb-6">PLATFORM SUPPORT</h1>
            <SupportChat />
          </div>
        )}
      </main>

      {/* ── Disclaimer ─────────────────────────────────────── */}
      <footer className="border-t border-[#1e2530] px-6 py-3 text-center text-[10px] text-[#2d3748]">
        This platform is for informational purposes only. Trade responsibly. Market conditions change rapidly. Not financial advice.
      </footer>
    </div>
  );
}
