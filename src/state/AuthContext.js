import React from 'react';

export const AuthContext = React.createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(() => {
    try {
      const raw = localStorage.getItem('auth:user');
      if (raw) return JSON.parse(raw);
      const sraw = sessionStorage.getItem('auth:user');
      return sraw ? JSON.parse(sraw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = React.useState(() => {
    try {
      return (
        localStorage.getItem('auth:token') || sessionStorage.getItem('auth:token') || null
      );
    } catch { return null; }
  });

  const saveSession = (u, t, remember) => {
    setUser(u);
    setToken(t);
    try {
      const payload = JSON.stringify(u);
      const store = remember ? localStorage : sessionStorage;
      const other = remember ? sessionStorage : localStorage;
      store.setItem('auth:user', payload);
      store.setItem('auth:token', t);
      other.removeItem('auth:user');
      other.removeItem('auth:token');
    } catch {}
  };

  // Local account storage for demo (replace with API in prod)
  const readAccounts = () => {
    try { return JSON.parse(localStorage.getItem('auth:accounts') || '[]'); } catch { return []; }
  };
  const writeAccounts = (arr) => { try { localStorage.setItem('auth:accounts', JSON.stringify(arr || [])); } catch {} };

  const strongPassword = (pwd) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pwd);
  const validEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

  const signup = async ({ name, email, password, avatar }) => {
    if (!validEmail(email)) throw new Error('Invalid email format');
    if (!strongPassword(password)) throw new Error('Password must be 8+ chars incl. upper, lower, number, symbol');
    const accounts = readAccounts();
    if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists');
    }
    const u = { id: `u_${Date.now()}`, name: name || email.split('@')[0], email, avatar: avatar || null };
    const record = { ...u, password };
    writeAccounts([record, ...accounts]);
    const t = `jwt.${btoa(`${u.id}:${Date.now()}`)}.${Math.random().toString(36).slice(2)}`;
    saveSession(u, t, true);
    return u;
  };

  const login = async ({ email, password, remember = true }) => {
    const accounts = readAccounts();
    const acc = accounts.find((a) => a.email.toLowerCase() === String(email).toLowerCase());
    if (!acc || acc.password !== password) throw new Error('Invalid email or password');
    const u = { id: acc.id, name: acc.name, email: acc.email, avatar: acc.avatar || null };
    const t = `jwt.${btoa(`${u.id}:${Date.now()}`)}.${Math.random().toString(36).slice(2)}`;
    saveSession(u, t, remember);
    return u;
  };

  // Social login simulation (legacy). Prefer oauthLogin for real provider profile
  const socialLogin = async (provider) => {
    const id = `oauth_${provider}_${Date.now()}`;
    const email = `${provider}_user@example.com`;
    const u = { id, email, name: provider === 'google' ? 'Google User' : 'Apple User', avatar: null, provider };
    const t = `jwt.${btoa(`${u.id}:${Date.now()}`)}.${Math.random().toString(36).slice(2)}`;
    saveSession(u, t, true);
    return u;
  };

  // Real OAuth profile/token persister
  const oauthLogin = ({ id, name, email, avatar, provider, accessToken, remember = true }) => {
    const u = { id, name, email, avatar: avatar || null, provider };
    const t = accessToken || `jwt.${btoa(`${id}:${Date.now()}`)}.${Math.random().toString(36).slice(2)}`;
    saveSession(u, t, remember);
    return u;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('auth:user');
      sessionStorage.removeItem('auth:user');
      localStorage.removeItem('auth:token');
      sessionStorage.removeItem('auth:token');
    } catch {}
  };

  const updateUser = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        const pay = JSON.stringify(next);
        if (localStorage.getItem('auth:user')) localStorage.setItem('auth:user', pay);
        if (sessionStorage.getItem('auth:user')) sessionStorage.setItem('auth:user', pay);
      } catch {}
      return next;
    });
  };

  const value = { user, token, login, signup, socialLogin, oauthLogin, logout, updateUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}
