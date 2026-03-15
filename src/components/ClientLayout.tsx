'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from "@/components/Navigation";
import { PWAInstall } from "@/components/PWAInstall";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Páginas que NÃO devem ter a Sidebar nem a margem lateral
  const isPublicPage = pathname === '/login' || pathname === '/register';

  return (
    <body 
      className={`antialiased min-h-screen text-gray-100 overflow-x-hidden ${
        isPublicPage ? 'bg-[#0a0a0a]' : 'bg-[#121212] flex flex-col lg:flex-row'
      }`} 
      suppressHydrationWarning
    >
      {!isPublicPage && <Navbar />}
      
      <main className={`min-h-screen ${isPublicPage ? 'w-full' : 'flex-1 lg:ml-72'}`}>
        <div className={isPublicPage ? "w-full min-h-screen" : "max-w-[1600px] mx-auto"}>
          {children}
        </div>
      </main>
      
      <PWAInstall />
    </body>
  );
}
