# Контрольная работа №2

Босарев Евгений, ЭФБО-11-24

## Что реализовано

- Node.js + Express API
- React + Vite frontend
- Регистрация и вход по email
- bcrypt-хеширование паролей
- JWT access-токены и refresh-токены
- Обновление токенов через `POST /api/auth/refresh`
- Роли: `user`, `seller`, `admin`
- Управление товарами
- Управление пользователями для администратора

## Запуск

```Terminal
npm install
cd client
npm install
cd ..
npm run server
```

Во втором терминале:

```Terminal
npm run client
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3000`

## Тестовые аккаунты

`admin@example.com` / `admin123`
`seller@example.com` / `seller123`
`user@example.com` / `user123`
