// Fotografías locales de referencia. Asociar por nombre evita depender de IDs de MySQL.
const media = [
  [/cappuccino|capuchino/, 'cappuccino', 'Cappuccino con espuma de leche'],
  [/americano|espresso|expreso/, 'americano', 'Taza de café negro'],
  [/latte|vainilla/, 'latte-vainilla', 'Latte con arte en la espuma'],
  [/cold brew|cafe frio|café frío/, 'cold-brew', 'Café frío con hielo'],
  [/te frio|té frío|frutos rojos|infusion|infusión/, 'te-frutos-rojos', 'Bebida de té rojo con hielo'],
  [/croissant|cruasan/, 'croissant', 'Croissant de mantequilla'],
  [/zanahoria|queque|pastel/, 'queque-zanahoria', 'Queque de zanahoria con cobertura'],
  [/aguacate|tostada/, 'tostada-aguacate', 'Tostada con aguacate']
];
export function productMedia(product = {}) {
  const found = media.find(([pattern]) => pattern.test((product.nombre || '').toLocaleLowerCase('es')));
  return found ? { src: `/images/${found[1]}.webp`, alt: found[2], matched: true } : { src: '/images/cafe-origen.webp', alt: 'Granos de café tostado, imagen de referencia', matched: false };
}

export function categoryPhoto(category = {}) {
  const name = (category.nombre || '').toLocaleLowerCase('es');
  if (/reposter|panader|hornead|postre/.test(name)) return 'croissant';
  if (/desayun|tostad|comida/.test(name)) return 'tostada-aguacate';
  if (/fr[ií]a|refresc|helad/.test(name)) return 'cold-brew';
  if (/caf[eé]|caliente/.test(name)) return 'cappuccino';
  return 'cafe-origen';
}
