import { useEffect, useMemo, useState } from 'react';
import { apiRequest, clearTokens, getTokens, login, register } from './api.js';

const emptyProduct = {
  title: '',
  category: '',
  description: '',
  price: ''
};

const emptyLogin = {
  email: '',
  password: ''
};

const emptyRegister = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'user'
};

const roles = [
  { value: 'user', label: 'Пользователь' },
  { value: 'seller', label: 'Продавец' },
  { value: 'admin', label: 'Администратор' }
];

function roleLabel(role) {
  return roles.find((item) => item.value === role)?.label || role;
}

function Field({ label, value, onChange, type = 'text', required = false, placeholder = '' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} required={required} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
    </label>
  );
}

function Message({ error, success }) {
  if (!error && !success) {
    return null;
  }
  return <div className={error ? 'message error' : 'message success'}>{error || success}</div>;
}

function AuthView({ onLoggedIn }) {
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitLogin(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      await onLoggedIn();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await register(registerForm);
      setRegisterForm(emptyRegister);
      setMode('login');
      setSuccess('Пользователь зарегистрирован. Теперь можно войти.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <h1 className="student-title">БОСАРЕВ ЕВГЕНИЙ</h1>
      <section className="panel auth-panel">
        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Вход</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Регистрация</button>
        </div>
        <Message error={error} success={success} />
        {mode === 'login' ? (
          <form onSubmit={submitLogin} className="form-grid">
            <Field label="Email" value={loginForm.email} required placeholder="admin@example.com" onChange={(value) => setLoginForm((form) => ({ ...form, email: value }))} />
            <Field label="Пароль" type="password" value={loginForm.password} required placeholder="admin123" onChange={(value) => setLoginForm((form) => ({ ...form, password: value }))} />
            <button className="primary" disabled={loading}>{loading ? 'Вход...' : 'Войти'}</button>
          </form>
        ) : (
          <form onSubmit={submitRegister} className="form-grid">
            <Field label="Имя" value={registerForm.first_name} required onChange={(value) => setRegisterForm((form) => ({ ...form, first_name: value }))} />
            <Field label="Фамилия" value={registerForm.last_name} required onChange={(value) => setRegisterForm((form) => ({ ...form, last_name: value }))} />
            <Field label="Email" value={registerForm.email} required onChange={(value) => setRegisterForm((form) => ({ ...form, email: value }))} />
            <Field label="Пароль" type="password" value={registerForm.password} required onChange={(value) => setRegisterForm((form) => ({ ...form, password: value }))} />
            <SelectField label="Роль" value={registerForm.role} onChange={(value) => setRegisterForm((form) => ({ ...form, role: value }))}>
              {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </SelectField>
            <button className="primary" disabled={loading}>{loading ? 'Регистрация...' : 'Зарегистрироваться'}</button>
          </form>
        )}
        <div className="hint">
          <p>Тестовые аккаунты:</p>
          <p>admin@example.com / admin123</p>
          <p>seller@example.com / seller123</p>
          <p>user@example.com / user123</p>
        </div>
      </section>
    </main>
  );
}

function ProductForm({ title, value, onChange, onSubmit, submitText }) {
  return (
    <form className="panel form-grid" onSubmit={onSubmit}>
      <h2>{title}</h2>
      <Field label="Название" value={value.title} required onChange={(text) => onChange({ ...value, title: text })} />
      <Field label="Категория" value={value.category} required onChange={(text) => onChange({ ...value, category: text })} />
      <label className="field wide">
        <span>Описание</span>
        <textarea value={value.description} required onChange={(event) => onChange({ ...value, description: event.target.value })} />
      </label>
      <Field label="Цена" type="number" value={value.price} required onChange={(text) => onChange({ ...value, price: text })} />
      <button className="primary">{submitText}</button>
    </form>
  );
}

function ProductsView({ user, products, selectedProduct, loadProducts, setSelectedProduct }) {
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editForm, setEditForm] = useState(emptyProduct);
  const [detailId, setDetailId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const canEdit = user.role === 'seller' || user.role === 'admin';
  const canDelete = user.role === 'admin';

  useEffect(() => {
    if (selectedProduct) {
      setEditForm({
        title: selectedProduct.title,
        category: selectedProduct.category,
        description: selectedProduct.description,
        price: String(selectedProduct.price)
      });
      setDetailId(selectedProduct.id);
    }
  }, [selectedProduct]);

  async function createProduct(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiRequest('/api/products', {
        method: 'POST',
        body: productForm
      });
      setProductForm(emptyProduct);
      await loadProducts();
      setSuccess('Товар создан');
    } catch (error) {
      setError(error.message);
    }
  }

  async function loadProduct(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      const product = await apiRequest(`/api/products/${detailId}`);
      setSelectedProduct(product);
      setSuccess('Товар загружен');
    } catch (error) {
      setError(error.message);
    }
  }

  async function updateProduct(event) {
    event.preventDefault();
    if (!selectedProduct) {
      setError('Выберите товар для обновления');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const product = await apiRequest(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        body: editForm
      });
      setSelectedProduct(product);
      await loadProducts();
      setSuccess('Товар обновлён');
    } catch (error) {
      setError(error.message);
    }
  }

  async function deleteProduct(id) {
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/api/products/${id}`, {
        method: 'DELETE'
      });
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
      }
      await loadProducts();
      setSuccess('Товар удалён');
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section className="section-grid">
      <div className="panel wide-panel">
        <div className="section-head">
          <div>
            <h2>Товары</h2>
            <p>Просмотр списка и детальной информации доступен авторизованным пользователям.</p>
          </div>
          <button onClick={loadProducts}>Обновить</button>
        </div>
        <Message error={error} success={success} />
        <div className="cards">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div>
                <p className="muted">#{product.id} · {product.category}</p>
                <h3>{product.title}</h3>
                <p>{product.description}</p>
              </div>
              <div className="card-actions">
                <strong>{product.price} ₽</strong>
                <button onClick={() => setSelectedProduct(product)}>Открыть</button>
                {canDelete && <button className="danger" onClick={() => deleteProduct(product.id)}>Удалить</button>}
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="side-stack">
        <form className="panel form-grid" onSubmit={loadProduct}>
          <h2>Поиск по id</h2>
          <Field label="ID товара" value={detailId} required onChange={setDetailId} />
          <button>Получить товар</button>
        </form>
        {selectedProduct && (
          <div className="panel detail-card">
            <h2>{selectedProduct.title}</h2>
            <p className="muted">ID: {selectedProduct.id}</p>
            <p>{selectedProduct.description}</p>
            <p><b>Категория:</b> {selectedProduct.category}</p>
            <p><b>Цена:</b> {selectedProduct.price} ₽</p>
          </div>
        )}
        {canEdit && <ProductForm title="Создать товар" value={productForm} onChange={setProductForm} onSubmit={createProduct} submitText="Создать" />}
        {canEdit && selectedProduct && <ProductForm title="Обновить выбранный товар" value={editForm} onChange={setEditForm} onSubmit={updateProduct} submitText="Сохранить" />}
      </div>
    </section>
  );
}

function UsersView({ users, loadUsers }) {
  const [forms, setForms] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const nextForms = {};
    users.forEach((user) => {
      nextForms[user.id] = {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        isBlocked: user.isBlocked
      };
    });
    setForms(nextForms);
  }, [users]);

  function updateForm(id, field, value) {
    setForms((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value
      }
    }));
  }

  async function saveUser(id) {
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/api/users/${id}`, {
        method: 'PUT',
        body: forms[id]
      });
      await loadUsers();
      setSuccess('Пользователь обновлён');
    } catch (error) {
      setError(error.message);
    }
  }

  async function blockUser(id) {
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/api/users/${id}`, {
        method: 'DELETE'
      });
      await loadUsers();
      setSuccess('Пользователь заблокирован');
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section className="panel wide-panel">
      <div className="section-head">
        <div>
          <h2>Пользователи</h2>
          <p>Раздел доступен только администратору.</p>
        </div>
        <button onClick={loadUsers}>Обновить</button>
      </div>
      <Message error={error} success={success} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Роль</th>
              <th>Блокировка</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td><input value={forms[user.id]?.email || ''} onChange={(event) => updateForm(user.id, 'email', event.target.value)} /></td>
                <td><input value={forms[user.id]?.first_name || ''} onChange={(event) => updateForm(user.id, 'first_name', event.target.value)} /></td>
                <td><input value={forms[user.id]?.last_name || ''} onChange={(event) => updateForm(user.id, 'last_name', event.target.value)} /></td>
                <td>
                  <select value={forms[user.id]?.role || 'user'} onChange={(event) => updateForm(user.id, 'role', event.target.value)}>
                    {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                </td>
                <td>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={Boolean(forms[user.id]?.isBlocked)} onChange={(event) => updateForm(user.id, 'isBlocked', event.target.checked)} />
                    <span>{forms[user.id]?.isBlocked ? 'Да' : 'Нет'}</span>
                  </label>
                </td>
                <td className="row-actions">
                  <button onClick={() => saveUser(user.id)}>Сохранить</button>
                  <button className="danger" onClick={() => blockUser(user.id)}>Блокировать</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const canManageUsers = user?.role === 'admin';

  async function loadMe() {
    const me = await apiRequest('/api/auth/me');
    setUser(me);
    return me;
  }

  async function loadProducts() {
    const data = await apiRequest('/api/products');
    setProducts(data);
  }

  async function loadUsers() {
    if (canManageUsers || user?.role === 'admin') {
      const data = await apiRequest('/api/users');
      setUsers(data);
    }
  }

  async function boot() {
    setError('');
    setLoading(true);
    try {
      const tokens = getTokens();
      if (tokens.accessToken || tokens.refreshToken) {
        const me = await loadMe();
        const data = await apiRequest('/api/products');
        setProducts(data);
        if (me.role === 'admin') {
          const userList = await apiRequest('/api/users');
          setUsers(userList);
        }
      }
    } catch (error) {
      clearTokens();
      setUser(null);
      setProducts([]);
      setUsers([]);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    boot();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers().catch((error) => setError(error.message));
    }
  }, [user?.role]);

  async function handleLoggedIn() {
    setError('');
    try {
      const me = await loadMe();
      await loadProducts();
      if (me.role === 'admin') {
        await loadUsers();
      }
    } catch (error) {
      setError(error.message);
    }
  }

  function logout() {
    clearTokens();
    setUser(null);
    setProducts([]);
    setUsers([]);
    setSelectedProduct(null);
    setActiveTab('products');
  }

  const tabTitle = useMemo(() => {
    if (activeTab === 'users') {
      return 'Пользователи';
    }
    return 'Товары';
  }, [activeTab]);

  if (loading) {
    return <div className="loader">Загрузка приложения...</div>;
  }

  if (!user) {
    return (
      <>
        {error && <div className="global-error">{error}</div>}
        <AuthView onLoggedIn={handleLoggedIn} />
      </>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">БОСАРЕВ ЕВГЕНИЙ</p>
          <h1>{tabTitle}</h1>
        </div>
        <div className="user-box">
          <span>{user.first_name} {user.last_name}</span>
          <strong>{roleLabel(user.role)}</strong>
          <button onClick={logout}>Выйти</button>
        </div>
      </header>
      <nav className="nav-tabs">
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>Товары</button>
        {canManageUsers && <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Пользователи</button>}
      </nav>
      {error && <div className="global-error">{error}</div>}
      {activeTab === 'products' && <ProductsView user={user} products={products} selectedProduct={selectedProduct} loadProducts={loadProducts} setSelectedProduct={setSelectedProduct} />}
      {activeTab === 'users' && canManageUsers && <UsersView users={users} loadUsers={loadUsers} />}
    </div>
  );
}
