import { useState } from 'react';

/** <img> que some com elegância se o arquivo não existir. */
export default function SafeImg({ src, alt = '', className = '', ...rest }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return null;
  return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} {...rest} />;
}
