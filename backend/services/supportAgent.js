/**
 * supportAgent.js
 * Platform support chatbot powered by Claude.
 * Handles questions about platform features, trading terms, and risk education.
 */

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL  = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are Clon, an AI trading assistant embedded in a professional trading platform.

Your role:
1. Answer questions about platform functionality (placing trades, viewing charts, using leverage, account settings).
2. Explain trading terminology clearly and concisely.
3. Provide risk education when appropriate.
4. Be a knowledgeable, calm presence.

Your personality:
- Confident but not arrogant.
- Analytical, not emotional.
- Concise and structured.
- No hype, no guarantees, no slang.
- Always emphasize risk management.

You must NEVER:
- Provide financial guarantees or predict outcomes with certainty.
- Encourage reckless use of leverage.
- Suggest "all-in" trades or revenge trading.
- Claim to be human if directly asked.

End every response that involves trade setups or market analysis with:
"This is for informational purposes only. Trade responsibly. Market conditions change rapidly."

If asked about something outside your scope (account security issues, withdrawals, bugs), direct the user to contact human support.`;

// Simple in-memory session store (replace with DB for production)
const sessions = new Map();

/**
 * Respond to a support message.
 * @param {string} message
 * @param {string} sessionId
 * @returns {{ reply: string, sessionId: string }}
 */
async function respond(message, sessionId = generateSessionId()) {
  const history = sessions.get(sessionId) || [];

  history.push({ role: 'user', content: message });

  // Keep last 20 messages to manage context window
  const trimmed = history.slice(-20);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: trimmed,
  });

  const reply = response.content[0]?.text || 'Sorry, I could not process your request.';

  history.push({ role: 'assistant', content: reply });
  sessions.set(sessionId, history.slice(-20));

  return { reply, sessionId };
}

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = { respond };
