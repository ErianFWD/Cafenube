import { useState, useEffect } from 'react';
import { productMedia } from '../utils/productMedia.js';
export default function ProductPhoto({ product, className = '', eager = false }) {
  const photo = productMedia(product);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo.src]);
  return (
    <img
      className={`product-photo ${className}`}
      src={failed ? '/images/cafe-origen.webp' : photo.src}
      alt={failed ? 'Granos de café tostado' : photo.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      width="720"
      height="540"
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}
