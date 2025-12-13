import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-4 border-b p-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">SocialFlow</h1>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
}
