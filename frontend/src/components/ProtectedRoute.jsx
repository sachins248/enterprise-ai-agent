// Lets us send the user to another page
import { Navigate } from 'react-router-dom';
// Lets us read the login information
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route so only authenticated users can access it.
 * If there's no token in memory, redirect to /login.
 *
 * Usage:
 *   <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
 */
// Shows the page only if the user is logged in
export default function ProtectedRoute({ children }) {
  // Get the token (it is empty when nobody is logged in)
  const { token } = useAuth();
  // If there is a token show the page, otherwise go to the login page
  return token ? children : <Navigate to="/login" replace />;
}
