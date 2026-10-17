import './styles/base.css';
import { hydrateRoot } from 'react-dom/client';
import { App } from './app/App';
import { findRoute } from './app/routes';
import { loadDictionary } from './content/load';
import { isLocale } from './i18n/locales';

const container = document.getElementById('root');
const route = findRoute(container?.dataset.route);
const locale = document.documentElement.lang;

// Static pages (language gate, 404) have no #root and stay plain HTML.
if (container && route && isLocale(locale)) {
  void loadDictionary(locale).then((t) => {
    hydrateRoot(container, <App route={route} locale={locale} t={t} />);
  });
}
