import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileStack, 
  UploadCloud, 
  Database, 
  History, 
  ShieldAlert, 
  LogOut,
  ShieldCheck
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  
  // 1. DYNAMIC ROLE DETECTION: Pulls the role saved during login
  const userRole = localStorage.getItem('userRole') || 'Buyer';

  // 2. MASTER MENU CONFIGURATION: Defined by role restrictions
  const allMenuItems = [
    { 
      name: 'Dashboard', 
      icon: <LayoutDashboard size={20} />, 
      path: '/dashboard',
      roles: ['Admin', 'Buyer', 'Seller'] 
    },
    { 
      name: 'Documents', 
      icon: <FileStack size={20} />, 
      path: '/documents',
      roles: ['Buyer', 'Seller'] // Admins focus on system logs
    },
    { 
      name: 'Upload Document', 
      icon: <UploadCloud size={20} />, 
      path: '/upload',
      roles: ['Buyer', 'Seller'] // Only trade participants can upload
    },
    { 
      name: 'Ledger Explorer', 
      icon: <Database size={20} />, 
      path: '/ledger',
      roles: ['Admin', 'Buyer', 'Seller'] // Shared transparency tool
    },
    { 
      name: 'Audit Logs', 
      icon: <History size={20} />, 
      path: '/audit',
      roles: ['Admin'] // Primary administrative monitoring
    },
    { 
      name: 'Risk Analysis', 
      icon: <ShieldAlert size={20} />, 
      path: '/risk-analysis',
      roles: ['Admin', 'Buyer'] // High-level security oversight
    },
    { 
      name: 'Security Status', 
      icon: <ShieldCheck size={20} />, 
      path: '/integrity-status',
      roles: ['Admin'] // Advanced system verification
    },
  ];

  // 3. ROLE-BASED FILTERING: Only shows relevant tools for the current session
  const filteredMenuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  // 4. SECURE SIGN OUT: Clears session identity to prevent role overlap
  const handleSignOut = () => {
    localStorage.clear(); 
    navigate('/login', { replace: true });
    window.location.reload();
  };

  return (
    <aside className="w-64 h-full bg-[#0f172a] text-slate-300 flex flex-col transition-all duration-300 border-r border-slate-800">
      
      {/* Branding Section */}
      <div className="p-8 flex items-center gap-3">
        <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
          C
        </div>
        <span className="text-xl font-bold text-white tracking-tight">ChainDocs</span>
      </div>

      {/* Dynamic Navigation Section */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-sidebar-scroll">
        <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 opacity-60">
          Main Menu — {userRole}
        </p>
        
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200
              ${isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 translate-x-1' 
                : 'hover:bg-slate-800 hover:text-white'}
            `}
          >
            {item.icon}
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Sign Out Section */}
      <div className="p-6 border-t border-slate-800">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-4 px-4 py-4 w-full rounded-2xl text-slate-400 font-bold hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 group"
        >
          <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;