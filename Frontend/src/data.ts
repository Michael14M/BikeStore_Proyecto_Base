import type { Product } from './types';

const A = '/assets';
const U = 'https://images.unsplash.com';

/* ─────────────────────────────────────────────────────────────
   Unique image per product — assets for original 4, Unsplash for rest
───────────────────────────────────────────────────────────── */
const IMG = {
  // MTB — each a distinct shot
  mtb1: `${U}/photo-1575548393466-0df1618ba410?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  mtb2: `${U}/photo-1633707167682-9068729bc84c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  mtb3: `${U}/photo-1506316940527-4d1c138978a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  mtb4: `${U}/photo-1673121414328-52eff37bc6d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  mtb5: `${U}/photo-1621122940876-2b3be129159c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  mtb6: `${U}/photo-1604850613811-b50ad1aeeecd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  // RUTA — road/carbon bikes
  road1: `${U}/photo-1532298229144-0ec0c57515c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  road2: `${U}/photo-1661318874322-f1decff2c89b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  road3: `${U}/photo-1534320553678-50d748b1cd74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  road4: `${U}/photo-1603879558815-569898cdbcb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  road5: `${U}/photo-1762014594439-3271cc8a7e3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  road6: `${U}/photo-1595368452775-0372d3489993?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  // URBANA — city/commuter bikes
  urb1: `${U}/photo-1571068316344-75bc76f77890?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  urb2: `${U}/photo-1583408449794-4ec89863e884?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  urb3: `${U}/photo-1626947926675-9ac09f3e26d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  urb4: `${U}/photo-1684230413889-836e331a8201?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  urb5: `${U}/photo-1783408356004-ad70bbbccbe6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  urb6: `${U}/photo-1763041821558-71301407ded8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  // ELÉCTRICA — e-bikes
  ebike1: `${U}/photo-1563990308267-cd6d3cc09318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  ebike2: `${U}/photo-1619415254624-54e5a71b5d81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  ebike3: `${U}/photo-1635816047399-76858585e45d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  ebike4: `${U}/photo-1613937104213-913b11eb76a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  ebike5: `${U}/photo-1672860356563-d1ce9b67bfb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  ebike6: `${U}/photo-1715223449154-7803640ef4cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  // ACCESORIOS — original 4 assets + Unsplash for new 4
  helmet: `${A}/aca67.png`,
  gloves: `${A}/255c1.png`,
  lights: `${A}/d19d0.png`,
  lock:   `${A}/b7a21.png`,
  shoes:  `${U}/photo-1628636755836-3795f3d2cd99?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  jersey: `${U}/photo-1775881749642-6893e3f6e7d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  pump:   `${U}/photo-1603435794993-f813e28633fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
  gps:    `${U}/photo-1782655478713-5e3ecc22992a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800`,
};

/* ─────────────────────────────────────────────────────────────
   MOUNTAIN BIKE  (6 products)
───────────────────────────────────────────────────────────── */
export const mtbBikes: Product[] = [
  {
    id: 'specialized-epic',
    name: 'Specialized Epic EVO',
    brand: 'SPECIALIZED',
    category: 'mtb',
    price: 11899900,
    originalPrice: 13999900,
    image: IMG.mtb1,
    rating: 5,
    isOffer: true,
    stock: 4,
    description:
      'XC race bike rediseñada para trail. Suspensión FSR con Brain III para eficiencia de pedaleo máxima en terrenos técnicos y velocidad en descenso.',
  },
  {
    id: 'trek-fuel',
    name: 'Trek Fuel EX 9.9 XTR',
    brand: 'TREK',
    category: 'mtb',
    price: 14299900,
    originalPrice: 15999900,
    image: IMG.mtb2,
    rating: 5,
    isOffer: true,
    stock: 6,
    description:
      'Full suspension trail MTB con geometría RE:aktiv+Thru Shaft, componentes Shimano XTR y cuadro OCLV Mountain Carbon para conquistar cualquier sendero.',
  },
  {
    id: 'giant-trance',
    name: 'Giant Trance X Advanced',
    brand: 'GIANT',
    category: 'mtb',
    price: 9799900,
    image: IMG.mtb3,
    rating: 4,
    isOffer: false,
    stock: 8,
    description:
      'Trail bike agresiva con 130mm de recorrido, geometría progresiva Maestro y componentes Shimano SLX para descensos técnicos y ascensos eficientes.',
  },
  {
    id: 'scott-scale',
    name: 'Scott Scale RC 900 World Cup',
    brand: 'SCOTT',
    category: 'mtb',
    price: 13499900,
    originalPrice: 15899900,
    image: IMG.mtb4,
    rating: 5,
    isOffer: true,
    stock: 3,
    description:
      'Bicicleta de XC de competición con cuadro HMX Carbon de 690g. Geometría agresiva, horquilla FOX 32 Factory y grupo SRAM XX1 Eagle AXS.',
  },
  {
    id: 'orbea-occam',
    name: 'Orbea Occam M30',
    brand: 'ORBEA',
    category: 'mtb',
    price: 8299900,
    image: IMG.mtb5,
    rating: 4,
    isOffer: false,
    stock: 10,
    description:
      'Trail bike con 130mm de recorrido y cuadro OMX Carbon. Geometría moderna con ángulo de dirección relajado para mayor confianza en descenso.',
  },
  {
    id: 'cannondale-scalpel',
    name: 'Cannondale Scalpel Carbon 2',
    brand: 'CANNONDALE',
    category: 'mtb',
    price: 17899900,
    image: IMG.mtb6,
    rating: 5,
    isOffer: false,
    stock: 2,
    description:
      'XC full suspension con tecnología FlexPivot, cuadro BallisTec Carbon y grupo Shimano XTR. Ganadora de múltiples etapas de Copa del Mundo.',
  },
];

/* ─────────────────────────────────────────────────────────────
   RUTA  (6 products)
───────────────────────────────────────────────────────────── */
export const rutaBikes: Product[] = [
  {
    id: 'canyon-aeroad',
    name: 'Canyon Aeroad CF SLX',
    brand: 'CANYON',
    category: 'ruta',
    price: 8499900,
    originalPrice: 10199900,
    image: IMG.road1,
    rating: 5,
    isOffer: true,
    stock: 5,
    description:
      'La bicicleta de ruta más aerodinámica de Canyon. Cuadro de carbono CF SLX con integración total de cables y componentes Shimano Dura-Ace Di2.',
  },
  {
    id: 'trek-madone',
    name: 'Trek Madone SLR 9',
    brand: 'TREK',
    category: 'ruta',
    price: 16149900,
    originalPrice: 17799900,
    image: IMG.road2,
    rating: 4,
    isOffer: false,
    stock: 3,
    description:
      'La pinnacle de la ingeniería Trek. Cuadro OCLV 800 Carbon con IsoSpeed desacoplado para absorber vibraciones sin comprometer la rigidez.',
  },
  {
    id: 'canyon-endurace',
    name: 'Canyon Endurace CF SLX',
    brand: 'CANYON',
    category: 'ruta',
    price: 7899900,
    image: IMG.road3,
    rating: 4,
    isOffer: false,
    stock: 7,
    description:
      'Endurance road bike diseñada para largas distancias. Cuadro CF SLX con geometría relajada para el máximo confort sin sacrificar rendimiento.',
  },
  {
    id: 'bmc-teammachine',
    name: 'BMC Teammachine SLR01',
    brand: 'BMC',
    category: 'ruta',
    price: 19499900,
    originalPrice: 22999900,
    image: IMG.road4,
    rating: 5,
    isOffer: true,
    stock: 2,
    description:
      'La bicicleta de carretera más rápida de BMC. Cuadro ACE Carbon con RideTuned Compliance, grupo SRAM Red AXS y ruedas DT Swiss ARC 1100.',
  },
  {
    id: 'pinarello-dogma',
    name: 'Pinarello Dogma F',
    brand: 'PINARELLO',
    category: 'ruta',
    price: 28999900,
    image: IMG.road5,
    rating: 5,
    isOffer: false,
    stock: 1,
    description:
      'La bicicleta de los campeones del Tour de France. Cuadro Torayca T1100 1K, horquilla asimétrica Onda y grupo Campagnolo Super Record Wireless.',
  },
  {
    id: 'cervelo-soloist',
    name: 'Cervélo Soloist Rival eTap',
    brand: 'CERVÉLO',
    category: 'ruta',
    price: 11299900,
    originalPrice: 12999900,
    image: IMG.road6,
    rating: 4,
    isOffer: true,
    stock: 9,
    description:
      'Bicicleta de alto rendimiento equilibrando aerodinámica y comodidad. Cuadro Soloist Carbon con grupo SRAM Rival eTap AXS 12 velocidades.',
  },
];

/* ─────────────────────────────────────────────────────────────
   URBANA  (6 products)
───────────────────────────────────────────────────────────── */
export const urbanaBikes: Product[] = [
  {
    id: 'giant-revolt',
    name: 'Giant Revolt Advanced',
    brand: 'GIANT',
    category: 'urbana',
    price: 6399900,
    originalPrice: 7599900,
    image: IMG.urb1,
    rating: 5,
    isOffer: true,
    stock: 6,
    description:
      'Gravel bike con cuadro Advanced Composite, perfecta para asfalto, grava y caminos sin pavimentar. La bicicleta urbana definitiva.',
  },
  {
    id: 'trek-fx3',
    name: 'Trek FX 3 Disc',
    brand: 'TREK',
    category: 'urbana',
    price: 3299900,
    image: IMG.urb2,
    rating: 4,
    isOffer: false,
    stock: 14,
    description:
      'Bicicleta urbana versátil con cuadro de aluminio Alpha 300, frenos de disco hidráulicos Shimano y transmisión de 24 velocidades. Ideal para la ciudad.',
  },
  {
    id: 'cannondale-bad-boy',
    name: 'Cannondale Bad Boy 2',
    brand: 'CANNONDALE',
    category: 'urbana',
    price: 3899900,
    originalPrice: 4499900,
    image: IMG.urb3,
    rating: 5,
    isOffer: true,
    stock: 8,
    description:
      'Urban commuter agresiva con cuadro SmartForm C2 Alloy, horquilla Lefty Oliver y frenos de disco hidráulicos. Diseñada para dominar la ciudad.',
  },
  {
    id: 'specialized-sirrus',
    name: 'Specialized Sirrus X 4.0',
    brand: 'SPECIALIZED',
    category: 'urbana',
    price: 5199900,
    image: IMG.urb4,
    rating: 4,
    isOffer: false,
    stock: 11,
    description:
      'Fitness bike premium con cuadro FACT 9r Carbon, frenos de disco hidráulicos y manubrio ergonómico. Eficiente en carretera y cómoda en grava.',
  },
  {
    id: 'giant-cypress',
    name: 'Giant Cypress DX',
    brand: 'GIANT',
    category: 'urbana',
    price: 2099900,
    image: IMG.urb5,
    rating: 4,
    isOffer: false,
    stock: 20,
    description:
      'Bicicleta de ciudad confiable y cómoda con cuadro ALUXX Aluminum, posición upright y extras como rack trasero y guardabarros incluidos.',
  },
  {
    id: 'scott-sub-sport',
    name: 'Scott Sub Sport 30',
    brand: 'SCOTT',
    category: 'urbana',
    price: 2799900,
    originalPrice: 3199900,
    image: IMG.urb6,
    rating: 4,
    isOffer: true,
    stock: 12,
    description:
      'Bicicleta urbana-deportiva con cuadro de aluminio, grupo Shimano Deore y frenos de disco mecánicos. Ágil en la ciudad y cómoda en distancias largas.',
  },
];

/* ─────────────────────────────────────────────────────────────
   ELÉCTRICA  (6 products)
───────────────────────────────────────────────────────────── */
export const electricaBikes: Product[] = [
  {
    id: 'specialized-levo',
    name: 'Specialized Levo SL Comp',
    brand: 'SPECIALIZED',
    category: 'electrica',
    price: 22499900,
    originalPrice: 26999900,
    image: IMG.ebike1,
    rating: 5,
    isOffer: true,
    stock: 4,
    description:
      'E-MTB de carbono ultraligera con motor SL 1.1 de 240W. Siente la diferencia de una asistencia eléctrica que parece natural y transparente.',
  },
  {
    id: 'trek-rail',
    name: 'Trek Rail 9.8 XT',
    brand: 'TREK',
    category: 'electrica',
    price: 19899900,
    image: IMG.ebike2,
    rating: 5,
    isOffer: false,
    stock: 3,
    description:
      'E-MTB de alto rendimiento con motor Bosch Performance CX Gen 4, batería de 625Wh, cuadro OCLV Mountain Carbon y grupo Shimano XT.',
  },
  {
    id: 'giant-reign-e',
    name: 'Giant Reign E+ Pro 1',
    brand: 'GIANT',
    category: 'electrica',
    price: 15999900,
    originalPrice: 18499900,
    image: IMG.ebike3,
    rating: 5,
    isOffer: true,
    stock: 5,
    description:
      'E-enduro de alto desempeño con motor SyncDrive Pro2 de 85Nm, batería integrada de 500Wh y horquilla Fox 38 Factory para descenso agresivo.',
  },
  {
    id: 'cannondale-moterra',
    name: 'Cannondale Moterra Neo Carbon',
    brand: 'CANNONDALE',
    category: 'electrica',
    price: 17299900,
    image: IMG.ebike4,
    rating: 4,
    isOffer: false,
    stock: 2,
    description:
      'E-trail premium con cuadro Ballistec Carbon, motor Bosch Performance CX 85Nm y batería de 625Wh con PowerTube integrado. 140mm de recorrido.',
  },
  {
    id: 'orbea-wild-fs',
    name: 'Orbea Wild FS H10',
    brand: 'ORBEA',
    category: 'electrica',
    price: 12499900,
    image: IMG.ebike5,
    rating: 4,
    isOffer: false,
    stock: 7,
    description:
      'E-MTB full suspension accesible con motor Bosch Performance CX, batería de 630Wh, geometría progresiva y amortiguador RockShox Deluxe Select+.',
  },
  {
    id: 'cube-stereo-hybrid',
    name: 'Cube Stereo Hybrid 140 HPC TM',
    brand: 'CUBE',
    category: 'electrica',
    price: 14799900,
    originalPrice: 16999900,
    image: IMG.ebike6,
    rating: 5,
    isOffer: true,
    stock: 4,
    description:
      'E-trail versátil con cuadro de carbono C:62 Monocoque, motor Bosch Performance CX 4th Gen, batería de 625Wh y geometría de enduro agresiva.',
  },
];

/* ─────────────────────────────────────────────────────────────
   ACCESORIOS  (8 products)
───────────────────────────────────────────────────────────── */
export const accessories: Product[] = [
  {
    id: 'casco-aero',
    name: 'Casco Carbon Aero Smart',
    brand: 'KASK',
    category: 'accesorios',
    price: 449900,
    originalPrice: 549900,
    image: IMG.helmet,
    rating: 5,
    isOffer: true,
    stock: 10,
    description:
      'Casco de fibra de carbono con tecnología MIPS, ventilación optimizada y peso de solo 210g. Certificado para competición UCI.',
  },
  {
    id: 'guantes-grip',
    name: 'Guantes Pro Grip Invierno',
    brand: 'CASTELLI',
    category: 'accesorios',
    price: 109900,
    image: IMG.gloves,
    rating: 4,
    isOffer: false,
    stock: 18,
    description:
      'Guantes térmicos de invierno con palma de gel Progel 2, forro Thermoflex y membrana impermeable. Pantalla táctil compatible.',
  },
  {
    id: 'luces-led',
    name: 'Kit Luces LED Smart 1000Lm',
    brand: 'LEZYNE',
    category: 'accesorios',
    price: 189900,
    originalPrice: 229900,
    image: IMG.lights,
    rating: 5,
    isOffer: true,
    stock: 15,
    description:
      'Set completo de luces delantera 1000 lúmenes y trasera 150 lúmenes con sensores automáticos y carga USB-C.',
  },
  {
    id: 'candado-safe',
    name: 'Candado Plegable SafeSecure',
    brand: 'ABUS',
    category: 'accesorios',
    price: 154900,
    image: IMG.lock,
    rating: 4,
    isOffer: false,
    stock: 22,
    description:
      'Candado plegable de 8 eslabones con acero SH 5.5mm, nivel de seguridad 9/15 y soporte de montaje incluido.',
  },
  {
    id: 'zapatillas-mtb',
    name: 'Zapatillas MTB Shimano ME5',
    brand: 'SHIMANO',
    category: 'accesorios',
    price: 319900,
    originalPrice: 379900,
    image: IMG.shoes,
    rating: 4,
    isOffer: true,
    stock: 9,
    description:
      'Zapatillas MTB con suela de carbono Dynalast, cierre Boa IP1, impermeables y compatibles con calas SPD. Rigidez índice 6.',
  },
  {
    id: 'maillot-pro',
    name: 'Maillot Pro Team Climber',
    brand: 'CASTELLI',
    category: 'accesorios',
    price: 249900,
    image: IMG.jersey,
    rating: 5,
    isOffer: false,
    stock: 13,
    description:
      'Maillot de competición con tejido KISS Air 2 ultraligero, bolsillos traseros elásticos, cremallera YKK y corte aerodinámico pro.',
  },
  {
    id: 'bomba-topeak',
    name: 'Bomba de Piso Topeak JoeBlow',
    brand: 'TOPEAK',
    category: 'accesorios',
    price: 189900,
    image: IMG.pump,
    rating: 5,
    isOffer: false,
    stock: 30,
    description:
      'Bomba de piso con manómetro SmartGauge Digital 2, cabezal TwinHead D compatible con válvulas Presta y Schrader, hasta 160 PSI.',
  },
  {
    id: 'computador-garmin',
    name: 'Computador Garmin Edge 540',
    brand: 'GARMIN',
    category: 'accesorios',
    price: 1199900,
    originalPrice: 1399900,
    image: IMG.gps,
    rating: 5,
    isOffer: true,
    stock: 6,
    description:
      'GPS ciclismo con pantalla de 2.6", ClimbPro, mapas Garmin Cycle Map, hasta 26h batería, métricas avanzadas y compatibilidad con sensores ANT+.',
  },
];

/* ─────────────────────────────────────────────────────────────
   Composites & utilities
───────────────────────────────────────────────────────────── */
export const bikes: Product[] = [...mtbBikes, ...rutaBikes, ...urbanaBikes, ...electricaBikes];
export const allProducts: Product[] = [...bikes, ...accessories];

export function formatCOP(price: number): string {
  return '$' + price.toLocaleString('es-CO') + ' COP';
}
