/**
 * MentionInput.jsx
 * Input field for @tradebot mentions + displays TA response.
 */
'use client';

import { useState } from 'react';

export default function MentionInput() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/mention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div>
      {/* Input */}
      <div className="flex gap-3 mb-6">
        <input
          className="flex-1 bg-[#0d1117] border border-[#1e2530] rounded px-4 py-3 text-sm text-white placeholder-[#4a5568] font-mono focus:outline-none focus:border-[#00ff88] transition-colors"
          placeholder="@tradebot should I long BTC?"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#00ff88] text-[#0a0c10] px-6 py-3 rounded text-xs font-bold tracking-widest uppercase hover:bg-[#00cc6a] transition-colors disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#1a0505] border border-[#f87171] rounded p-4 text-[#f87171] text-sm mb-4">
          {error}
        </div>
      )}

      {/* Result */}
      {result && result.type === 'analysis' && (
        <AnalysisResult data={result} />
      )}
    </div>
  );
}

function AnalysisResult({ data }) {
  const { asset, currentPrice, overview, bias, setup, riskNote } = data;
  const biasColor = bias === 'Bullish' ? '#00ff88' : bias === 'Bearish' ? '#f87171' : '#f59e0b';

  return (
    <div className="bg-[#0d1117] border border-[#1e2530] rounded p-6 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-white font-bold text-lg tracking-wider">{asset}</div>
          <div className="text-xs text-[#4a5568]">Current Price: <span className="text-white">{currentPrice}</span></div>
        </div>
        <div
          className="text-sm font-bold px-4 py-2 rounded"
          style={{ color: biasColor, backgroundColor: `${biasColor}15`, border: `1px solid ${biasColor}40` }}
        >
          {bias}
        </div>
      </div>

      {/* Overview Lines */}
      <div className="space-y-2 mb-5 border-t border-[#1e2530] pt-4">
        {overview.map((line, i) => (
          <div key={i} className="text-xs text-[#94a3b8] flex gap-2">
            <span className="text-[#2d3748]">›</span>
            {line}
          </div>
        ))}
      </div>

      {/* Setup */}
      {setup && (
        <div className="bg-[#0a0c10] border border-[#1e2530] rounded p-4 mb-4">
          <div className="text-[10px] text-[#4a5568] uppercase tracking-wider mb-3">Potential Setup</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] text-[#4a5568] mb-1">Entry</div>
              <div className="text-xs text-white">{setup.entry}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#4a5568] mb-1">Stop</div>
              <div className="text-xs text-[#f87171]">{setup.stop}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#4a5568] mb-1">Targets</div>
              <div className="text-xs text-[#60a5fa]">{setup.targets.join(' / ')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Notes */}
      <div className="space-y-1">
        {riskNote.map((note, i) => (
          <div key={i} className="text-[10px] text-[#4a5568]">⚠ {note}</div>
        ))}
      </div>
    </div>
  );
}
