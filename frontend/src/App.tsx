import { Routes, Route, NavLink } from 'react-router-dom';
import Layout from './components/Layout';
import Billing from './pages/Billing';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';

const nav = [
  { to: '/', label: 'Billing' },
  { to: '/products', label: 'Products' },
  { to: '/customers', label: 'Customers' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/reports', label: 'Reports' },
];

export default function App() {
  return (
    <Layout
      sidebar={
        <nav className="flex flex-col gap-1 p-3">
          {nav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 font-medium transition-colors ${
                  isActive ? 'bg-primary-600 text-white shadow-soft' : 'text-slate-600 hover:bg-surface-100 hover:text-slate-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      }
    >
      <Routes>
        <Route path="/" element={<Billing />} />
        <Route path="/products" element={<Products />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Layout>
  );
}
