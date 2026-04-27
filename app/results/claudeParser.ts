// ============================================================================
// claudeParser.ts
// Normalises Claude.ai conversation exports into the same RawMessage[]
// format that deepParser.ts expects - so they can be merged and re-analysed.
//
// Claude export format (conversations.json):
// [
//   {
//     "uuid": "...",
//     "name": "Conversation title",
//     "created_at": "2024-01-15T10:23:00.000000+00:00",
//     "updated_at": "...",
//     "chat_messages": [
//       {
//         "uuid": "...",
//         "text": "message content",
//         "sender": "human" | "assistant",
//         "created_at": "2024-01-15T10:23:01.000000+00:00",
//         "attachments": [],
//         "files": []
//       }
//     ]
//   }
// ]
// ============================================================================

import type { RawMessage } from './deepParser';

export function isClaudeExport(data: any): boolean {
  if (!Array.isArray(data) || data.length === 0) return false;
  const first = data[0];
  // Claude exports have chat_messages arrays; ChatGPT has mapping objects
  return Array.isArray(first?.chat_messages) && !first?.mapping;
}

export function extractClaudeMessages(rawJson: any[]): RawMessage[] {
  const messages: RawMessage[] = [];

  for (const convo of rawJson) {
    if (!Array.isArray(convo.chat_messages)) continue;
    const title = convo.name || 'Untitled';
    const conversationId = convo.uuid || '';

    for (const msg of convo.chat_messages) {
      // Only human messages - same as ChatGPT parser only taking 'user' role
      if (msg.sender !== 'human') continue;

      const text = typeof msg.text === 'string' ? msg.text.trim() : '';
      if (!text || text.length < 3) continue;

      // Parse ISO timestamp to unix seconds
      const ts = msg.created_at ? new Date(msg.created_at).getTime() / 1000 : null;
      if (!ts || isNaN(ts)) continue;

      messages.push({
        text,
        timestamp: ts,
        conversationTitle: title,
        conversationId,
      });
    }
  }

  return messages.sort((a, b) => a.timestamp - b.timestamp);
}

// Normalise Claude export into the ChatGPT mapping format so analyzeDeep
// can consume it directly without changes.
export function normaliseClaude(rawJson: any[]): any[] {
  // Convert each Claude conversation into a fake ChatGPT conversation object
  return rawJson.map(convo => {
    if (!Array.isArray(convo.chat_messages)) return null;
    const mapping: Record<string, any> = {};

    convo.chat_messages.forEach((msg: any, i: number) => {
      const nodeId = msg.uuid || `node-${i}`;
      const ts = msg.created_at ? new Date(msg.created_at).getTime() / 1000 : null;
      const text = typeof msg.text === 'string' ? msg.text.trim() : '';

      mapping[nodeId] = {
        message: {
          author: { role: msg.sender === 'human' ? 'user' : 'assistant' },
          content: {
            content_type: 'text',
            parts: [text],
          },
          create_time: ts,
        },
      };
    });

    return {
      conversation_id: convo.uuid || '',
      id: convo.uuid || '',
      title: convo.name || 'Untitled',
      mapping,
    };
  }).filter(Boolean);
}
