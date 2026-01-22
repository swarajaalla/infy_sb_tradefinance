import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

const Navbar = () => {
  // 1. Dynamic Data Retrieval from LocalStorage
  const userName = localStorage.getItem('userName') || 'Guest';
  const userRole = localStorage.getItem('userRole') || 'Viewer';
  const userEmail = localStorage.getItem('userEmail') || 'not-signed-in@example.com';

  // Get the first letter for the profile avatar
  const initial = userName.charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-3">
      <div className="flex justify-between items-center">
        
        {/* Left Side: Page Context */}
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
            Trade Finance Explorer
          </h2>
        </div>

        {/* Right Side: Search, Notifications, and Dynamic Profile */}
        <div className="flex items-center gap-6">
          {/* Quick Search */}
          <div className="hidden md:flex items-center bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5 group focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search platform..." 
              className="bg-transparent outline-none text-xs text-gray-600 ml-2 w-40"
            />
          </div>

          {/* Notification Icon */}
          <button className="relative p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {/* Profile Section - Now Fully Dynamic */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2 justify-end">
                {/* Dynamically changes color based on role: Admin (Purple), Others (Emerald) */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                  userRole === 'Admin' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {userRole}
                </span>
                <p className="text-sm font-bold text-gray-800 capitalize">{userName}</p>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">{userEmail}</p>
            </div>
            
            {/* Dynamic Avatar */}
            <div className="relative group cursor-pointer">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-transform active:scale-95 ${
                userRole === 'Admin' ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-600 shadow-blue-200'
              }`}>
                {initial}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full border border-gray-100 shadow-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              </div>
            </div>
            
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;