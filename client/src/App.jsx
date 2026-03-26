import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from './Login';
import { Register } from './Register';
import { Home } from './Home';
import { Products } from './Products';
import { ProductView } from './ProductView';
import { ProductEdit } from './ProductEdit';
import { Users } from './Users';

function Layout({ children }) {
  const { user } = useAuth();

  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/">Главная</Link>
        <Link to="/products">Товары</Link>
        {user?.role === 'admin' && <Link to="/users">Пользователи</Link>}
        {user ? (
          <span className="user-info">{user.first_name} ({user.role})</span>
        ) : (
          <>
            <Link to="/login">Вход</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </nav>
      <main>{children}</main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products" element={<Products />} />
      <Route
        path="/products/new"
        element={
          <ProtectedRoute allowedRoles={['seller', 'admin']}>
            <ProductEdit />
          </ProtectedRoute>
        }
      />
      <Route path="/products/:id" element={<ProductView />} />
      <Route
        path="/products/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['seller', 'admin']}>
            <ProductEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Users />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <AppRoutes />
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
