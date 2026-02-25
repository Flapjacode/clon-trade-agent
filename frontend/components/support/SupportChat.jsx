/**
 * SupportChat.jsx
 * Conversational support interface powered by Clon (Claude backend).
 */
'use client';

import { useState, useRef, useEffect } from 'react';

const WELCOME = {
  role: 'assistant',
  content: "Hello. I'm Clon — your trading platform assistant. I can help you with platform features, trading terminology, and risk education. What do you need?",
};

export default function SupportChat() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(m => [...m, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSessionId(data.data.sessionId);
      setMessages(m => [...m, { role: 'assistant', content: data.data.reply }]);
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="bg-[#0d1117] border border-[#1e2530] rounded flex flex-col" style={{ height: '60vh' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] text-xs leading-relaxed rounded px-4 py-3 ${
                m.role === 'user'
                  ? 'bg-[#1e3a5f] text-[#e2e8f0]'
                  : 'bg-[#0a0c10] border border-[#1e2530] text-[#94a3b8]'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="text-[#00ff88] text-[10px] font-bold tracking-widest mb-2">CLON</div>
              )}
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0a0c10] border border-[#1e2530] rounded px-4 py-3 text-xs text-[#4a5568]">
              <div className="text-[#00ff88] text-[10px] font-bold tracking-widest mb-2">CLON</div>
              <span className="animate-pulse">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#1e2530] p-4 flex gap-3">
        <textarea
          rows={2}
          className="flex-1 bg-[#0a0c10] border border-[#1e2530] rounded px-3 py-2 text-xs text-white placeholder-[#4a5568] font-mono focus:outline-none focus:border-[#00ff88] transition-colors resize-none"
          placeholder="Ask about platform features, trading terms, or risk..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-[#00ff88] text-[#0a0c10] px-5 rounded text-xs font-bold tracking-widest uppercase hover:bg-[#00cc6a] transition-colors disabled:opacity-40 self-end"
        >
          Send
        </button>
      </div>
    </div>
  );
}
