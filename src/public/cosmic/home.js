// Home page wiring. Imported by pages/Home.c1dmp.js with one line:
//   $w.onReady(() => initHome($w, { wixWindowFrontend, wixData }))
// No Wix imports here: the page file passes them in, so vitest loads this module.

import { IDS, CLASSES, WARMUP_SERVICES_KEY } from './ids.js'
import { padNumber, buildSeoMarkup, planetClass, memberContext } from './format.js'
import { el, makeLog, addClasses } from './guard.js'

/**
 * Scroll reveal. The element starts hidden (.reveal) and gains .is-in when Wix reports it
 * in the viewport. Where onViewportEnter is missing, the element is shown at once so no
 * content stays hidden.
 */
export function whenInView(e, classes) {
  if (typeof e.onViewportEnter === 'function') e.onViewportEnter(() => addClasses(e, ...classes))
  else addClasses(e, ...classes)
}

export function revealOn(e, ...extra) {
  if (!e) return
  addClasses(e, CLASSES.reveal, ...extra)
  whenInView(e, [CLASSES.revealed])
}

/**
 * Wires the Home page. Returns { wired, skipped, done } — `done` resolves once
 * the (guarded, async) servicesCe SEO block has finished.
 */
export function initHome($w, { wixWindowFrontend, wixData } = {}) {
  const log = makeLog($w)
  const { wire } = log
  const S = IDS.studio, M = IDS.mission, V = IDS.services, T = IDS.team, H = IDS.header

  // 1. Static classes and scroll reveals on titles, labels and paragraphs.
  for (const id of [S.title, M.title, V.title, T.title]) {
    wire(id, e => { addClasses(e, CLASSES.title); revealOn(e) })
  }
  for (const id of [S.label, M.label, V.label, T.label, IDS.hero.scrollCue]) {
    wire(id, e => { addClasses(e, CLASSES.label); revealOn(e) })
  }
  for (const id of [...S.paragraphs, ...M.paragraphs, ...T.paragraphs]) {
    wire(id, e => { addClasses(e, CLASSES.text); revealOn(e, 'reveal-d1') })
  }
  for (const id of [H.pitchDeck, H.letsTalk, H.menuLabel, H.menuContainer]) {
    wire(id, e => addClasses(e, CLASSES.ui))
  }
  wire(IDS.hero.logo, e => addClasses(e, CLASSES.hero), IDS.hero.logo + ':hero')
  wire(T.repeater, e => addClasses(e, CLASSES.cluster), T.repeater + ':class')

  // 2. Services repeater: "0n" numbers, icon from the CMS URL, card reveal with a stagger.
  wire(V.repeater, rep => rep.onItemReady(($item, data, index) => {
    const d = data || {}
    try { const n = el($item, V.number); if (n) n.text = padNumber(d.order) } catch (_) {}
    try { const i = el($item, V.icon); if (i && d.icon) i.src = d.icon } catch (_) {}
    try {
      const item = el($item, V.item)
      addClasses(item, CLASSES.svcItem)
      revealOn(item, 'reveal-d' + ((Number(index) || 0) % 3 + 1))
    } catch (_) {}
    try { addClasses(el($item, V.icon), CLASSES.svcIcon) } catch (_) {}
  }))

  // 3. Team repeater: planet classes, portrait fade-in, name and role reveal, MemberBio lightbox.
  wire(T.repeater, rep => rep.onItemReady(($item, data, index) => {
    const d = data || {}
    try { addClasses(el($item, T.item), CLASSES.planetItem, CLASSES.planetFloat, planetClass(d.order)) } catch (_) {}
    try { revealOn(el($item, T.name), 'reveal-d1') } catch (_) {}
    try { revealOn(el($item, T.role), 'reveal-d2') } catch (_) {}
    try {
      const disc = el($item, T.disc)
      if (!disc) return
      addClasses(disc, CLASSES.planetDisc)
      whenInView(disc, [CLASSES.revealed])
      disc.onClick(() => {
        try {
          const p = wixWindowFrontend.openLightbox(IDS.lightbox.name, memberContext(d, index))
          if (p && typeof p.catch === 'function') p.catch(() => {})
        } catch (_) {}
      })
    } catch (_) {}
  }))

  // 4. Plan 2 stand-in collapse: CE 'stage' → collapse the native element. Inert today.
  wire(IDS.hero.ce, ce => ce.on('stage', () => {
    try { const n = el($w, IDS.hero.native); if (n) n.collapse() } catch (_) {}
  }), IDS.hero.ce + ':stage')
  wire(V.ce, ce => ce.on('stage', () => {
    try { const n = el($w, V.repeater); if (n) n.collapse() } catch (_) {}
  }), V.ce + ':stage')

  // 5. servicesCe SEO markup (plan Task 15 step 2) — only when the CE exists.
  log.done = seoForServicesCe($w, { wixWindowFrontend, wixData }, log).then(() => log)
  return log
}

async function seoForServicesCe($w, { wixWindowFrontend, wixData }, log) {
  const label = IDS.services.ce + ':seo'
  const ce = el($w, IDS.services.ce)
  if (!ce || ce.seoMarkup === undefined) { log.skipped.push(label); return }
  try {
    const warm = wixWindowFrontend && wixWindowFrontend.warmupData
    let items = warm && typeof warm.get === 'function' ? warm.get(WARMUP_SERVICES_KEY) : undefined
    if (!items) {
      const r = await wixData.query('Services').ascending('order').find()
      items = (r && r.items) || []
      const env = wixWindowFrontend && wixWindowFrontend.rendering && wixWindowFrontend.rendering.env
      if (env === 'backend' && warm && typeof warm.set === 'function') warm.set(WARMUP_SERVICES_KEY, items)
    }
    ce.seoMarkup = buildSeoMarkup(items)
    log.wired.push(label)
  } catch (_) {
    log.skipped.push(label)
  }
}
