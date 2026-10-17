// Temporary seeding endpoints for Phase 1 — public site copy only, no secrets. Remove before cutover.
// GET /_functions/seed         inserts/updates Services and Team rows from seed-data.js (idempotent by `order`)
// GET /_functions/seedStatus   lists rows in both collections
import { ok, serverError } from 'wix-http-functions';
import wixData from 'wix-data';
import { SERVICES, TEAM } from 'backend/seed-data';

const OPTS = { suppressAuth: true, suppressHooks: true };
const json = body => ok({ headers: { 'Content-Type': 'application/json' }, body });

async function upsertAll(collection, rows) {
  const existing = await wixData.query(collection).limit(100).find(OPTS);
  const byOrder = new Map(existing.items.map(i => [i.order, i]));
  const toInsert = [], toUpdate = [];
  for (const r of rows) {
    const cur = byOrder.get(r.order);
    if (cur) toUpdate.push({ ...cur, ...r, _id: cur._id }); else toInsert.push(r);
  }
  const ins = toInsert.length ? await wixData.bulkInsert(collection, toInsert, OPTS) : { inserted: 0, errors: [] };
  const upd = toUpdate.length ? await wixData.bulkUpdate(collection, toUpdate, OPTS) : { updated: 0, errors: [] };
  return { inserted: ins.inserted, updated: upd.updated, errors: [...(ins.errors || []), ...(upd.errors || [])] };
}

export async function get_seed() {
  try {
    return json({ services: await upsertAll('Services', SERVICES), team: await upsertAll('Team', TEAM) });
  } catch (e) {
    return serverError({ body: { error: String(e) } });
  }
}

export async function get_seedStatus() {
  const s = await wixData.query('Services').ascending('order').find(OPTS);
  const t = await wixData.query('Team').ascending('order').find(OPTS);
  return json({
    services: s.items.map(i => [i.order, i.title, Boolean(i.icon)]),
    team: t.items.map(i => [i.order, i.title, i.role, Boolean(i.photo)]),
  });
}

// GET /_functions/uploadUrl?path=/cosmic/icons&mime=image/png&type=image
// Returns a one-file Media Manager upload URL (valid 1 day); the client then PUTs the bytes to it with ?filename=.
import { mediaManager } from 'wix-media-backend';

export async function get_uploadUrl(request) {
  const q = request.query || {};
  const path = q.path || '/cosmic';
  const mime = q.mime || 'image/png';
  const type = q.type || 'image';
  try {
    const { uploadUrl } = await mediaManager.getUploadUrl(path, {
      mediaOptions: { mimeType: mime, mediaType: type },
      metadataOptions: { isPrivate: false, isVisitorUpload: false },
    });
    return json({ uploadUrl });
  } catch (e) {
    return serverError({ body: { error: String(e) } });
  }
}
