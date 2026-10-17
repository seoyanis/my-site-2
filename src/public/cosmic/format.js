// Pure helpers shared by the Home page code, the MemberBio lightbox and the
// masterPage. No Wix imports here: vitest loads this module directly.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch => ESCAPES[ch])
}

export function padNumber(n) {
  return String(n ?? '').padStart(2, '0')
}

export function buildSeoMarkup(items) {
  const lis = (items || []).map(it => {
    const { title = '', description = '' } = it || {}
    return `<li><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></li>`
  })
  return `<ul>${lis.join('')}</ul>`
}

export function planetClass(order) {
  return 'planet-' + Number(order)
}

export function memberContext(data, index) {
  const d = data || {}
  return {
    number: padNumber(index + 1),
    photo: d.photo ?? '',
    name: d.title ?? '',
    role: d.role ?? '',
    bio: d.bio ?? '',
  }
}
