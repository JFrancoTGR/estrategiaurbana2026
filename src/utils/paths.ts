const BASE_URL = import.meta.env.BASE_URL;

const normalizedBase =
  BASE_URL === '/' ? '' : BASE_URL.replace(/\/+$/, '');

const hasExternalScheme = (path: string) =>
  /^[a-z][a-z\d+.-]*:/i.test(path);

export function withBase(path: string): string {
  if (
    path.startsWith('#') ||
    path.startsWith('?') ||
    path.startsWith('//') ||
    hasExternalScheme(path)
  ) {
    return path;
  }

  if (path === '' || path === '/') {
    return `${normalizedBase}/`;
  }

  const normalizedPath = `/${path.replace(/^\/+/, '')}`;

  if (
    normalizedBase &&
    (normalizedPath === normalizedBase ||
      normalizedPath.startsWith(`${normalizedBase}/`))
  ) {
    return normalizedPath;
  }

  return `${normalizedBase}${normalizedPath}`;
}

export function withoutBase(pathname: string): string {
  if (!normalizedBase) {
    return pathname;
  }

  if (pathname === normalizedBase || pathname === `${normalizedBase}/`) {
    return '/';
  }

  if (pathname.startsWith(`${normalizedBase}/`)) {
    return pathname.slice(normalizedBase.length);
  }

  return pathname;
}
