import React from 'react';
import { History, ShieldCheck, User, Clock, ExternalLink } from 'lucide-react';

const AuditLogs = () => {
  // Mock blockchain data matching your dashboard theme
  const logs = [
    { id: 1, action: 'Document Uploaded', user: 'buy1', time: '2026-01-08 14:20', hash: '0x71c...3e2', status: 'Success' },
    { id: 2, action: 'Hash Verified', user: 'Admin', time: '2026-01-08 15:10', hash: '0x82d...4f1', status: 'Verified' },
    { id: 3, action: 'Integrity Check', user: 'System', time: '2026-01-09 09:05', hash: '0x93e...5g2', status: 'Secure' },
  ];

  return (
    <div className="space-y-6 main-content-animate">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-[#6366f1] p-3 rounded-2xl text-white shadow-lg">
          <History size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Audit Logs</h1>
          <p className="text-slate-500 font-medium italic">Immutable blockchain-backed event tracking</p>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Type</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Hash</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ShieldCheck size={18} />
                    </div>
                    <span className="font-bold text-slate-700">{log.action}</span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2 font-medium text-slate-600">
                    <User size={14} className="text-slate-400" />
                    {log.user}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock size={14} />
                    {log.time}
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2 group/hash cursor-pointer">
                    <code className="bg-slate-100 px-3 py-1 rounded-md text-[11px] font-mono text-slate-500 group-hover/hash:text-blue-600 transition-colors">
                      {log.hash}
                    </code>
                    <ExternalLink size={12} className="text-slate-300 opacity-0 group-hover/hash:opacity-100 transition-opacity" />
                  </div>
                </td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    log.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 
                    log.status === 'Verified' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;