import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  return (
    /* h-screen prevents the page from expanding past the window height */
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
      
      {/* 1. SIDEBAR: Fixed width (w-64 = 256px) */}
      <div className="w-64 flex-shrink-0 z-50">
        <Sidebar />
      </div>

      {/* 2. MAIN CONTENT AREA: Use flex-1 to take remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar stays fixed at the top of this section */}
        <Navbar />

        {/* Scrollable Dashboard area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;