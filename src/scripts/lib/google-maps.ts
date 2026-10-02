declare global {
  interface Window {
    __euGoogleMapsPromise?: Promise<typeof google>;
  }
}

const SCRIPT_ID = 'eu-google-maps-sdk';

export function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (window.__euGoogleMapsPromise) {
    return window.__euGoogleMapsPromise;
  }

  window.__euGoogleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');

    script.id = SCRIPT_ID;
    script.src =
      'https://maps.googleapis.com/maps/api/js' +
      `?key=${encodeURIComponent(apiKey)}` +
      '&loading=async';

    script.async = true;

    script.addEventListener(
      'load',
      () => {
        if (window.google?.maps) {
          resolve(window.google);
          return;
        }

        reject(new Error('Google Maps cargó sin exponer window.google.maps.'));
      },
      { once: true },
    );

    script.addEventListener(
      'error',
      () => {
        window.__euGoogleMapsPromise = undefined;

        reject(new Error('No fue posible cargar Google Maps.'));
      },
      { once: true },
    );

    document.head.appendChild(script);
  });

  return window.__euGoogleMapsPromise;
}
