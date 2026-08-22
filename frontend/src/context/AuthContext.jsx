import { createContext, useContext, useState } from 'react';

/**
 * AuthContext — stores the JWT access token and parsed user info in React state.
 *
 * WHY NOT localStorage?
 * localStorage is accessible to any JavaScript on the page, including injected
 * scripts via XSS attacks. A token in localStorage can be silently stolen.
 * Keeping the token in React state (memory) means it disappears on page refresh
 * and is never accessible outside this app's JS execution context.
 *
 * The tradeoff: the user must log in again after a page refresh. For an enterprise
 * internal tool, this is the correct security tradeoff.
 */

const AuthContext = createContext(null);

// Decode the JWT payload (base64url → JSON) to extract userId, email, role.
// We don't verify the signature here — the backend does that on every request.
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);  // { userId, email, role }

  function login(accessToken) {
    const claims = decodeToken(accessToken);
    if (!claims) return;
    setToken(accessToken);
    setUser({
      userId: claims.userId,
      email: claims.sub,
      role: claims.role,    // "ADMIN", "DEVELOPER", or "VIEWER"
    });
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
