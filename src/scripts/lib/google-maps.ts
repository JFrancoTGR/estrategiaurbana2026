/// <reference types="google.maps" />

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

interface GoogleMapsLibraries {
  maps: google.maps.MapsLibrary;
  core: google.maps.CoreLibrary;
}

let configured = false;

let configuredApiKey: string | null = null;

export async function loadGoogleMaps(
  apiKey: string,
): Promise<GoogleMapsLibraries> {
  if (!configured) {
    setOptions({
      key: apiKey,
      v: 'weekly',
      language: 'es',
      region: 'MX',
    });

    configured = true;
    configuredApiKey = apiKey;
  } else if (configuredApiKey !== apiKey) {
    throw new Error(
      'Google Maps ya fue configurado con una API key diferente.',
    );
  }

  const [mapsLibrary, coreLibrary] = await Promise.all([
    importLibrary('maps'),
    importLibrary('core'),
  ]);

  return {
    maps: mapsLibrary as google.maps.MapsLibrary,

    core: coreLibrary as google.maps.CoreLibrary,
  };
}

const GOOGLE_MAPS_STYLE_ATTRIBUTE = 'data-eu-google-maps-style';

let googleMapsStyleCache: string[] = [];

const getGoogleMapsStyles = () =>
  Array.from(document.head.querySelectorAll<HTMLStyleElement>('style')).filter(
    (style) => {
      const css = style.textContent ?? '';

      return (
        css.includes('.gm-style') ||
        css.includes('.gm-control') ||
        css.includes('.gm-ui')
      );
    },
  );

export function cacheGoogleMapsStyles() {
  const styles = getGoogleMapsStyles();

  if (!styles.length) {
    return;
  }

  googleMapsStyleCache = styles.map((style) => style.textContent ?? '');
}

export function restoreGoogleMapsStyles() {
  /*
   * Google todavía conserva sus styles:
   * no necesitamos hacer nada.
   */
  if (getGoogleMapsStyles().length > 0) {
    return;
  }

  if (googleMapsStyleCache.length === 0) {
    return;
  }

  googleMapsStyleCache.forEach((css) => {
    const style = document.createElement('style');

    style.setAttribute(GOOGLE_MAPS_STYLE_ATTRIBUTE, '');

    style.textContent = css;

    document.head.appendChild(style);
  });
}
