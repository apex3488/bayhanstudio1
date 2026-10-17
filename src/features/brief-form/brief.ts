import { contacts } from '../../content/contacts';
import { isServiceId, type ServiceId } from '../../content/services';
import type { Dictionary } from '../../i18n/types';

export type ProjectType = ServiceId | 'other';
export type ContactMethod = 'telegram' | 'instagram';

export interface BriefValues {
  name: string;
  type: ProjectType | '';
  description: string;
  budget: string;
  method: ContactMethod;
}

export type BriefField = 'name' | 'type' | 'description' | 'budget';
export type BriefErrors = Partial<Record<BriefField, keyof Dictionary['form']['errors']>>;

export const LIMITS = {
  name: 60,
  descriptionMin: 20,
  description: 1000,
  budget: 60,
} as const;

/** Field order defines which invalid field receives focus first. */
export const FIELD_ORDER: BriefField[] = ['name', 'type', 'description', 'budget'];

export function emptyBrief(type: ProjectType | '' = ''): BriefValues {
  return { name: '', type, description: '', budget: '', method: 'telegram' };
}

export function parseProjectType(value: string | null): ProjectType | '' {
  if (value === 'other') return 'other';
  return isServiceId(value) ? value : '';
}

export function validateBrief(values: BriefValues): BriefErrors {
  const errors: BriefErrors = {};
  const name = values.name.trim();
  const description = values.description.trim();

  if (!name) errors.name = 'nameRequired';
  else if (name.length > LIMITS.name) errors.name = 'nameTooLong';

  if (!values.type) errors.type = 'typeRequired';

  if (description.length < LIMITS.descriptionMin) errors.description = 'descriptionTooShort';
  else if (description.length > LIMITS.description) errors.description = 'descriptionTooLong';

  if (values.budget.trim().length > LIMITS.budget) errors.budget = 'budgetTooLong';

  return errors;
}

/** The exact text shown in the preview and passed to Telegram / Instagram. */
export function buildMessage(values: BriefValues, t: Dictionary): string {
  const m = t.form.message;
  const type =
    values.type === 'other' || values.type === ''
      ? t.form.projectType.other
      : t.services.items[values.type].name;
  const lines = [
    m.greeting,
    '',
    `${m.name}: ${values.name.trim()}`,
    `${m.project}: ${type}`,
    `${m.description}: ${values.description.trim()}`,
  ];
  if (values.budget.trim()) lines.push(`${m.budget}: ${values.budget.trim()}`);
  lines.push(`${m.contactMethod}: ${t.form.contactMethod[values.method]}`);
  return lines.join('\n');
}

/**
 * Telegram documents `t.me/<username>?text=` as a draft inserted into the input
 * field. Some clients ignore it, which is why the text is also copied.
 * Instagram has no equivalent, so it opens the profile.
 */
export function destinationUrl(method: ContactMethod, message: string): string {
  return method === 'telegram'
    ? `${contacts.telegram}?text=${encodeURIComponent(message)}`
    : contacts.instagram;
}

export async function copyText(
  text: string,
  fallback: HTMLTextAreaElement | null,
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (!fallback) return false;
    fallback.focus();
    fallback.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }
}
