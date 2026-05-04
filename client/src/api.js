const API_BASE = import.meta.env.VITE_API_URL || '';

export function getTokens() {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken')
  };
}

export function setTokens(tokens) {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

async function refreshPair() {
  const { refreshToken } = getTokens();
  if (!refreshToken) {
    throw new Error('Нет refresh-токена');
  }
  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${refreshToken}`
    }
  });
  const data = await parseResponse(response);
  if (!response.ok) {
    clearTokens();
    throw new Error(data?.error || 'Не удалось обновить токены');
  }
  setTokens(data);
  return data;
}

export async function apiRequest(path, options = {}, retry = true) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const { accessToken } = getTokens();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const requestOptions = {
    ...options,
    headers
  };
  if (requestOptions.body && typeof requestOptions.body !== 'string') {
    requestOptions.body = JSON.stringify(requestOptions.body);
  }
  const response = await fetch(`${API_BASE}${path}`, requestOptions);
  if (response.status === 401 && retry) {
    await refreshPair();
    return apiRequest(path, options, false);
  }
  const data = await parseResponse(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Ошибка запроса');
  }
  return data;
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  const data = await parseResponse(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Ошибка входа');
  }
  setTokens(data);
  return data;
}

export async function register(payload) {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await parseResponse(response);
  if (!response.ok) {
    throw new Error(data?.error || 'Ошибка регистрации');
  }
  return data;
}
