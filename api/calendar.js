// GET  /api/calendar?c=ID            -> { calendar }
// POST /api/calendar {nameA, nameB}  -> { id }            (create a new calendar)
// PATCH /api/calendar {c, nameA, nameB, initA?, initB?}    (rename; init = the one character shown under each day, '' = default)
import { send, body, query, store, newCalId, requireCalendar, clip, siteUrl } from './_lib.js';

const shape = c => ({ id: c.id, nameA: c.name_a, nameB: c.name_b, initA: c.initial_a || '', initB: c.initial_b || '' });
const oneChar = v => String(v ?? '').trim().slice(0, 16);   // client sends a single character (an emoji can be several code units)

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const cal = await requireCalendar(res, query(req).c); if (!cal) return;
      return send(res, 200, { calendar: shape(cal), siteUrl: siteUrl() });
    }
    if (req.method === 'POST') {
      const b = body(req);
      const nameA = clip(b.nameA, 12).trim() || '她', nameB = clip(b.nameB, 12).trim() || '他';
      const cal = await store.createCalendar({ id: newCalId(), name_a: nameA, name_b: nameB });
      return send(res, 200, { id: cal.id, calendar: shape(cal) });
    }
    if (req.method === 'PATCH') {
      const b = body(req);
      const cal = await requireCalendar(res, b.c); if (!cal) return;
      const f = {};
      if (b.nameA) f.name_a = clip(b.nameA, 12).trim();
      if (b.nameB) f.name_b = clip(b.nameB, 12).trim();
      const g = {};
      if (b.initA !== undefined) g.initial_a = oneChar(b.initA) || null;
      if (b.initB !== undefined) g.initial_b = oneChar(b.initB) || null;
      if (Object.keys(f).length) await store.updateCalendar(cal.id, f);
      let initialsSaved = true;
      if (Object.keys(g).length) {
        try { await store.updateCalendar(cal.id, g); }
        catch (e) { initialsSaved = false; }                 // database not upgraded yet (see supabase/schema.sql)
      }
      return send(res, 200, { ok: true, initialsSaved });
    }
    send(res, 405, { error: 'method not allowed' });
  } catch (e) { send(res, 500, { error: String(e.message || e) }); }
}
