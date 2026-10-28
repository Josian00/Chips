import { defaultLang, isLang, type Lang } from '../i18n/ui';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

// Prefix a site path with the configured base (e.g. /Chips on GitHub Pages)
// and, for languages other than English, the language (e.g. /Chips/de/).
// Files in public/ (images, favicon) are shared, so link them without `lang`.
export function url(path = '', lang: Lang = defaultLang): string {
  const prefix = lang === defaultLang ? '' : `${lang}/`;
  return `${base}/${prefix}${path.replace(/^\//, '')}`;
}

// The language of a page and its path without base or language prefix, so
// the language switch can link to the same page in another language.
export function splitPath(pathname: string): { lang: Lang; path: string } {
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const [first, ...others] = rest.replace(/^\//, '').split('/');
  if (isLang(first) && first !== defaultLang) return { lang: first, path: others.join('/') };
  return { lang: defaultLang, path: rest.replace(/^\//, '') };
}
