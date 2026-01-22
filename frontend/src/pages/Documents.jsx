import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  ShieldCheck, 
  ExternalLink, 
  Trash2,
  MoreVertical 
} from 'lucide-react';
import { documentApi } from '../api';

const Documents = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. ROLE IDENTIFICATION
  const userRole = localStorage.getItem('userRole') || 'Buyer';

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await documentApi.getAll();
        setDocuments(response.data);
      } catch (err) {
        // Fallback data reflecting different statuses
        setDocuments([
          { id: 'DOC-001', name: 'Invoice_Apple_Jan.pdf', date: '2024-05-10', type: 'Invoice', status: 'Verified', hash: '0x71c...a2b' },
          { id: 'DOC-002', name: 'LetterOfCredit_HSBC.pdf', date: '2024-05-08', type: 'Letter of Credit', status: 'Pending', hash: '0x88d...f31' },
          { id: 'DOC-003', name: 'BillOfLading_Maersk.pdf', date: '2024-05-05', type: 'Bill of Lading', status: 'Verified', hash: '0x92a...e44' },
          { id: 'DOC-004', name: 'PurchaseOrder_Samsung.pdf', date: '2024-05-02', type: 'Purchase Order', status: 'Verified', hash: '0x14b...c92' },
          { id: 'DOC-005', name: 'Insurance_Lloyds.pdf', date: '2024-04-28', type: 'Insurance', status: 'Pending', hash: '0x55e...d11' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  // 2. VERIFICATION FLOW
  const handleVerify = (docId) => {
    // Redirects all users to the live verification status page
    navigate(`/integrity-status?id=${docId}`);
  };

  const handleDownload = async (doc) => {
    const link = document.createElement('a');
    link.href = `http://localhost:8000/api/documents/download/${doc.name}`;
    link.setAttribute('download', doc.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="main-content-animate space-y-6 p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Document Repository</h1>
          <p className="text-slate-500 font-medium">
            {userRole === 'Admin' ? 'Global Oversight' : 'Personal Trade Management'} • {documents.length} Files Found
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or hash..." 
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 w-64 text-sm font-medium transition-all"
            />
          </div>
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Details</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Work Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{doc.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {doc.id} • {doc.date}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold whitespace-nowrap">
                    {doc.type}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${doc.status === 'Verified' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                    <span className={`text-xs font-bold ${doc.status === 'Verified' ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {doc.status}
                    </span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center justify-center gap-2">
                    {/* Action: Verify - Available to all to check integrity */}
                    <button 
                      onClick={() => handleVerify(doc.id)}
                      className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Verify Integrity"
                    >
                      <ShieldCheck size={18} />
                    </button>

                    {/* Action: Download - Core requirement for trade work */}
                    <button 
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                      title="Download File"
                    >
                      <Download size={18} />
                    </button>

                    {/* Action: Administrative/Seller Management Actions */}
                    {(userRole === 'Admin' || userRole === 'Seller') && (
                      <button 
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Record"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Section */}
        <div className="p-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-800 font-bold">{documents.length}</span> of <span className="text-slate-800 font-bold">{documents.length}</span> documents
          </p>
          <div className="flex gap-2">
             <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;