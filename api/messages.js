// GET  /api/messages?c=ID                  -> { messages }  (last 80)
// POST /api/messages {c, role, from, text}
import { send, body, query, store, requireCalendar, toClientMsg, clip } from './_lib.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const cal = await requireCalendar(res, query(req).c); if (!cal) return;
      const rows = await store.listMessages(cal.id, 80);
      return send(res, 200, { messages: rows.map(toClientMsg) });
    }
    if (req.method === 'POST') {
      const b = body(req);
      const cal = await requireCalendar(res, b.c); if (!cal) return;
      const text = clip(b.text, 2000).trim();
      if (!text) return send(res, 400, { error: 'empty' });
      const row = await store.insertMessage({
        calendar_id: cal.id, role: b.role === 'agent' ? 'agent' : 'user',
        from_who: ['a', 'b'].includes(b.from) ? b.from : null, text, ts: Date.now(),
      });
      return send(res, 200, { message: toClientMsg(row) });
    }
    send(res, 405, { error: 'method not allowed' });
  } catch (e) { send(res, 500, { error: String(e.message || e) }); }
}
