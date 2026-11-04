import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
export default function NotFoundPage() { return <section className="surface not-found"><Icon name="coffee" size={54} /><p className="eyebrow">PÁGINA NO ENCONTRADA</p><h1>Esta mesa está vacía.</h1><p>La dirección que abriste no corresponde a una sección del sistema.</p><Link to="/" className="button primary">Volver al inicio<Icon name="arrow" size={18} /></Link></section>; }
