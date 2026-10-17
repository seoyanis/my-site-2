// masterPage wiring (all pages). Imported by pages/masterPage.js with one line:
//   $w.onReady(() => initMaster($w, { wixWindowFrontend }))
// No Wix imports here.

import { IDS, CLASSES } from './ids.js'
import { el, makeLog, addClasses } from './guard.js'

export function initMaster($w, { wixWindowFrontend } = {}) {
  const log = makeLog($w)
  const { wire } = log
  const H = IDS.header, F = IDS.footer

  wire(F.backToTop, e => {
    addClasses(e, CLASSES.backToTop)
    e.onClick(() => {
      try { wixWindowFrontend.scrollTo(0, 0, { scrollAnimation: true }) } catch (_) {}
    })
  })

  wire(H.menuLabel, e => {
    addClasses(e, CLASSES.ui)
    e.onClick(() => {
      try {
        const menu = el($w, H.menuContainer)
        if (menu && typeof menu.open === 'function') menu.open()
      } catch (_) {}
    })
  })

  for (const id of [H.pitchDeck, H.letsTalk, H.menuContainer]) wire(id, e => addClasses(e, CLASSES.ui))
  for (const id of [F.mailErik, F.mailInfo]) wire(id, e => addClasses(e, CLASSES.mail))

  return log
}
