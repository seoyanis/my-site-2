// Velo element ids and custom classes used by the Cosmic page code.
// These are the ids the Wix Studio editor actually carries (Layers panel, Properties > ID).
// One edit here follows a rename in the editor. No Wix imports: vitest loads this module directly.

export const IDS = {
  header: {
    section: '#section3',
    menuBtn: '#menu1',
    menuLabel: '#text6',         // "Menu" text (opens the menu container)
    pitchDeck: '#text4',         // "PITCH DECK" link
    letsTalk: '#text5',          // "Let’s talk" mailto link
    menuContainer: '#menuContainer', // not built yet (Task 8 step 3)
  },
  hero: {
    section: '#secHome',
    logo: '#imageX1',            // logo.png in the hero
    scrollCue: '#text7',         // "Scroll" cue
    ce: '#heroCe',               // Plan 2 — not present yet
    native: '#heroNative',       // Plan 2 — not present yet
  },
  studio: {
    section: '#secStudio',
    label: '#text8',
    title: '#text9',
    paragraphs: ['#text10', '#text11'],
  },
  mission: {
    section: '#secMission',
    label: '#text12',
    title: '#text13',
    paragraphs: ['#text14', '#text15'],
  },
  services: {
    section: '#secServices',
    label: '#text16',
    title: '#text17',
    repeater: '#repeater1',      // services repeater (dataset "servicesData")
    dataset: '#servicesData',
    item: '#box1',               // repeater item container
    number: '#text20',           // card number (order), shown as 0n by code
    icon: '#svcIcon',            // not built yet: no image in the card
    itemTitle: '#text18',
    itemDesc: '#text19',
    ce: '#servicesCe',           // Plan 2 — not present yet
  },
  team: {
    section: '#secTeam',
    label: '#text21',
    title: '#text22',
    paragraphs: ['#text25', '#text26'],
    repeater: '#repeater2',      // team repeater (dataset "teamData")
    dataset: '#teamData',
    item: '#box2',               // repeater item container (planet item)
    disc: '#imageX2',            // circular portrait (planet disc)
    name: '#text23',
    role: '#text24',
  },
  space: {
    ce: '#spaceCe',              // Plan 2 — not present yet
  },
  footer: {
    section: '#secContact',
    logo: '#footerLogo',
    mailErik: '#mailErik',
    mailInfo: '#mailInfo',
    addresses: ['#addr1', '#addr2', '#addr3'],
    backToTop: '#backToTop',
  },
  lightbox: {
    name: 'MemberBio',           // openLightbox name, not an element id
    number: '#popNumber',
    photo: '#popPhoto',
    title: '#popName',           // the member name (CMS field `title`)
    role: '#popRole',
    bio: '#popBio',
    close: '#popClose',
  },
}

export const CLASSES = {
  title: 'title',
  label: 'label',
  text: 'kc-text',
  ui: 'kc-ui',
  mail: 'mail',
  cluster: 'kc-cluster',
  planetItem: 'planet-item',
  planetDisc: 'planet-disc',
  svcItem: 'svc-item',
  svcIcon: 'svc-icon',
  backToTop: 'back-to-top',
  reveal: 'reveal',            // hidden until the element enters the viewport
  revealed: 'is-in',           // added by page code when the element is in view
  hero: 'hero-logo',           // plays a fade-up on load
}

export const WARMUP_SERVICES_KEY = 'services'
