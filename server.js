const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const ACCESS_SECRET = process.env.ACCESS_SECRET || 'access_secret_key_2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh_secret_key_2026';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';
const roles = ['user', 'seller', 'admin'];
const refreshTokens = new Set();
let userIdCounter = 4;
let productIdCounter = 4;

const users = [
  {
    id: '1',
    email: 'admin@example.com',
    first_name: 'Евгений',
    last_name: 'Босарев',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    isBlocked: false
  },
  {
    id: '2',
    email: 'seller@example.com',
    first_name: 'Иван',
    last_name: 'Продавцов',
    passwordHash: bcrypt.hashSync('seller123', 10),
    role: 'seller',
    isBlocked: false
  },
  {
    id: '3',
    email: 'user@example.com',
    first_name: 'Анна',
    last_name: 'Покупатель',
    passwordHash: bcrypt.hashSync('user123', 10),
    role: 'user',
    isBlocked: false
  }
];

const products = [
  {
    id: '1',
    title: 'Ноутбук',
    category: 'Электроника',
    description: 'Ноутбук для учебы и работы',
    price: 75000
  },
  {
    id: '2',
    title: 'Смартфон',
    category: 'Электроника',
    description: 'Смартфон с большим экраном',
    price: 42000
  },
  {
    id: '3',
    title: 'Клавиатура',
    category: 'Периферия',
    description: 'Беспроводная клавиатура',
    price: 4500
  }
];

app.use(cors());
app.use(express.json());

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) {
    return token;
  }
  return null;
}

function findUserById(id) {
  return users.find((user) => user.id === String(id));
}

function findProductById(id) {
  return products.find((product) => product.id === String(id));
}

function userDto(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    isBlocked: user.isBlocked
  };
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    ACCESS_SECRET,
    {
      expiresIn: ACCESS_EXPIRES_IN
    }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    REFRESH_SECRET,
    {
      expiresIn: REFRESH_EXPIRES_IN
    }
  );
}

function authMiddleware(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    const user = findUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: 'User is blocked' });
    }
    req.user = {
      sub: user.id,
      email: user.email,
      role: user.role
    };
    req.currentUser = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

function requireFields(body, fields) {
  return fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
}

app.get('/api/info', (req, res) => {
  res.json({
    student: 'Босарев Евгений',
    group: 'ЭФБО-11-24',
    work: 'Контрольная работа №2'
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, first_name, last_name, role } = req.body;
  const missingFields = requireFields(req.body, ['email', 'password', 'first_name', 'last_name']);
  if (missingFields.length > 0) {
    return res.status(400).json({ error: `${missingFields.join(', ')} are required` });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (users.some((user) => user.email === normalizedEmail)) {
    return res.status(409).json({ error: 'email already exists' });
  }
  const selectedRole = role || 'user';
  if (!roles.includes(selectedRole)) {
    return res.status(400).json({ error: 'role must be user, seller or admin' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: String(userIdCounter++),
    email: normalizedEmail,
    first_name,
    last_name,
    passwordHash,
    role: selectedRole,
    isBlocked: false
  };
  users.push(user);
  return res.status(201).json(userDto(user));
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const missingFields = requireFields(req.body, ['email', 'password']);
  if (missingFields.length > 0) {
    return res.status(400).json({ error: `${missingFields.join(', ')} are required` });
  }
  const user = users.find((item) => item.email === String(email).trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (user.isBlocked) {
    return res.status(403).json({ error: 'User is blocked' });
  }
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  refreshTokens.add(refreshToken);
  return res.json({ accessToken, refreshToken });
});

app.post('/api/auth/refresh', (req, res) => {
  const refreshToken = getBearerToken(req) || req.headers['x-refresh-token'] || req.body.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({ error: 'refresh token is required in headers' });
  }
  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = findUserById(payload.sub);
    if (!user) {
      refreshTokens.delete(refreshToken);
      return res.status(401).json({ error: 'User not found' });
    }
    if (user.isBlocked) {
      refreshTokens.delete(refreshToken);
      return res.status(403).json({ error: 'User is blocked' });
    }
    refreshTokens.delete(refreshToken);
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);
    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    refreshTokens.delete(refreshToken);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  return res.json(userDto(req.currentUser));
});

app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  return res.json(users.map(userDto));
});

app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json(userDto(user));
});

app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { email, first_name, last_name, role, isBlocked, password } = req.body;
  if (email !== undefined) {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'email cannot be empty' });
    }
    if (users.some((item) => item.email === normalizedEmail && item.id !== user.id)) {
      return res.status(409).json({ error: 'email already exists' });
    }
    user.email = normalizedEmail;
  }
  if (first_name !== undefined) {
    user.first_name = first_name;
  }
  if (last_name !== undefined) {
    user.last_name = last_name;
  }
  if (role !== undefined) {
    if (!roles.includes(role)) {
      return res.status(400).json({ error: 'role must be user, seller or admin' });
    }
    user.role = role;
  }
  if (isBlocked !== undefined) {
    user.isBlocked = Boolean(isBlocked);
  }
  if (password !== undefined && password !== '') {
    user.passwordHash = await bcrypt.hash(password, 10);
  }
  return res.json(userDto(user));
});

app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  user.isBlocked = true;
  return res.json({ message: 'User blocked', user: userDto(user) });
});

app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
  const missingFields = requireFields(req.body, ['title', 'category', 'description', 'price']);
  if (missingFields.length > 0) {
    return res.status(400).json({ error: `${missingFields.join(', ')} are required` });
  }
  const price = Number(req.body.price);
  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }
  const product = {
    id: String(productIdCounter++),
    title: req.body.title,
    category: req.body.category,
    description: req.body.description,
    price
  };
  products.push(product);
  return res.status(201).json(product);
});

app.get('/api/products', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  return res.json(products);
});

app.get('/api/products/:id', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  return res.json(product);
});

app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const { title, category, description, price } = req.body;
  if (title !== undefined) {
    product.title = title;
  }
  if (category !== undefined) {
    product.category = category;
  }
  if (description !== undefined) {
    product.description = description;
  }
  if (price !== undefined) {
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'price must be a positive number' });
    }
    product.price = parsedPrice;
  }
  return res.json(product);
});

app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
  const index = products.findIndex((product) => product.id === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const [deletedProduct] = products.splice(index, 1);
  return res.json({ message: 'Product deleted', product: deletedProduct });
});

app.use((req, res) => {
  return res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
