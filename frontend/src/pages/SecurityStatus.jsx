import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Zap, 
  Database, 
  RefreshCcw,
  Activity
} from 'lucide-react';
import { documentApi } from '../api'; 

const SecurityStatus = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetchRealData = async () => {
    setIsRefreshing(true);
    try {
      const response = await documentApi.getAll();
      setDocuments(response.data || []);
    } catch (err) {
      console.error("Failed to fetch real document data", err);
      setDocuments([]); 
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* 1. Header with Refresh functionality */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Integrity Status</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time monitoring of blockchain network and document immutability</p>
        </div>
        <button 
          onClick={fetchRealData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <RefreshCcw size={18} className={isRefreshing ? "animate-spin" : ""} />
          Refresh Network Data
        </button>
      </div>

      {/* 2. Dynamic Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard 
          label="NETWORK HEALTH" 
          value="99.9% Secure" 
          icon={<ShieldCheck className="text-emerald-500" />} 
          bg="bg-emerald-50/50" 
        />
        <StatusCard 
          label="ENCRYPTED DOCS" 
          value={`${documents.length} Files`} 
          icon={<Lock className="text-blue-500" />} 
          bg="bg-blue-50/50" 
        />
        <StatusCard 
          label="GLOBAL LATENCY" 
          value="22ms" 
          icon={<Zap className="text-purple-500" />} 
          bg="bg-purple-50/50" 
        />
      </div>

      {/* 3. Full-Width Blockchain Nodes Monitor */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <Database className="text-blue-600" size={24} />
          <h3 className="text-2xl font-extrabold text-slate-800">Blockchain Nodes</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <NodeItem name="Ethereum Mainnet" block="19823451" latency="12ms" status="CONNECTED" color="emerald" />
          <NodeItem name="IPFS Storage Node" block="N/A" latency="45ms" status="ACTIVE" color="emerald" />
          <NodeItem name="ChainDocs Validator" block="19823449" latency="8ms" status="SYNCING" color="orange" />
        </div>
      </div>
    </div>
  );
};

// Reusable Sub-components
const StatusCard = ({ label, value, icon, bg }) => (
  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center gap-6 group hover:shadow-md transition-all">
    <div className={`p-4 rounded-2xl ${bg}`}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const NodeItem = ({ name, block, latency, status, color }) => (
  <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-blue-200 transition-all">
    <div className="flex items-center gap-4">
      <div className={`w-2.5 h-2.5 rounded-full bg-${color}-500 shadow-[0_0_8px] shadow-${color}-500/50`} />
      <div>
        <p className="font-bold text-slate-800 text-lg">{name}</p>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Current Block: {block}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-bold text-slate-800">{latency}</p>
      <p className={`text-xs font-black text-${color}-600 tracking-widest uppercase`}>{status}</p>
    </div>
  </div>
);

export default SecurityStatus;