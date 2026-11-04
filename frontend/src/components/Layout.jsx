import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import BrandLogo from './BrandLogo.jsx';

const MOBILE_QUERY = '(max-width: 820px)';
const MENU_PREFERENCE = 'cafe-nube:sidebar-visible';
const navigation = [
  ['/', 'Inicio', 'home'],
  ['/productos', 'Productos', 'coffee'],
  ['/ventas', 'Ventas', 'receipt'],
  ['/clientes', 'Clientes', 'users'],
  ['/categorias', 'Categorías', 'grid'],
  ['/metodos-pago', 'Métodos de pago', 'card'],
  ['/detalle-ventas', 'Detalle de ventas', 'list']
];

function savedVisibility() {
  try { return localStorage.getItem(MENU_PREFERENCE) !== 'false'; }
  catch { return true; }
}

export default function Layout() {
  const [desktopVisible, setDesktopVisible] = useState(savedVisibility);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const menuButton = useRef(null);
  const dismissButton = useRef(null);
  const sidebar = useRef(null);
  const { pathname } = useLocation();
  const menuVisible = isMobile ? mobileOpen : desktopVisible;
  const mobileModal = isMobile && mobileOpen;
  const current = navigation.find(([path]) => path === pathname)?.[1] || 'Página no encontrada';
  const date = new Intl.DateTimeFormat('es-CR', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Costa_Rica'
  }).format(new Date());

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    function changeMode(event) {
      setIsMobile(event.matches);
      setMobileOpen(false);
    }
    media.addEventListener('change', changeMode);
    return () => media.removeEventListener('change', changeMode);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(MENU_PREFERENCE, String(desktopVisible)); } catch { /* Preferencia opcional. */ }
  }, [desktopVisible]);

  useEffect(() => {
    if (mobileModal) dismissButton.current?.focus();
  }, [mobileModal]);

  useEffect(() => {
    if (!mobileModal) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobileModal]);

  function closeMenu() {
    if (isMobile) setMobileOpen(false);
    else setDesktopVisible(false);
    requestAnimationFrame(() => menuButton.current?.focus());
  }

  function toggleMenu() {
    if (menuVisible) closeMenu();
    else if (isMobile) setMobileOpen(true);
    else setDesktopVisible(true);
  }

  function navigate() {
    if (isMobile) closeMenu();
  }

  function sidebarKeys(event) {
    if (!mobileModal) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }
    if (event.key === 'Tab') {
      const controls = sidebar.current.querySelectorAll('a[href], button:not([disabled])');
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  }

  return <div className={`app-shell ${!isMobile && !desktopVisible ? 'sidebar-collapsed' : ''}`}>
    <aside ref={sidebar} id="cafeteria-sidebar" className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}
      inert={!menuVisible} aria-hidden={!menuVisible}
      role={mobileModal ? 'dialog' : undefined} aria-modal={mobileModal ? true : undefined}
      aria-label="Menú de opciones" onKeyDown={sidebarKeys}>
      <button ref={dismissButton} type="button" className="icon-button sidebar-dismiss" onClick={closeMenu}
        aria-label="Cerrar menú" title="Cerrar menú"><Icon name="close" size={18} /></button>
      <Link to="/" className="brand brand-with-logo" aria-label="Café Nube, ir al inicio" onClick={navigate}>
        <BrandLogo />
      </Link>
      <div className="sidebar-rule" />
      <p className="sidebar-label">ESPACIO DE TRABAJO</p>
      <nav aria-label="Navegación principal">
        {navigation.map(([path, label, icon]) => <NavLink key={path} to={path} aria-label={label} end={path === '/'}
          onClick={navigate} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
          <Icon name={icon} size={20} /><span>{label}</span><span className="nav-dot" />
        </NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-slogan">
          <BrandLogo />
          <p>El gusto<br /><em>de cada día.</em></p>
        </div>
        <span className="demo-badge">PROYECTO ACADÉMICO</span>
      </div>
    </aside>
    {mobileModal && <button type="button" className="sidebar-overlay" aria-label="Cerrar menú al tocar fuera" onClick={closeMenu} />}
    <div className="main-shell" inert={mobileModal} aria-hidden={mobileModal ? true : undefined}>
      <div className="brand-ribbon"><span>CAFÉ NUBE</span><span>El gusto de hacer las cosas bien.</span><span>MENÚ · MOSTRADOR · CAFÉ</span></div>
      <header className="topbar">
        <div className="breadcrumb">
          <button ref={menuButton} type="button" className="icon-button menu-toggle" onClick={toggleMenu}
            aria-controls="cafeteria-sidebar" aria-expanded={menuVisible}
            aria-label={menuVisible ? 'Ocultar menú' : 'Mostrar menú'} title={menuVisible ? 'Ocultar menú' : 'Mostrar menú'}>
            <Icon name="menu" />
          </button>
          <span>Café Nube</span><span className="breadcrumb-slash">/</span><strong>{current}</strong>
        </div>
        <div className="topbar-end"><span className="date-pill"><Icon name="calendar" size={16} />{date}</span>
          <span className="workspace-avatar brand-avatar"><BrandLogo variant="mark" /></span>
        </div>
      </header>
      <main className="main-content"><Outlet /></main>
      <footer className="app-footer"><Link to="/" className="footer-brand" aria-label="Café Nube, volver al inicio"><BrandLogo /></Link>
        <span>Hecho para el día a día de tu cafetería.</span>
      </footer>
    </div>
  </div>;
}
