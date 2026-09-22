// The React tools we need to share login info between pages
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

// Make a shared "box" where we keep the login info
const AuthContext = createContext(null);

// Decode the JWT payload (base64url → JSON) to extract userId, email, role.
// We don't verify the signature here — the backend does that on every request.
// Reads the user info out of a token
function decodeToken(token) {
  // Decoding can fail with a bad token, so we use try
  try {
    // A token has 3 parts split by dots; the 2nd part holds the user info
    const payload = token.split('.')[1];
    // Turn the URL-safe text into normal base64, then decode it into text
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    // Turn the text into an object
    return JSON.parse(json);
  } catch {
    // If anything goes wrong, say there is no info
    return null;
  }
}

// The component that keeps the login info and shares it with the app
export function AuthProvider({ children }) {
  // The token (empty when logged out)
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);  // { userId, email, role }

  // Called after a successful login or register
  function login(accessToken) {
    // Read the user info out of the token
    const claims = decodeToken(accessToken);
    // If the token is unreadable, do nothing
    if (!claims) return;
    // Remember the token so we can send it with requests
    setToken(accessToken);
    // Remember who the user is
    setUser({
      // The user's id
      userId: claims.userId,
      // The email is stored in the "sub" part of the token
      email: claims.sub,
      role: claims.role,    // "ADMIN", "DEVELOPER", or "VIEWER"
    });
  }

  // Called when the user signs out
  function logout() {
    // Forget the token
    setToken(null);
    // Forget the user
    setUser(null);
  }

  return (
    // Share the token, user and functions with everything inside
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {/* The rest of the app */}
      {children}
    </AuthContext.Provider>
  );
}

// A shortcut so components can read the login info with one line
export function useAuth() {
  // Give back whatever the provider shared
  return useContext(AuthContext);
}
