// GET    /api/events?c=ID                      -> { events }
// POST   /api/events {c, events:[...]}         -> { events }   (one or many, e.g. a repeating class)
// PATCH  /api/events {c, id, fields}
// DELETE /api/events {c, id} | {c, seriesId}
import { send, body, query, store, requireCalendar, toClientEvent, isDate, isTime, WHO, clip } from './_lib.js';

function clean(e, partial) {
  const f = {};
  if (e.date !== undefined) { if (!isDate(e.date)) return null; f.date = e.date; }
  if (e.start !== undefined) { if (!isTime(e.start)) return null; f.start_time = e.start; }
  if (e.end !== undefined) { if (!isTime(e.end)) return null; f.end_time = e.end; }
  if (e.title !== undefined) { const t = clip(e.title, 60).trim(); if (!t) return null; f.title = t; }
  if (e.who !== undefined) { if (!WHO.includes(e.who)) return null; f.who = e.who; }
  if (e.kind !== undefined) f.kind = e.kind === 'point' ? 'point' : 'range';
  if (!partial) {
    if (!f.date || !f.start_time || !f.title) return null;
    f.who = f.who || 'a'; f.kind = f.kind || 'range';
    if (!f.end_time || f.kind === 'point') f.end_time = f.kind === 'point' ? f.start_time : f.end_time;
    if (e.seriesId) f.series_id = clip(e.seriesId, 40);
    if (e.by) f.created_by = clip(e.by, 4);
  }
  return f;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const cal = await requireCalendar(res, query(req).c); if (!cal) return;
      const rows = await store.listEvents(cal.id);
      return send(res, 200, { events: rows.map(toClientEvent) });
    }
    const b = body(req);
    const cal = await requireCalendar(res, b.c); if (!cal) return;
    if (req.method === 'POST') {
      const list = (Array.isArray(b.events) ? b.events : [b.event]).slice(0, 200);
      const rows = [];
      for (const e of list) { const f = e && clean(e, false); if (!f) return send(res, 400, { error: 'bad event' }); rows.push({ ...f, calendar_id: cal.id }); }
      const out = await store.insertEvents(rows);
      return send(res, 200, { events: out.map(toClientEvent) });
    }
    if (req.method === 'PATCH') {
      const f = clean(b.fields || {}, true);
      if (!f || !b.id) return send(res, 400, { error: 'bad update' });
      if (f.kind === 'point' && f.start_time) f.end_time = f.start_time;
      await store.updateEvent(cal.id, String(b.id), f);
      return send(res, 200, { ok: true });
    }
    if (req.method === 'DELETE') {
      if (b.seriesId) await store.deleteSeries(cal.id, String(b.seriesId));
      else if (b.id) await store.deleteEvent(cal.id, String(b.id));
      else return send(res, 400, { error: 'missing id' });
      return send(res, 200, { ok: true });
    }
    send(res, 405, { error: 'method not allowed' });
  } catch (e) { send(res, 500, { error: String(e.message || e) }); }
}
