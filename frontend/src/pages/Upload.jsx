import React, { useState } from 'react';
import { Upload as UploadIcon, File, X, CheckCircle, Shield, Building2, UserCircle2 } from 'lucide-react';
import { documentApi } from '../api'; // Connects to your FastAPI backend

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  
  // 1. New State for Trade Assignment
  const [tradeData, setTradeData] = useState({
    docType: 'Invoice',
    assignedBank: '',
    participant: ''
  });

  const banks = ['HSBC', 'J.P. Morgan', 'Standard Chartered', 'Barclays'];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !tradeData.assignedBank) {
      alert("Please select a file and assign a verifying bank.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    // Append the bank and participant data for the trade creation
    formData.append('type', tradeData.docType);
    formData.append('bank', tradeData.assignedBank);
    formData.append('participant', tradeData.participant);

    try {
      await documentApi.upload(formData);
      setStatus('success');
      setFile(null);
      setTradeData({ docType: 'Invoice', assignedBank: '', participant: '' });
    } catch (error) {
      console.error("Upload failed", error);
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen main-content-animate">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-[2rem] p-10 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Create Trade Document</h1>
          <p className="text-white/80 font-medium">Assign banks and participants to your blockchain trade</p>
        </div>
        <Shield className="absolute right-[-20px] top-[-20px] text-white/10 w-64 h-64" />
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Trade Details Form */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Trade Assignment</h3>
          
          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Document Type</label>
            <select 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700"
              value={tradeData.docType}
              onChange={(e) => setTradeData({...tradeData, docType: e.target.value})}
            >
              <option>Invoice</option>
              <option>Letter of Credit</option>
              <option>Bill of Lading</option>
              <option>Purchase Order</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Assign Verifying Bank</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 appearance-none"
                value={tradeData.assignedBank}
                onChange={(e) => setTradeData({...tradeData, assignedBank: e.target.value})}
              >
                <option value="">Select Bank...</option>
                {banks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Participant/Counterparty</label>
            <div className="relative">
              <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="e.g. buy1@example.com"
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700"
                value={tradeData.participant}
                onChange={(e) => setTradeData({...tradeData, participant: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Right: File Upload Area */}
        <div className={`bg-white rounded-[2.5rem] p-10 border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
          file ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-300'
        }`}>
          {!file ? (
            <>
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-100">
                <UploadIcon size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Select Document</h3>
              <p className="text-slate-500 mt-2 mb-8 text-sm px-4">
                Upload your file to generate a unique blockchain hash for {tradeData.assignedBank || 'the bank'}.
              </p>
              <input type="file" id="fileUpload" className="hidden" onChange={handleFileChange} />
              <label htmlFor="fileUpload" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold cursor-pointer hover:bg-indigo-700 transition-all shadow-lg">
                Browse Files
              </label>
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-indigo-100 shadow-sm mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><File size={24} /></div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-sm truncate w-32">{file.name}</p>
                    <p className="text-xs text-slate-400 font-bold">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>

              <button 
                onClick={handleUpload}
                disabled={uploading}
                className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-3 ${
                  uploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:scale-[1.02]'
                }`}
              >
                {uploading ? 'Minting Hash...' : 'Anchor to Blockchain'}
                {!uploading && <CheckCircle size={20} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success/Error Alerts */}
      {status === 'success' && (
        <div className="mt-8 max-w-4xl mx-auto p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 animate-bounce">
          <CheckCircle size={20} />
          <p className="text-sm font-bold">Trade successfully created and assigned to {tradeData.assignedBank}!</p>
        </div>
      )}
    </div>
  );
};

export default Upload;