import type { Locale } from '../i18n/locales';
import type { Dictionary } from '../i18n/types';
import { en } from './en';
import { ru } from './ru';
import { uz } from './uz';

export const dictionaries: Record<Locale, Dictionary> = { ru, en, uz };
