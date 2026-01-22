import "./App.css";

/**
 * Navbar Component: Manages role-based sidebar navigation.
 * Integrated with the centralized Dashboard state.
 */
export default function Navbar({ userRole, setView, currentView }) {
  
  // Role-Based Logic for granular UI access
  const isAdmin = userRole?.toLowerCase() === 'admin';
  const isCorporate = userRole?.toLowerCase() === 'buyer' || userRole?.toLowerCase() === 'seller';
  const isBank = userRole?.toLowerCase() === 'bank';

  // Helper to apply active styles based on current view
  const getBtnClass = (viewName) => 
    `nav-item w-full flex items-center gap-3 transition-all ${
      currentView === viewName ? "active text-blue-400" : "opacity-60 hover:opacity-100"
    }`;

  return (
    <nav className="sidebar h-screen sticky top-0 flex flex-col">
      {/* 1. Branding Section */}
      <div className="sidebar-brand flex items-center gap-3 mb-10 px-2">
        <div className="avatar !bg-blue-600 !rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-blue-900/40 font-bold">
          C
        </div>
        <div className="brand-info">
          <h1 className="text-xl font-bold text-white tracking-tight">ChainDocs</h1>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block">
            Blockchain Platform
          </span>
        </div>
      </div>

      {/* 2. Primary Navigation Links */}
      <div className="nav-group flex flex-col gap-2">
        <button className={getBtnClass("dashboard")} onClick={() => setView("dashboard")}>
          <span className="text-lg">🏠</span> <span>Dashboard</span>
        </button>
        
        {/* Only shown for Buyer/Seller roles */}
        {isCorporate && (
          <button className={getBtnClass("trades")} onClick={() => setView("trades")}>
            <span className="text-lg">⇅</span> <span>My Trades</span>
          </button>
        )}
        
        <button className={getBtnClass("documents")} onClick={() => setView("documents")}>
          <span className="text-lg">📄</span> <span>Documents</span>
        </button>

        {/* Corporate users can issue assets; Admin audits them */}
        {isCorporate && (
          <button className={getBtnClass("upload")} onClick={() => setView("upload")}>
            <span className="text-lg">📤</span> <span>Upload Asset</span>
          </button>
        )}
      </div>

      {/* 3. Advanced Tools - Restricted to Admins & Banks */}
      {(isAdmin || isBank) && (
        <div className="nav-group mt-10">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">
            Audit & Verification
          </p>
          
          <button className={getBtnClass("ledger")} onClick={() => setView("ledger")}>
            <span className="text-lg">⚙️</span> <span>Ledger Explorer</span>
          </button>

          <button className={getBtnClass("integrity")} onClick={() => setView("integrity")}>
            <span className="text-lg">🛡️</span> <span>Integrity Status</span>
          </button>

          <button className={getBtnClass("risk")} onClick={() => setView("risk")}>
            <span className="text-lg">📈</span> <span>Risk Analysis</span>
          </button>
        </div>
      )}

      {/* Branding Footer (Optional, since Logout moved to Top Header) */}
      <div className="mt-auto pb-6 px-4">
        <p className="text-[9px] text-slate-600 uppercase tracking-widest text-center">
          © 2026 ChainDocs Node v1.5
        </p>
      </div>
    </nav>
  );
}