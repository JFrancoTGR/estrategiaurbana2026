/// <reference types="google.maps" />

import {
  mapLocations,
  type MapCategory,
  type MapLocation,
} from '../../data/map/map-locations';

import {
  cacheGoogleMapsStyles,
  loadGoogleMaps,
  restoreGoogleMapsStyles,
} from '../lib/google-maps';

/* ---------------------------------
   Map configuration
--------------------------------- */

const LOCATION_ZOOM = 16;

const getInitialBoundsPadding = () => {
  const isMobile = window.matchMedia('(max-width: 767px)').matches;

  if (isMobile) {
    return {
      top: 40,
      right: 24,
      bottom: 100,
      left: 24,
    };
  }

  return {
    top: 60,
    right: 60,
    bottom: 60,
    left: 70,
  };
};

/* ---------------------------------
   Google Maps visual style
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

/* ---------------------------------
   Pin configuration
--------------------------------- */

const PIN_FILL: Record<MapCategory, string> = {
  venta: '#E32822',
  renta: '#5C100E',
  oficina: '#000000',
};

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

export function initZonesMap(root: HTMLElement) {
  const debugWindow = window as typeof window & {
    __euZonesMapInstances?: number;
  };

  debugWindow.__euZonesMapInstances =
    (debugWindow.__euZonesMapInstances ?? 0) + 1;

  const instanceId = debugWindow.__euZonesMapInstances;

  // console.log(`[ZonesMap #${instanceId}] INIT`, {
  //   pathname: window.location.pathname,
  //   root,
  //   rootConnected: root.isConnected,
  //   gmStyles: root.querySelectorAll('.gm-style').length,
  // });

  const section = root.closest<HTMLElement>('[data-home-zones-map]');

  if (!section) {
    throw new Error('initZonesMap requiere [data-home-zones-map].');
  }

  const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Falta PUBLIC_GOOGLE_MAPS_API_KEY.');

    return;
  }

  /* ---------------------------------
     DOM references
  --------------------------------- */

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

  const categoryLists = Array.from(
    section.querySelectorAll<HTMLElement>('[data-map-category-list]'),
  );

  /* ---------------------------------
     Location lookup
  --------------------------------- */

  const locationsById = new Map<string, MapLocation>(
    mapLocations.map((location) => [location.id, location]),
  );

  /* ---------------------------------
     Runtime state
  --------------------------------- */

  let disposed = false;

  let map: google.maps.Map | null = null;

  let pins: google.maps.OverlayView[] = [];

  let clearMapListeners: (() => void) | null = null;

  const listAnimationTokens = new WeakMap<HTMLElement, number>();

  const getNextListAnimationToken = (list: HTMLElement) => {
    const token = (listAnimationTokens.get(list) ?? 0) + 1;

    listAnimationTokens.set(list, token);

    return token;
  };

  /* ---------------------------------
     Category fade
  --------------------------------- */

  const updateListFade = (list: HTMLElement) => {
    const category = list.closest<HTMLElement>('[data-map-category]');

    if (!category) return;

    const canScroll = list.scrollHeight - list.clientHeight > 2;

    const atEnd = list.scrollTop + list.clientHeight >= list.scrollHeight - 2;

    category.classList.toggle('is-faded', canScroll && !atEnd);
  };

  /* ---------------------------------
     Category accordion
  --------------------------------- */

  const closeCategory = (trigger: HTMLButtonElement) => {
    const controls = trigger.getAttribute('aria-controls');

    if (!controls) return;

    const list = section.querySelector<HTMLElement>(`#${controls}`);

    if (!list) return;

    /*
     * Si ya está cerrado no necesitamos
     * disparar otra transición.
     */
    if (trigger.getAttribute('aria-expanded') !== 'true') {
      trigger.setAttribute('aria-expanded', 'false');

      list.setAttribute('aria-hidden', 'true');

      list.setAttribute('inert', '');

      list.style.height = '0px';
      list.style.overflowY = 'hidden';

      list.closest('[data-map-category]')?.classList.remove('is-faded');

      return;
    }

    const token = getNextListAnimationToken(list);

    /*
     * Partimos de la altura que tiene
     * realmente el panel en este momento.
     */
    const currentHeight = list.getBoundingClientRect().height;

    list.style.height = `${currentHeight}px`;

    list.style.overflowY = 'hidden';

    /*
     * Forzamos al navegador a registrar
     * el estado inicial antes de pasar a 0.
     */
    list.getBoundingClientRect();

    trigger.setAttribute('aria-expanded', 'false');

    list.setAttribute('aria-hidden', 'true');

    list.setAttribute('inert', '');

    requestAnimationFrame(() => {
      if (listAnimationTokens.get(list) !== token) {
        return;
      }

      list.style.height = '0px';
    });

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== list || event.propertyName !== 'height') {
        return;
      }

      list.removeEventListener('transitionend', handleTransitionEnd);

      if (listAnimationTokens.get(list) !== token) {
        return;
      }

      list.style.height = '0px';

      list.closest('[data-map-category]')?.classList.remove('is-faded');
    };

    list.addEventListener('transitionend', handleTransitionEnd);
  };

  const openCategory = (trigger: HTMLButtonElement) => {
    categoryTriggers.forEach((currentTrigger) => {
      if (currentTrigger !== trigger) {
        closeCategory(currentTrigger);
      }
    });

    const controls = trigger.getAttribute('aria-controls');

    if (!controls) return;

    const list = section.querySelector<HTMLElement>(`#${controls}`);

    if (!list) return;

    const token = getNextListAnimationToken(list);

    trigger.setAttribute('aria-expanded', 'true');

    list.setAttribute('aria-hidden', 'false');

    list.removeAttribute('inert');

    /*
     * Estado inicial cerrado.
     */
    list.style.height = '0px';
    list.style.overflowY = 'hidden';

    /*
     * Registramos ese estado antes
     * de calcular la altura abierta.
     */
    list.getBoundingClientRect();

    requestAnimationFrame(() => {
      if (listAnimationTokens.get(list) !== token) {
        return;
      }

      /*
       * scrollHeight nos entrega la altura
       * real del contenido. max-height CSS
       * sigue limitando visualmente a 400px.
       */
      list.style.height = `${list.scrollHeight}px`;
    });

    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== list || event.propertyName !== 'height') {
        return;
      }

      list.removeEventListener('transitionend', handleTransitionEnd);

      if (listAnimationTokens.get(list) !== token) {
        return;
      }

      /*
       * Una vez abierto dejamos que CSS
       * controle la altura natural.
       */
      list.style.height = 'auto';
      list.style.overflowY = 'auto';

      updateListFade(list);
    };

    list.addEventListener('transitionend', handleTransitionEnd);
  };

  const toggleCategory = (trigger: HTMLButtonElement) => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';

    if (isOpen) {
      closeCategory(trigger);
      return;
    }

    openCategory(trigger);
  };

  /* ---------------------------------
     Mobile selector
  --------------------------------- */

  const openSelector = () => {
    if (!selector) return;

    selector.classList.add('is-open');

    selectorOpen?.setAttribute('aria-expanded', 'true');
  };

  const closeSelector = () => {
    if (!selector) return;

    selector.classList.remove('is-open');

    selectorOpen?.setAttribute('aria-expanded', 'false');
  };

  /* ---------------------------------
     Location navigation
  --------------------------------- */

  const showLocation = (locationId: string) => {
    if (!map) return;

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

  /* ---------------------------------
     DOM handlers
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

    if (!locationId) return;

    showLocation(locationId);
  };

  const handleSelectorOpen = () => {
    openSelector();
  };

  const handleSelectorClose = () => {
    closeSelector();
  };

  const handleListScroll = (event: Event) => {
    const list = event.currentTarget;

    if (!(list instanceof HTMLElement)) {
      return;
    }

    updateListFade(list);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
      return;
    }

    closeSelector();
  };

  /* ---------------------------------
     Bind UI
  --------------------------------- */

  categoryTriggers.forEach((trigger) => {
    trigger.addEventListener('click', handleCategoryClick);
  });

  categoryLists.forEach((list) => {
    list.addEventListener('scroll', handleListScroll);
  });

  section.addEventListener('click', handleLocationClick);

  selectorOpen?.addEventListener('click', handleSelectorOpen);

  selectorClose?.addEventListener('click', handleSelectorClose);

  document.addEventListener('keydown', handleKeydown);

  /* ---------------------------------
     Google Maps
  --------------------------------- */

  const mountGoogleMap = async () => {
    try {
      const { maps: mapsLibrary, core: coreLibrary } =
        await loadGoogleMaps(apiKey);
      restoreGoogleMapsStyles();
      /*
       * El usuario pudo abandonar Home
       * mientras cargaban las librerías.
       */
      if (disposed || !root.isConnected) {
        return;
      }

      /*
       * Extraemos explícitamente las clases
       * de las librerías ya cargadas.
       */
      const { Map: GoogleMap, OverlayView } = mapsLibrary;

      const { LatLng, LatLngBounds, event: mapsEvent } = coreLibrary;

      /* ---------------------------------
         Calculate project bounds
      --------------------------------- */

      const bounds = new LatLngBounds();

      mapLocations.forEach((location) => {
        bounds.extend({
          lat: location.lat,
          lng: location.lng,
        });
      });

      /* ---------------------------------
         Create map
      --------------------------------- */

      const googleMap = new GoogleMap(root, {
        center: bounds.getCenter(),

        /*
         * Valor inicial de respaldo.
         * fitBounds lo sustituye inmediatamente.
         */
        zoom: 12,
        styles: MAP_STYLES,
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: false,
        cameraControl: true,
        clickableIcons: false,

        gestureHandling: 'cooperative',
      });

      map = googleMap;

      const styleCaptureListener = mapsEvent.addListenerOnce(
        googleMap,
        'idle',
        () => {
          cacheGoogleMapsStyles();
        },
      );

      // requestAnimationFrame(() => {
      //   console.log(`[ZonesMap #${instanceId}] MOUNTED`, {
      //     gmStyles: root.querySelectorAll('.gm-style').length,

      //     controls: root.querySelectorAll('.gm-control-active').length,
      //   });
      // });

      /*
       * Vista inicial:
       * muestra las 34 ubicaciones
       * respetando el espacio del selector.
       */
      googleMap.fitBounds(bounds, getInitialBoundsPadding());

      clearMapListeners = () => {
        mapsEvent.clearInstanceListeners(googleMap);
      };

      /* ---------------------------------
         Custom Google overlay
      --------------------------------- */

      class NumberPin extends OverlayView {
        private readonly location: MapLocation;

        private readonly number: number;

        private readonly position: google.maps.LatLng;

        private element: HTMLDivElement | null = null;

        constructor(location: MapLocation, number: number) {
          super();

          this.location = location;

          this.number = number;

          this.position = new LatLng(location.lat, location.lng);

          this.setMap(googleMap);
        }

        onAdd() {
          const element = document.createElement('div');

          element.className = `map-pin map-pin--${this.location.category}`;

          /* Pin SVG */

          const svg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg',
          );

          svg.setAttribute('viewBox', '0 0 37 52');

          svg.setAttribute('aria-hidden', 'true');

          const path = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path',
          );

          path.setAttribute('d', PIN_PATH);

          path.setAttribute('fill', PIN_FILL[this.location.category]);

          svg.appendChild(path);

          /* Number */

          const number = document.createElement('span');

          number.className = 'map-pin__num';

          number.textContent = String(this.number);

          /* Label */

          const label = document.createElement('span');

          label.className = 'map-pin__label';

          label.textContent = this.location.name;

          element.append(svg, number, label);

          this.element = element;

          this.getPanes()?.overlayMouseTarget.appendChild(element);
        }

        draw() {
          if (!this.element) {
            return;
          }

          const projection = this.getProjection();

          const point = projection.fromLatLngToDivPixel(this.position);

          if (!point) return;

          this.element.style.left = `${point.x}px`;

          this.element.style.top = `${point.y}px`;
        }

        onRemove() {
          this.element?.remove();

          this.element = null;
        }
      }

      /* ---------------------------------
         Create numbered pins
      --------------------------------- */

      const counters: Record<MapCategory, number> = {
        venta: 0,
        renta: 0,
        oficina: 0,
      };

      pins = mapLocations.map((location) => {
        counters[location.category] += 1;

        return new NumberPin(location, counters[location.category]);
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
    cacheGoogleMapsStyles();

    // console.log(`[ZonesMap #${instanceId}] CLEANUP`, {
    //   pathname: window.location.pathname,
    //   rootConnected: root.isConnected,

    //   gmStyles: root.querySelectorAll('.gm-style').length,
    // });

    disposed = true;

    categoryTriggers.forEach((trigger) => {
      trigger.removeEventListener('click', handleCategoryClick);
    });

    categoryLists.forEach((list) => {
      list.removeEventListener('scroll', handleListScroll);
    });

    section.removeEventListener('click', handleLocationClick);

    selectorOpen?.removeEventListener('click', handleSelectorOpen);

    selectorClose?.removeEventListener('click', handleSelectorClose);

    document.removeEventListener('keydown', handleKeydown);

    pins.forEach((pin) => {
      pin.setMap(null);
    });

    pins = [];

    clearMapListeners?.();

    clearMapListeners = null;

    map = null;

    root.replaceChildren();
  };
}
