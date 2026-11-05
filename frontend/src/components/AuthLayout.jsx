import BrandLogo from './BrandLogo.jsx';
export default function AuthLayout({ children }) {
  return (
    <main className="auth-shell">
      <section className="auth-story" aria-label="Café Nube">
        <BrandLogo />
        <div>
          <span className="eyebrow">CAFÉ NUBE</span>
          <h1>
            El gusto
            <br />
            <em>de cada día.</em>
          </h1>
          <p>Tu cafetería, tus productos y cada venta, en un mismo lugar.</p>
        </div>
        <span className="auth-story-footer">HECHO PARA TU DÍA A DÍA</span>
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}
