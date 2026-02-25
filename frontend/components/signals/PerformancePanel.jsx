/**
 * PerformancePanel.jsx
 * Displays win rate, average R:R, drawdown, and total signals.
 */
'use client';

export default function PerformancePanel({ data }) {
  if (!data) return <div className="text-[#4a5568] text-sm">No performance data yet.</div>;

  const { totalSignals, wins, losses, winRate, avgResult, maxDrawdown } = data;

  const metrics = [
    { label: 'Win Rate',     value: `${winRate}%`,     color: winRate >= 50 ? '#00ff88' : '#f87171', desc: `${wins}W / ${losses}L` },
    { label: 'Total Signals', value: totalSignals,      color: '#94a3b8', desc: 'All time' },
    { label: 'Avg Result',   value: `${avgResult > 0 ? '+' : ''}${avgResult}%`, color: avgResult >= 0 ? '#60a5fa' : '#f87171', desc: 'Closed trades' },
    { label: 'Max Drawdown', value: `${maxDrawdown}%`,  color: '#f87171', desc: 'Peak to trough' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metrics.map(m => (
          <div key={m.label} className="bg-[#0d1117] border border-[#1e2530] rounded p-4">
            <div className="text-[10px] text-[#4a5568] uppercase tracking-wider mb-2">{m.label}</div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[10px] text-[#2d3748] mt-1">{m.desc}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#0d1117] border border-[#1e2530] rounded p-4">
        <div className="text-xs text-[#4a5568] uppercase tracking-wider mb-3">Signal Transparency</div>
        <p className="text-xs text-[#4a5568] leading-relaxed">
          All signals are logged on generation and cannot be deleted. Closed trades remain permanently visible.
          Performance metrics are computed from real signal outcomes only — no cherry-picking.
        </p>
      </div>
    </div>
  );
}
