export default function BrandLogo({ variant = 'horizontal', className = '', decorative = false }) {
  const mark = variant === 'mark';
  return <img className={`brand-logo ${mark ? 'brand-logo-mark' : 'brand-logo-horizontal'} ${className}`} src={`/branding/cafe-nube-esmeralda-${mark ? 'icono' : 'logo'}.png`} alt={decorative ? '' : 'Café Nube'} width={mark ? 1254 : 2172} height={mark ? 1254 : 724} decoding="async" />;
}
