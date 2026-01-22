import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, CheckCircle, Search, FileText, Hash, Calendar, 
  Loader2, Activity, ShieldAlert, Users, Database 
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // 1. DYNAMIC IDENTITY DETECTION
  const userRole = localStorage.getItem('userRole') || 'Buyer';
  const userName = localStorage.getItem('userName') || 'User';

  const [activeTab, setActiveTab] = useState('All Documents');
  const [loading, setLoading] = useState(true);

  // 2. MOCK DATA FOR TRADE FLOW - Filtered by activeTab
  const [documents] = useState([
    { id: 'DOC-001', type: 'Invoice', status: 'Verified' },
    { id: 'DOC-002', type: 'Letter of Credit', status: 'Pending' },
    { id: 'DOC-003', type: 'Bill of Lading', status: 'Verified' },
    { id: 'DOC-004', type: 'Purchase Order', status: 'Verified' },
    { id: 'DOC-005', type: 'Insurance', status: 'Pending' },
  ]);

  // 3. AUTOMATIC CALCULATIONS BASED ON DATA
  const tradeStats = {
    total: documents.length,
    verified: documents.filter(d => d.status === 'Verified').length,
    withHash: documents.length,
    thisMonth: documents.length
  };

  const adminStats = {
    nodes: 142,
    blocks: "1.28M",
    tps: 14.5,
    alerts: 0
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const tabs = ['All Documents', 'Invoice', 'Letter of Credit', 'Bill of Lading', 'Purchase Order'];

  // Filter logic for content placeholder
  const filteredDocs = documents.filter(doc => 
    activeTab === 'All Documents' || doc.type === activeTab
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      
      {/* 4. ROLE-BASED GRADIENT HEADER */}
      <div className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="animate-in slide-in-from-left duration-700">
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
              Welcome back, <span className="text-white capitalize">{userName}</span>!
            </h1>
            <p className="text-white/80 font-medium text-lg">
              {userRole === 'Admin' && "System Overseer: Monitoring blockchain network health and audit trails."}
              {userRole === 'Buyer' && "Procurement: Manage purchase orders and verify incoming trade assets."}
              {userRole === 'Seller' && "Trade Sales: Upload invoices and track secure payment verification."}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 animate-in slide-in-from-right duration-700">
            {userRole !== 'Admin' && (
              <button 
                onClick={() => navigate('/upload')}
                className="bg-[#f472b6] hover:bg-[#ec4899] text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <Plus size={20} />
                {userRole === 'Seller' ? 'New Invoice' : 'New Order'}
              </button>
            )}
            <button 
              onClick={() => navigate('/integrity-status')}
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <CheckCircle size={20} />
              Verify Documents
            </button>
          </div>
        </div>
      </div>

      {/* 5. DYNAMIC STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {userRole === 'Admin' ? (
          <>
            <StatCard label="ACTIVE NODES" value={adminStats.nodes} color="bg-blue-600" icon={<Activity />} loading={loading} />
            <StatCard label="TOTAL BLOCKS" value={adminStats.blocks} color="bg-slate-800" icon={<Database />} loading={loading} />
            <StatCard label="TPS SPEED" value={adminStats.tps} color="bg-indigo-600" icon={<Users />} loading={loading} />
            <StatCard label="RISK ALERTS" value={adminStats.alerts} color="bg-red-500" icon={<ShieldAlert />} loading={loading} />
          </>
        ) : (
          <>
            <StatCard label="MY DOCUMENTS" value={tradeStats.total} color="bg-blue-600" icon={<FileText />} loading={loading} />
            <StatCard label="VERIFIED" value={tradeStats.verified} color="bg-emerald-500" icon={<CheckCircle />} loading={loading} />
            <StatCard label="WITH HASH" value={tradeStats.withHash} color="bg-purple-600" icon={<Hash />} loading={loading} />
            <StatCard label="THIS MONTH" value={tradeStats.thisMonth} color="bg-orange-500" icon={<Calendar />} loading={loading} />
          </>
        )}
      </div>

      {/* 6. WORKFLOW TAB SYSTEM */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-4 border-b border-slate-200 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 whitespace-nowrap font-bold text-sm rounded-xl transition-all duration-200 ${
                activeTab === tab 
                ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-200 -translate-y-1' 
                : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="relative group w-full lg:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab.toLowerCase()}...`} 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-medium text-sm"
          />
        </div>
      </div>

      {/* 7. RECENT ACTIVITY AREA */}
      <div className="bg-white rounded-[2.5rem] p-20 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-1000">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Database size={40} className="text-slate-300" />
        </div>
        <h3 className="text-2xl font-extrabold text-slate-800">
          {filteredDocs.length > 0 ? `${filteredDocs.length} ${activeTab} Records Ready` : `No ${userRole === 'Admin' ? 'System Anomalies' : activeTab} Available`}
        </h3>
        <p className="text-slate-400 max-w-sm mx-auto mt-3 font-medium">
          {userRole === 'Admin' 
            ? "Your blockchain network is currently healthy with no recent alerts."
            : filteredDocs.length > 0 
              ? `You have ${filteredDocs.length} ${activeTab.toLowerCase()} files secured on the ledger.`
              : `Your blockchain-secured ${activeTab.toLowerCase()} records will appear here once verified.`}
        </p>
        {filteredDocs.length > 0 && userRole !== 'Admin' && (
            <button 
              onClick={() => navigate('/documents')}
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
                View Repository
            </button>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, icon, loading }) => (
  <div className={`${color} p-8 rounded-[2rem] text-white shadow-lg relative overflow-hidden group hover:translate-y-[-8px] transition-all duration-300 animate-in zoom-in-95`}>
    <div className="absolute right-[-5%] bottom-[-5%] opacity-20 group-hover:scale-125 transition-transform duration-500">
      {React.cloneElement(icon, { size: 90 })}
    </div>
    <p className="text-[10px] font-black opacity-80 tracking-widest uppercase mb-2">{label}</p>
    <div className="text-5xl font-black flex items-center gap-2">
      {loading ? <Loader2 className="animate-spin" size={24} /> : value}
    </div>
  </div>
);

export default Dashboard;