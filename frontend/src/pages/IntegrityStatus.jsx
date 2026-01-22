import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Lock, 
  RefreshCw, 
  CheckCircle, 
  Database,
  Search
} from 'lucide-react';

const IntegrityStatus = () => {
  const nodes = [
    { name: 'Ethereum Mainnet', status: 'Connected', latency: '12ms', block: '19823451' },
    { name: 'IPFS Storage Node', status: 'Active', latency: '45ms', block: 'N/A' },
    { name: 'ChainDocs Validator', status: 'Syncing', latency: '8ms', block: '19823449' },
  ];

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Integrity Status</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time monitoring of blockchain network and document immutability</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </div>

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600">
            <ShieldCheck size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Network Health</p>
            <p className="text-xl font-bold text-gray-800">99.9% Secure</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="bg-blue-100 p-4 rounded-2xl text-blue-600">
            <Lock size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Encrypted Docs</p>
            <p className="text-xl font-bold text-gray-800">4,281 Files</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="bg-purple-100 p-4 rounded-2xl text-purple-600">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Latency</p>
            <p className="text-xl font-bold text-gray-800">22ms</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Node Connectivity Table */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Database className="text-blue-500" size={20} />
            Blockchain Nodes
          </h3>
          <div className="space-y-4">
            {nodes.map((node) => (
              <div key={node.name} className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${node.status === 'Syncing' ? 'bg-orange-400 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{node.name}</p>
                    <p className="text-[11px] text-gray-400 uppercase tracking-tighter">Current Block: {node.block}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-700">{node.latency}</p>
                  <p className={`text-[11px] font-bold uppercase ${node.status === 'Syncing' ? 'text-orange-500' : 'text-emerald-600'}`}>
                    {node.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Activity Sidebar */}
        <div className="bg-[#0f172a] rounded-[2.5rem] p-8 text-white shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <CheckCircle className="text-emerald-400" size={20} />
            Live Verifications
          </h3>
          <div className="space-y-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="relative pl-6 border-l border-white/10 pb-6 last:pb-0">
                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Success</p>
                <p className="text-sm font-medium text-gray-300">LC_22901 Verified Successfully</p>
                <p className="text-[10px] text-gray-500 mt-1 font-mono">Tx: 0x9f...3e21</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
            View Audit Explorer
          </button>
        </div>

      </div>
    </div>
  );
};

export default IntegrityStatus;