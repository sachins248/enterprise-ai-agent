// The sidebar on the left side
import Sidebar from './Sidebar';

// The frame around every logged-in page: sidebar on the left, page on the right
export default function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col bg-bg">
        {children}
      </main>
    </div>
  );
}
