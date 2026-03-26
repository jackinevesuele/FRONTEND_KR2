import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from './api';
import { useAuth } from './AuthContext';

export function ProductView() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    productsAPI
      .getById(id)
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Удалить товар?')) return;
    try {
      await productsAPI.delete(id);
      navigate('/products');
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!product) return <div>Товар не найден</div>;

  const canEdit = user && ['seller', 'admin'].includes(user.role);
  const canDelete = user && user.role === 'admin';

  return (
    <div className="product-view">
      <h2>{product.title}</h2>
      <p><strong>ID:</strong> {product.id}</p>
      <p><strong>Категория:</strong> {product.category}</p>
      <p><strong>Описание:</strong> {product.description}</p>
      <p><strong>Цена:</strong> {product.price} ₽</p>
      <div className="actions">
        <button onClick={() => navigate('/products')}>Назад</button>
        {canEdit && <button onClick={() => navigate(`/products/${id}/edit`)}>Редактировать</button>}
        {canDelete && <button onClick={handleDelete} className="btn-delete">Удалить</button>}
      </div>
    </div>
  );
}
