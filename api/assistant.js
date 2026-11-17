// POST /api/assistant {c, text, me, today, time}  -> { reply, actions }
// The prompt is built here on the server, so the API key can only be used for this calendar's assistant.
import { send, body, store, requireCalendar, toClientEvent, toClientMsg, isDate, isTime, clip,
  pickProvider, callModel, parseModelJson, buildPrompt } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const p = pickProvider(req.headers['x-vercel-ip-country']);
    return send(res, 200, { available: !!p });
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });
  try {
    const b = body(req);
    const cal = await requireCalendar(res, b.c); if (!cal) return;
    const text = clip(b.text, 500).trim();
    if (!text || !['a', 'b'].includes(b.me) || !isDate(b.today) || !isTime(b.time)) return send(res, 400, { error: 'bad request' });

    const provider = pickProvider(req.headers['x-vercel-ip-country']);
    if (!provider) return send(res, 200, { reply: '小助手在你这里暂时用不了～可以点日历空白处或右下角 + 手动添加。', actions: [], unavailable: true });

    const limit = Number(process.env.DAILY_AI_LIMIT || 60);
    const used = await store.bumpUsage(cal.id, b.today);
    if (used > limit) return send(res, 200, { reply: `今天已经问了 ${limit} 次啦，明天再来找我吧～现在可以先手动添加。`, actions: [], limited: true });

    const [evRows, msgRows] = await Promise.all([store.listEvents(cal.id), store.listMessages(cal.id, 9)]);
    const prompt = buildPrompt({
      text, me: b.me, today: b.today, time: b.time,
      names: { a: cal.name_a, b: cal.name_b },
      events: evRows.map(toClientEvent), messages: msgRows.map(toClientMsg),
    });
    const out = parseModelJson(await callModel(provider, prompt));
    send(res, 200, out);
  } catch (e) {
    send(res, 200, { reply: '小助手出了点小问题，等一下再试试？', actions: [], error: String(e.message || e) });
  }
}
