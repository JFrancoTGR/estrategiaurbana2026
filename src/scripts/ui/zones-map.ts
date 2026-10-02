import { mapLocations } from '../../data/map/map-locations';

import { loadGoogleMaps } from '../lib/google-maps';

const DESKTOP_ZOOM = 16;
const MOBILE_ZOOM = 15;
const LOCATION_ZOOM = 16;

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f4f0eb' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.fill',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#d6d6d6' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#546772' }],
  },
];

const PIN_FILL = {
  venta: '#E32822',
  renta: '#5C100E',
  oficina: '#000000',
} as const;

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

export function initZonesMap(root: HTMLElement) {
  const section = root.closest<HTMLElement>('[data-home-zones-map]');

  if (!section) {
    throw new Error('initZonesMap requiere [data-home-zones-map].');
  }

  const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Falta PUBLIC_GOOGLE_MAPS_API_KEY.');

    return;
  }

  const selector = section.querySelector<HTMLElement>('[data-map-selector]');

  const selectorOpen = section.querySelector<HTMLButtonElement>(
    '[data-map-selector-open]',
  );

  const selectorClose = section.querySelector<HTMLButtonElement>(
    '[data-map-selector-close]',
  );

  const categoryTriggers = Array.from(
    section.querySelectorAll<HTMLButtonElement>('[data-map-category-trigger]'),
  );

  const locationsById = new Map(
    mapLocations.map((location) => [location.id, location]),
  );

  let disposed = false;

  let map: google.maps.Map | null = null;

  let markers: google.maps.OverlayView[] = [];

  /* ---------------------------------
     Selector
  --------------------------------- */

  const closeCategory = (trigger: HTMLButtonElement) => {
    const controls = trigger.getAttribute('aria-controls');

    if (!controls) return;

    const list = section.querySelector<HTMLElement>(`#${controls}`);

    if (!list) return;

    trigger.setAttribute('aria-expanded', 'false');

    list.hidden = true;
  };

  const openCategory = (trigger: HTMLButtonElement) => {
    categoryTriggers.forEach((categoryTrigger) => {
      if (categoryTrigger !== trigger) {
        closeCategory(categoryTrigger);
      }
    });

    const controls = trigger.getAttribute('aria-controls');

    if (!controls) return;

    const list = section.querySelector<HTMLElement>(`#${controls}`);

    if (!list) return;

    trigger.setAttribute('aria-expanded', 'true');

    list.hidden = false;
  };

  const toggleCategory = (trigger: HTMLButtonElement) => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';

    if (isOpen) {
      closeCategory(trigger);
      return;
    }

    openCategory(trigger);
  };

  const openSelector = () => {
    selector?.classList.add('is-open');

    selectorOpen?.setAttribute('aria-expanded', 'true');
  };

  const closeSelector = () => {
    selector?.classList.remove('is-open');

    selectorOpen?.setAttribute('aria-expanded', 'false');
  };

  /* ---------------------------------
     DOM events
  --------------------------------- */

  const handleCategoryClick = (event: Event) => {
    const trigger = event.currentTarget;

    if (!(trigger instanceof HTMLButtonElement)) {
      return;
    }

    toggleCategory(trigger);
  };

  const handleLocationClick = (event: Event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const trigger = target.closest<HTMLElement>('[data-map-location]');

    if (!trigger || !section.contains(trigger)) {
      return;
    }

    const locationId = trigger.dataset.mapLocationId;

    if (!locationId || !map) return;

    const location = locationsById.get(locationId);

    if (!location) {
      console.warn(`Ubicación no encontrada: ${locationId}`);

      return;
    }

    map.panTo({
      lat: location.lat,
      lng: location.lng,
    });

    map.setZoom(LOCATION_ZOOM);

    closeSelector();
  };

  const handleSelectorOpen = () => {
    openSelector();
  };

  const handleSelectorClose = () => {
    closeSelector();
  };

  categoryTriggers.forEach((trigger) => {
    trigger.addEventListener('click', handleCategoryClick);
  });

  section.addEventListener('click', handleLocationClick);

  selectorOpen?.addEventListener('click', handleSelectorOpen);

  selectorClose?.addEventListener('click', handleSelectorClose);

  /* ---------------------------------
     Google Maps
  --------------------------------- */

  const mountGoogleMap = async () => {
    try {
      const googleMaps = await loadGoogleMaps(apiKey);

      /*
       * El usuario pudo abandonar Home mientras
       * el SDK estaba cargando.
       */
      if (disposed || !root.isConnected) {
        return;
      }

      const bounds = new googleMaps.maps.LatLngBounds();

      mapLocations.forEach((location) => {
        bounds.extend({
          lat: location.lat,
          lng: location.lng,
        });
      });

      map = new googleMaps.maps.Map(root, {
        center: bounds.getCenter(),

        zoom: window.innerWidth > 768 ? DESKTOP_ZOOM : MOBILE_ZOOM,

        styles: MAP_STYLES,

        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,

        clickableIcons: false,

        gestureHandling: 'cooperative',
      });

      class NumberPin extends googleMaps.maps.OverlayView {
        private readonly location: (typeof mapLocations)[number];

        private readonly number: number;

        private readonly position: google.maps.LatLng;

        private div: HTMLDivElement | null = null;

        constructor(location: (typeof mapLocations)[number], number: number) {
          super();

          this.location = location;
          this.number = number;

          this.position = new googleMaps.maps.LatLng(
            location.lat,
            location.lng,
          );

          this.setMap(map);
        }

        onAdd() {
          const div = document.createElement('div');

          div.className = `map-pin map-pin--${this.location.category}`;

          const fill = PIN_FILL[this.location.category];

          div.innerHTML = `
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="37"
              height="52"
              viewBox="0 0 37 52"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="${PIN_PATH}"
                fill="${fill}"
              />
            </svg>

            <span class="map-pin__num">
              ${this.number}
            </span>

            <span class="map-pin__label">
              ${this.location.name}
            </span>
          `;

          this.div = div;

          this.getPanes()?.overlayMouseTarget.appendChild(div);
        }

        draw() {
          if (!this.div) return;

          const projection = this.getProjection();

          const position = projection.fromLatLngToDivPixel(this.position);

          if (!position) return;

          this.div.style.left = `${position.x}px`;

          this.div.style.top = `${position.y}px`;
        }

        onRemove() {
          this.div?.remove();

          this.div = null;
        }
      }

      const numbers = {
        venta: 0,
        renta: 0,
        oficina: 0,
      };

      markers = mapLocations.map((location) => {
        numbers[location.category] += 1;

        return new NumberPin(location, numbers[location.category]);
      });
    } catch (error) {
      console.error('No fue posible inicializar el mapa:', error);
    }
  };

  void mountGoogleMap();

  /* ---------------------------------
     Cleanup
  --------------------------------- */

  return () => {
    disposed = true;

    categoryTriggers.forEach((trigger) => {
      trigger.removeEventListener('click', handleCategoryClick);
    });

    section.removeEventListener('click', handleLocationClick);

    selectorOpen?.removeEventListener('click', handleSelectorOpen);

    selectorClose?.removeEventListener('click', handleSelectorClose);

    markers.forEach((marker) => {
      marker.setMap(null);
    });

    markers = [];

    if (map) {
      google.maps.event.clearInstanceListeners(map);

      map = null;
    }

    root.replaceChildren();
  };
}
