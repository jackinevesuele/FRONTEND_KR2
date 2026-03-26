import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from './api';
import { useAuth } from './AuthContext';

export function Products() {
  const [products, setProducts] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await productsAPI.getAll();
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить товар?')) return;
    try {
      await productsAPI.delete(id);
      loadProducts();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const canManage = user && ['seller', 'admin'].includes(user.role);
  const canDelete = user && user.role === 'admin';

  return (
    <div className="products">
      <div className="header">
        <h2>Товары</h2>
        {canManage && <Link to="/products/new" className="btn">Добавить товар</Link>}
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Категория</th>
            <th>Цена</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.title}</td>
              <td>{p.category}</td>
              <td>{p.price} ₽</td>
              <td>
                <Link to={`/products/${p.id}`}>Просмотр</Link>
                {canManage && (
                  <>
                    {' '}
                    <Link to={`/products/${p.id}/edit`}>Ред.</Link>
                  </>
                )}
                {canDelete && (
                  <>
                    {' '}
                    <button onClick={() => handleDelete(p.id)} className="btn-delete">
                      Удалить
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
