import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="home">
      <h1>Магазин</h1>
      {user ? (
        <>
          <p>
            Добро пожаловать, <strong>{user.first_name} {user.last_name}</strong>!
          </p>
          <p>Роль: <strong>{user.role}</strong></p>
          <div className="nav-links">
            <Link to="/products">Товары</Link>
            {user.role === 'admin' && (
              <>
                {' '}| <Link to="/users">Пользователи</Link>
              </>
            )}
            {' '}| <button onClick={handleLogout}>Выйти</button>
          </div>
        </>
      ) : (
        <>
          <p>Добро пожаловать!</p>
          <div className="nav-links">
            <Link to="/login">Войти</Link> | <Link to="/register">Регистрация</Link>
          </div>
        </>
      )}
    </div>
  );
}
