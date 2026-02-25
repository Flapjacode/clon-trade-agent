/**
 * SignalCard.jsx
 * Displays a single trade signal with all metadata.
 */
'use client';

const STATUS_COLORS = {
  'Open':        { dot: '#00ff88', text: '#00ff88', bg: '#001a0d' },
  'TP1 Hit':     { dot: '#60a5fa', text: '#60a5fa', bg: '#0a1628' },
  'TP2 Hit':     { dot: '#a78bfa', text: '#a78bfa', bg: '#130a28' },
  'SL Hit':      { dot: '#f87171', text: '#f87171', bg: '#1a0a0a' },
  'Closed':      { dot: '#94a3b8', text: '#94a3b8', bg: '#131820' },
  'Invalidated': { dot: '#4a5568', text: '#4a5568', bg: '#0d0f14' },
};

export default function SignalCard({ signal }) {
  const {
    asset, direction, entry_low, entry_high, stop_loss,
    target_1, target_2, timeframe, rr_ratio, status,
    reasoning, disclaimer, created_at,
  } = signal;

  const isLong  = direction === 'Long';
  const colors  = STATUS_COLORS[status] || STATUS_COLORS['Open'];
  const dirColor = isLong ? '#00ff88' : '#f87171';

  return (
    <div
      className="rounded border border-[#1e2530] bg-[#0d1117] p-5 flex flex-col gap-4 hover:border-[#2d3748] transition-colors"
      style={{ borderLeftColor: dirColor, borderLeftWidth: 3 }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-white font-bold text-base tracking-wider">{asset}</div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ color: dirColor, backgroundColor: isLong ? '#001a0d' : '#1a0505' }}
            >
              ▲ {direction.toUpperCase()}
            </span>
            <span className="text-xs text-[#4a5568]">{timeframe}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div
            className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded"
            style={{ color: colors.text, backgroundColor: colors.bg }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
            {status}
          </div>
          <div className="text-[10px] text-[#4a5568]">
            {new Date(created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} UTC
          </div>
        </div>
      </div>

      {/* ── Levels ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <PriceBox label="Entry Zone" value={`${entry_low} – ${entry_high}`} color="#94a3b8" />
        <PriceBox label="Stop Loss" value={stop_loss} color="#f87171" />
        <PriceBox label="R:R" value={rr_ratio || '—'} color="#60a5fa" />
      </div>

      {/* ── Targets ────────────────────────────────────────── */}
      <div className="flex gap-3">
        {target_1 && <TargetBadge label="TP1" value={target_1} />}
        {target_2 && <TargetBadge label="TP2" value={target_2} />}
      </div>

      {/* ── Reasoning ──────────────────────────────────────── */}
      {reasoning && (
        <div className="text-[11px] text-[#4a5568] border-t border-[#1e2530] pt-3 leading-relaxed">
          {reasoning}
        </div>
      )}

      {/* ── Disclaimer ─────────────────────────────────────── */}
      <div className="text-[10px] text-[#2d3748] italic">
        {disclaimer || 'This analysis is for informational purposes only. Trade responsibly.'}
      </div>
    </div>
  );
}

function PriceBox({ label, value, color }) {
  return (
    <div className="bg-[#0a0c10] rounded p-2">
      <div className="text-[10px] text-[#4a5568] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xs font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function TargetBadge({ label, value }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#0a1628] border border-[#1e3a5f] rounded px-2 py-1 text-xs">
      <span className="text-[#4a5568]">{label}</span>
      <span className="text-[#60a5fa] font-bold">{value}</span>
    </div>
  );
}
