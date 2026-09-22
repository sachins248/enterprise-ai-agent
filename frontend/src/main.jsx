// StrictMode helps find mistakes while developing
import { StrictMode } from 'react'
// The function that starts a React app in the browser
import { createRoot } from 'react-dom/client'
// Load the global styles
import './index.css'
// Load the main App component
import App from './App.jsx'

// Find the empty box in index.html and start React inside it
createRoot(document.getElementById('root')).render(
  // Wrap the app in StrictMode
  <StrictMode>
    {/* Show the whole app */}
    <App />
  </StrictMode>,
)
