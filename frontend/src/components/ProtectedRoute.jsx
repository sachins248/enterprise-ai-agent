import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route so only authenticated users can access it.
 * If there's no token in memory, redirect to /login.
 *
 * Usage:
 *   <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}
