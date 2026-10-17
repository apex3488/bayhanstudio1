import type { ServiceId } from '../content/services';

export interface PageMeta {
  title: string;
  description: string;
}

export interface ServiceCopy {
  name: string;
  /** One line for lists and cards */
  short: string;
  description: string;
  value: string;
  includes: [string, string, string, string];
  cta: string;
}

export interface TextItem {
  title: string;
  text: string;
}

/**
 * Every locale file must satisfy this shape, so a missing translation
 * is a type error at build time rather than an empty string in production.
 */
export interface Dictionary {
  meta: {
    siteName: string;
    home: PageMeta;
    services: PageMeta;
    contact: PageMeta;
    privacy: PageMeta;
    service: Record<ServiceId, PageMeta>;
  };
  a11y: {
    skipToContent: string;
    homeLink: string;
    mainNav: string;
    languageSwitch: string;
    opensInNewTab: string;
    menuOpen: string;
    menuClose: string;
  };
  nav: {
    services: string;
    contact: string;
    privacy: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaTelegram: string;
    scrollHint: string;
  };
  manifesto: {
    label: string;
    text: string;
  };
  services: {
    label: string;
    title: string;
    intro: string;
    more: string;
    items: Record<ServiceId, ServiceCopy>;
  };
  servicePage: {
    label: string;
    includesHeading: string;
    valueHeading: string;
    nextService: string;
    allServices: string;
  };
  process: {
    label: string;
    title: string;
    steps: [TextItem, TextItem, TextItem, TextItem, TextItem];
  };
  why: {
    label: string;
    title: string;
    items: [TextItem, TextItem, TextItem, TextItem];
  };
  contactCta: {
    label: string;
    title: string;
    text: string;
    primary: string;
  };
  contactPage: {
    label: string;
    title: string;
    intro: string;
    directHeading: string;
    directText: string;
  };
  form: {
    legend: string;
    required: string;
    optional: string;
    name: { label: string; autocompleteHint: string };
    projectType: { label: string; other: string };
    description: { label: string; hint: string; counter: string };
    budget: { label: string; hint: string };
    contactMethod: { label: string; telegram: string; instagram: string; instagramHint: string };
    submit: string;
    errors: {
      summary: string;
      nameRequired: string;
      nameTooLong: string;
      typeRequired: string;
      descriptionTooShort: string;
      descriptionTooLong: string;
      budgetTooLong: string;
    };
    preview: {
      heading: string;
      intro: string;
      edit: string;
      sendTelegram: string;
      sendInstagram: string;
      copying: string;
      copied: string;
      copyFailed: string;
      statusTelegram: string;
      statusInstagram: string;
    };
    message: {
      greeting: string;
      name: string;
      project: string;
      description: string;
      budget: string;
      contactMethod: string;
    };
  };
  privacy: {
    label: string;
    title: string;
    updated: string;
    sections: TextItem[];
  };
  footer: {
    tagline: string;
    navHeading: string;
    contactsHeading: string;
    telegram: string;
    instagram: string;
    channel: string;
    rights: string;
  };
  languageGate: {
    prompt: string;
  };
  notFound: {
    title: string;
    text: string;
    backHome: string;
  };
}
