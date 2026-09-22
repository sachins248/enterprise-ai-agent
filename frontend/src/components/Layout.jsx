// The sidebar on the left side
import Sidebar from './Sidebar';

// The frame around every logged-in page: sidebar on the left, page on the right
export default function Layout({ children }) {
  return (
    // The outer box: side by side, full screen height, no page scrolling
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* The sidebar */}
      <Sidebar />
      {/* The main area that holds the page */}
      <main style={{
        // Take all the space that the sidebar leaves
        flex: 1,
        // The page scrolls inside itself, not the whole window
        overflow: 'hidden',
        // Stack the page content from top to bottom
        display: 'flex',
        flexDirection: 'column',
        // Use the app's background color
        background: 'var(--bg)',
      }}>
        {/* The page itself (chat, history or dashboard) */}
        {children}
      </main>
    </div>
  );
}
