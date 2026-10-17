// MemberBio lightbox wiring. The lightbox page file (created by Wix later)
// imports this with one line:
//   import wixWindowFrontend from 'wix-window-frontend'
//   import { memberBioOnReady } from 'public/cosmic/lightbox.js'
//   $w.onReady(() => memberBioOnReady($w, wixWindowFrontend))
// No Wix imports here.

import { IDS } from './ids.js'
import { makeLog } from './guard.js'

const str = (v) => (v === undefined || v === null ? '' : String(v))

/** Fills the popup from the context passed to openLightbox (missing fields → ''). */
export function fillMemberBio($w, ctx) {
  const c = ctx || {}
  const L = IDS.lightbox
  const log = makeLog($w)
  log.wire(L.number, e => { e.text = str(c.number) })
  log.wire(L.photo, e => { e.src = str(c.photo) })
  log.wire(L.title, e => { e.text = str(c.name) })
  log.wire(L.role, e => { e.text = str(c.role) })
  log.wire(L.bio, e => { e.html = str(c.bio) })
  return log
}

export function memberBioOnReady($w, wixWindowFrontend) {
  let ctx
  try { ctx = wixWindowFrontend.lightbox.getContext() } catch (_) { ctx = undefined }
  return fillMemberBio($w, ctx)
}
