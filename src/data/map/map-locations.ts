export type MapCategory = 'venta' | 'renta' | 'oficina';

export interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: MapCategory;
}

export const mapLocations = [
  /* ---------------------------------
     Venta
  --------------------------------- */

  {
    id: 'edgar-allan-poe-335',
    name: 'Edgar Allan Poe 335',
    lat: 19.4335,
    lng: -99.1918,
    category: 'venta',
  },
  {
    id: 'horacio-1716',
    name: 'Horacio 1716',
    lat: 19.4375,
    lng: -99.211,
    category: 'venta',
  },
  {
    id: 'solon-337',
    name: 'Solón 337',
    lat: 19.433,
    lng: -99.201,
    category: 'venta',
  },
  {
    id: 'plinio-340',
    name: 'Plinio 340',
    lat: 19.4331,
    lng: -99.2055,
    category: 'venta',
  },
  {
    id: 'musset-228',
    name: 'Musset 228',
    lat: 19.437,
    lng: -99.1964,
    category: 'venta',
  },
  {
    id: 'goldsmith-119',
    name: 'Goldsmith 119',
    lat: 19.433,
    lng: -99.2005,
    category: 'venta',
  },
  {
    id: 'edgar-allan-poe-64',
    name: 'Edgar Allan Poe 64',
    lat: 19.4342,
    lng: -99.1935,
    category: 'venta',
  },
  {
    id: 'campos-eliseos-369',
    name: 'Campos Elíseos 369',
    lat: 19.4283,
    lng: -99.1915,
    category: 'venta',
  },
  {
    id: 'aristoteles-68',
    name: 'Aristóteles 68',
    lat: 19.4359,
    lng: -99.1931,
    category: 'venta',
  },
  {
    id: 'campos-eliseos-165',
    name: 'Campos Elíseos 165',
    lat: 19.4275,
    lng: -99.186,
    category: 'venta',
  },
  {
    id: 'hegel-721',
    name: 'Hegel 721',
    lat: 19.4286,
    lng: -99.1878,
    category: 'venta',
  },
  {
    id: 'sudermann-222',
    name: 'Sudermann 222',
    lat: 19.4353,
    lng: -99.1841,
    category: 'venta',
  },
  {
    id: 'hamburgo-112',
    name: 'Hamburgo 112',
    lat: 19.4255,
    lng: -99.165,
    category: 'venta',
  },
  {
    id: 'jose-maria-i-59',
    name: 'José María I. 59',
    lat: 19.438067,
    lng: -99.1551206,
    category: 'venta',
  },
  {
    id: 'ignacio-l-19',
    name: 'Ignacio L. 19',
    lat: 19.4346163,
    lng: -99.1559151,
    category: 'venta',
  },
  {
    id: 'liverpool-108',
    name: 'Liverpool 108',
    lat: 19.428,
    lng: -99.1563,
    category: 'venta',
  },
  {
    id: 'napoles-86',
    name: 'Nápoles 86',
    lat: 19.425,
    lng: -99.1589,
    category: 'venta',
  },
  {
    id: 'jose-vasconcelos-154',
    name: 'José Vasconcelos 154',
    lat: 19.4178,
    lng: -99.1783,
    category: 'venta',
  },
  {
    id: 'nuevo-leon-36',
    name: 'Nuevo León 36',
    lat: 19.4142,
    lng: -99.1707,
    category: 'venta',
  },
  {
    id: 'guanajuato-238',
    name: 'Guanajuato 238',
    lat: 19.4165,
    lng: -99.1615,
    category: 'venta',
  },
  {
    id: 'cholula-17',
    name: 'Cholula 17',
    lat: 19.4078,
    lng: -99.175,
    category: 'venta',
  },
  {
    id: 'chilpancingo-54',
    name: 'Chilpancingo 54',
    lat: 19.4105,
    lng: -99.1705,
    category: 'venta',
  },
  {
    id: 'nuevo-leon-219',
    name: 'Nuevo León 219',
    lat: 19.4043,
    lng: -99.1718,
    category: 'venta',
  },
  {
    id: 'tehuantepec-98',
    name: 'Tehuantepec 98',
    lat: 19.4036,
    lng: -99.1689,
    category: 'venta',
  },
  {
    id: 'cuauhtemoc-857',
    name: 'Cuauhtémoc 857',
    lat: 19.3868,
    lng: -99.1552,
    category: 'venta',
  },
  {
    id: 'dr-barragan-751',
    name: 'Dr. Barragán 751',
    lat: 19.3905,
    lng: -99.1545,
    category: 'venta',
  },
  {
    id: 'san-antonio-95',
    name: 'San Antonio 95',
    lat: 19.3851,
    lng: -99.1785,
    category: 'venta',
  },
  {
    id: 'san-antonio-88',
    name: 'San Antonio 88',
    lat: 19.3855,
    lng: -99.179,
    category: 'venta',
  },

  /* ---------------------------------
     Renta
  --------------------------------- */

  {
    id: 'bucareli-35',
    name: 'Bucareli 35',
    lat: 19.4333,
    lng: -99.1513,
    category: 'renta',
  },
  {
    id: 'sullivan-25',
    name: 'Sullivan 25',
    lat: 19.4344,
    lng: -99.1642,
    category: 'renta',
  },
  {
    id: 'nuevo-leon-257',
    name: 'Nuevo León 257',
    lat: 19.402,
    lng: -99.1755,
    category: 'renta',
  },
  {
    id: 'bajio-362',
    name: 'Bajío 362',
    lat: 19.4021,
    lng: -99.1702,
    category: 'renta',
  },
  {
    id: 'revolucion-356',
    name: 'Revolución 356',
    lat: 19.3895,
    lng: -99.1875,
    category: 'renta',
  },

  /* ---------------------------------
     Oficina
  --------------------------------- */

  {
    id: 'rio-nilo',
    name: 'Río Nilo',
    lat: 19.4305,
    lng: -99.1645,
    category: 'oficina',
  },
] satisfies MapLocation[];
