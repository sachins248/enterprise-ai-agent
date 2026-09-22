// Tools for choosing which page to show for each URL
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Gives every page access to the login information
import { AuthProvider } from './context/AuthContext';
// Gives every page access to the light/dark theme
import { ThemeProvider } from './context/ThemeContext';
// Blocks pages from people who are not logged in
import ProtectedRoute from './components/ProtectedRoute';
// The frame (sidebar + content area) around the logged-in pages
import Layout from './components/Layout';
// The login page
import Login from './pages/Login';
// The register page
import Register from './pages/Register';
// The chat page
import Chat from './pages/Chat';
// The chat history page
import Sessions from './pages/Sessions';
// The analytics dashboard page
import Dashboard from './pages/Dashboard';

// The main component: it decides which page shows for each URL
export default function App() {
  return (
    // Theme must be available on /login and /register too, which sit
    // outside the authenticated layout — so it wraps AuthProvider, not
    // the other way around.
    <ThemeProvider>
      {/* Share the login information with every page inside */}
      <AuthProvider>
        {/* Turn on URL-based page switching */}
        <BrowserRouter>
          {/* The list of pages */}
          <Routes>
            {/* Public routes */}
            {/* Anyone can open the login page */}
            <Route path="/login"    element={<Login />} />
            {/* Anyone can open the register page */}
            <Route path="/register" element={<Register />} />

            {/* Protected routes — Layout provides sidebar + full-height container */}
            {/* Chat page: only logged-in users, inside the layout */}
            <Route path="/chat"      element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
            {/* History page: only logged-in users, inside the layout */}
            <Route path="/sessions"  element={<ProtectedRoute><Layout><Sessions /></Layout></ProtectedRoute>} />
            {/* Dashboard page: only logged-in users, inside the layout */}
            <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />

            {/* Default redirect */}
            {/* Any other URL goes to the login page */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
