/// <reference types="google.maps" />

import {
  cacheGoogleMapsStyles,
  loadGoogleMaps,
  restoreGoogleMapsStyles,
} from '../lib/google-maps';

/* ---------------------------------
   Map visual style
--------------------------------- */

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#f4f0eb',
      },
    ],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.fill',
    stylers: [
      {
        visibility: 'simplified',
      },
    ],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#d6d6d6',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    featureType: 'road.local',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#546772',
      },
    ],
  },
];

const PIN_PATH =
  'M32.0269 5.97648C26.4285 0.034966 18.0152 -1.72892 ' +
  '10.6652 1.8298C3.72188 5.1719 0.281487 10.8968 0 17.4572' +
  'C0.0312763 22.656 1.09467 26.5861 2.65849 30.3924' +
  'C4.59762 35.0342 7.2561 39.2737 10.3212 43.2966' +
  'C12.5105 46.1745 14.8562 48.8977 17.4522 51.4662' +
  'C18.1715 52.1779 18.8283 52.1779 19.579 51.4662' +
  'C19.7979 51.2496 20.0168 51.002 20.267 50.7544' +
  'C25.021 45.8651 29.2121 40.4806 32.4335 34.4462' +
  'C34.8418 29.9592 36.562 25.2555 36.9373 20.1495' +
  'C37.3439 14.734 35.7801 9.99938 32.0269 6.00743V5.97648Z';

/* ---------------------------------
   Initializer
--------------------------------- */

export function initProjectLocationMap(root: HTMLElement) {
  const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Falta PUBLIC_GOOGLE_MAPS_API_KEY.');

    return;
  }

  const name = root.dataset.mapName?.trim();

  const lat = Number(root.dataset.mapCenterLat);
  const lng = Number(root.dataset.mapCenterLng);
  const zoom = Number(root.dataset.mapZoom);

  if (
    !name ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !Number.isFinite(zoom)
  ) {
    console.error('ProjectLocationMap recibió configuración incompleta.', {
      name,
      lat,
      lng,
      zoom,
    });

    return;
  }

  const projectName = name;

  const center = {
    lat,
    lng,
  };

  let disposed = false;

  let map: google.maps.Map | null = null;
  let pin: google.maps.OverlayView | null = null;

  let clearMapListeners: (() => void) | null = null;

  const mountGoogleMap = async () => {
    try {
      const { maps: mapsLibrary, core: coreLibrary } =
        await loadGoogleMaps(apiKey);

      restoreGoogleMapsStyles();

      if (disposed || !root.isConnected) {
        return;
      }

      const { Map: GoogleMap, OverlayView } = mapsLibrary;

      const { LatLng, event: mapsEvent } = coreLibrary;

      const googleMap = new GoogleMap(root, {
        center,
        zoom,

        styles: MAP_STYLES,

        mapTypeControl: false,
        streetViewControl: false,

        fullscreenControl: true,
        zoomControl: true,

        gestureHandling: 'cooperative',
      });

      map = googleMap;

      class ProjectLocationPin extends OverlayView {
        private readonly position = new LatLng(center.lat, center.lng);

        private element: HTMLDivElement | null = null;

        onAdd() {
          const element = document.createElement('div');

          element.className = 'project-location-pin';

          element.setAttribute('role', 'img');
          element.setAttribute('aria-label', `Ubicación de ${projectName}`);

          element.innerHTML = `
            <svg
              viewBox="0 0 37 52"
              aria-hidden="true"
            >
              <path
                d="${PIN_PATH}"
                fill="#E32822"
              ></path>

              <circle
                cx="18.5"
                cy="17.5"
                r="4"
                fill="#ffffff"
              ></circle>
            </svg>

            <span class="project-location-pin__label"></span>
          `;

          const label = element.querySelector<HTMLElement>(
            '.project-location-pin__label',
          );

          if (label) {
            label.textContent = projectName;
          }

          this.element = element;

          this.getPanes()?.overlayMouseTarget.appendChild(element);
        }

        draw() {
          if (!this.element) {
            return;
          }

          const projection = this.getProjection();

          const point = projection.fromLatLngToDivPixel(this.position);

          if (!point) {
            return;
          }

          this.element.style.left = `${point.x}px`;
          this.element.style.top = `${point.y}px`;
        }

        onRemove() {
          this.element?.remove();

          this.element = null;
        }
      }

      const projectPin = new ProjectLocationPin();

      projectPin.setMap(googleMap);

      pin = projectPin;

      clearMapListeners = () => {
        mapsEvent.clearInstanceListeners(googleMap);
      };
    } catch (error) {
      if (disposed) {
        return;
      }

      console.error('No fue posible inicializar ProjectLocationMap.', error);
    }
  };

  void mountGoogleMap();

  return () => {
    disposed = true;

    /*
     * Conservamos los estilos inyectados por Google antes
     * de que ClientRouter sustituya el contenido de la página.
     */
    cacheGoogleMapsStyles();

    pin?.setMap(null);

    pin = null;

    clearMapListeners?.();

    clearMapListeners = null;

    map = null;

    root.replaceChildren();
  };
}
