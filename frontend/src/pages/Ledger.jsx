import React, { useState, useEffect } from 'react';
import { 
  Database, Search, ExternalLink, Clock, RefreshCcw, Activity 
} from 'lucide-react';
import { documentApi } from '../api'; // Centralized API connection

const Ledger = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 1. DATA RECOVERY LOGIC: Fetching existing database records
  const fetchLedgerData = async () => {
    setIsSyncing(true);
    try {
      const response = await documentApi.getAll();
      
      /* FIX: Checking for different possible response structures.
         FastAPI might return data as response.data or response.data.documents.
      */
      const dataToSet = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.documents || []);
        
      setTransactions(dataToSet);
    } catch (err) {
      console.error("Critical: Ledger data recovery failed", err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  // 2. LIFECYCLE SYNC: Triggered on page load to restore existing data
  useEffect(() => {
    fetchLedgerData();
  }, []);

  return (
    <div className="p-8 space-y-8 main-content-animate">
      
      {/* Dynamic Header with Status */}
      <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
          <Database size={180} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                Mainnet Live
              </span>
              <span className={`flex items-center gap-2 text-xs font-bold ${isSyncing ? 'text-blue-400' : 'text-emerald-400'}`}>
                <Activity size={14} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Restoring Ledger Data...' : 'Database Synchronized'}
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tight mb-2">Ledger Explorer</h1>
            <p className="text-slate-400 font-medium text-lg">Immutable audit trail of all existing trade records</p>
          </div>
          
          <button 
            onClick={fetchLedgerData}
            className="bg-white/10 hover:bg-white/20 border border-white/10 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95"
          >
            <RefreshCcw size={20} className={isSyncing ? 'animate-spin' : ''} />
            Synchronize Now
          </button>
        </div>
      </div>

      {/* 3. TRANSACTION TABLE: Displaying Recovered Records */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Ledger History</h3>
            <p className="text-slate-400 text-sm font-medium">Viewing {transactions.length} existing blockchain entries</p>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by hash..." 
              className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold w-80 focus:ring-4 focus:ring-blue-100 transition-all outline-none" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                <th className="p-8">TX Hash</th>
                <th className="p-8">Document Entry</th>
                <th className="p-8">Operation</th>
                <th className="p-8">Validator</th>
                <th className="p-8">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length > 0 ? (
                transactions.map((tx, i) => (
                  <tr key={tx.id || i} className="hover:bg-blue-50/30 transition-all group">
                    <td className="p-8">
                      <div className="flex items-center gap-2">
                        <code className="text-[11px] bg-slate-100 px-3 py-1.5 rounded-lg text-blue-600 font-mono group-hover:bg-blue-100 transition-colors">
                          {tx.hash ? tx.hash.substring(0, 14) + '...' : '0x...recovering'}
                        </code>
                        <ExternalLink size={14} className="text-slate-300 opacity-0 group-hover:opacity-100" />
                      </div>
                    </td>
                    <td className="p-8 font-extrabold text-slate-700 text-base">{tx.name}</td>
                    <td className="p-8">
                      <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase ${
                        tx.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {tx.status === 'Verified' ? 'MINT_HASH' : 'LEDGER_UPLOAD'}
                      </span>
                    </td>
                    <td className="p-8 text-sm text-slate-500 font-bold">Node_#{100 + i}</td>
                    <td className="p-8 text-sm text-slate-400 font-medium flex items-center gap-2">
                      <Clock size={16} /> {tx.date || 'Historical Entry'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-32 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-4">
                      {loading ? <Activity size={48} className="animate-spin text-blue-500" /> : <p className="italic">No existing data found in the database.</p>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Ledger;