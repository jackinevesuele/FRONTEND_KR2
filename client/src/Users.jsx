import { useState, useEffect } from 'react';
import { usersAPI } from './api';
import { useAuth } from './AuthContext';

export function Users() {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlock = async (id) => {
    if (!confirm('Заблокировать пользователя?')) return;
    try {
      await usersAPI.delete(id);
      loadUsers();
    } catch (err) {
      alert('Ошибка блокировки');
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setEditData({ ...user });
  };

  const handleSave = async (id) => {
    try {
      await usersAPI.update(id, editData);
      setEditingId(null);
      loadUsers();
    } catch (err) {
      alert('Ошибка сохранения');
    }
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  return (
    <div className="users">
      <h2>Пользователи</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Имя</th>
            <th>Фамилия</th>
            <th>Роль</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>
                {editingId === u.id ? (
                  <input name="email" value={editData.email} onChange={handleChange} />
                ) : (
                  u.email
                )}
              </td>
              <td>
                {editingId === u.id ? (
                  <input name="first_name" value={editData.first_name} onChange={handleChange} />
                ) : (
                  u.first_name
                )}
              </td>
              <td>
                {editingId === u.id ? (
                  <input name="last_name" value={editData.last_name} onChange={handleChange} />
                ) : (
                  u.last_name
                )}
              </td>
              <td>
                {editingId === u.id ? (
                  <select name="role" value={editData.role} onChange={handleChange}>
                    <option value="user">Пользователь</option>
                    <option value="seller">Продавец</option>
                    <option value="admin">Администратор</option>
                  </select>
                ) : (
                  u.role
                )}
              </td>
              <td>{u.isBlocked ? 'Заблокирован' : 'Активен'}</td>
              <td>
                {editingId === u.id ? (
                  <>
                    <button onClick={() => handleSave(u.id)}>Сохранить</button>
                    <button onClick={() => setEditingId(null)}>Отмена</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(u)}>Ред.</button>
                    {!u.isBlocked && currentUser.id !== u.id && (
                      <button onClick={() => handleBlock(u.id)} className="btn-delete">
                        Заблокировать
                      </button>
                    )}
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
