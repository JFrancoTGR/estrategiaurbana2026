import L from 'leaflet';

export function initZonesMap(root: HTMLElement) {
  const map = L.map(root, {
    center: [19.4117, -99.1693],

    zoom: 16,

    scrollWheelZoom: false,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  return () => {
    map.remove();
  };
}
