// Shared guards for the page code: one missing element never breaks the rest.
// No Wix imports here.

/** Returns the element for `id`, or null when $w throws, returns nothing or an empty selection. */
export function el($w, id) {
  try {
    const e = $w(id)
    if (e === undefined || e === null) return null
    if (typeof e.length === 'number' && e.length === 0) return null
    return e
  } catch (_) {
    return null
  }
}

/** Creates a log, plus `wire(id, fn)` which runs fn(element) inside try/catch and records the result. */
export function makeLog($w) {
  const log = { wired: [], skipped: [] }
  log.wire = (id, fn, label = id) => {
    const e = el($w, id)
    if (!e) { log.skipped.push(label); return null }
    try {
      fn(e)
      log.wired.push(label)
      return e
    } catch (_) {
      log.skipped.push(label)
      return null
    }
  }
  return log
}

export function addClasses(e, ...classes) {
  if (e && e.customClassList && typeof e.customClassList.add === 'function') {
    for (const c of classes) e.customClassList.add(c)
  }
}
