import RutaProtegida from '../components/RutaProtegida.jsx';
import Login from '../pages/Login.jsx';
import Registro from '../pages/Registro.jsx';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import InicioPage from '../pages/InicioPage.jsx';
import CategoriasPage from '../pages/CategoriasPage.jsx';
import ProductosPage from '../pages/ProductosPage.jsx';
import ClientesPage from '../pages/ClientesPage.jsx';
import MetodosPagoPage from '../pages/MetodosPagoPage.jsx';
import VentasPage from '../pages/VentasPage.jsx';
import DetallesVentaPage from '../pages/DetallesVentaPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route index element={<InicioPage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="categorias" element={<CategoriasPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="metodos-pago" element={<MetodosPagoPage />} />
          <Route path="ventas" element={<VentasPage />} />
          <Route path="detalle-ventas" element={<DetallesVentaPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
