import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [role, setRole] = useState('Buyer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // 1. DYNAMIC SESSION SAVING
    // Save the token to bypass Protected Routes
    localStorage.setItem('token', 'true');
    
    // Save the selected role (Admin, Buyer, or Seller)
    localStorage.setItem('userRole', role);
    
    // Save the email to be displayed in the Navbar profile
    localStorage.setItem('userEmail', email);
    
    // Generate a username from the email (e.g., dipendra@mail.com -> dipendra)
    const generatedName = email.split('@')[0];
    localStorage.setItem('userName', generatedName);

    // 2. REDIRECT TO DASHBOARD
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-500">
        <h2 className="text-4xl font-bold text-[#1e293b] mb-8 text-center tracking-tight">Login to ChainDocs</h2>
        
        {/* Role Selector */}
        <div className="flex gap-2 mb-8 bg-[#f1f5f9] p-2 rounded-2xl">
          {['Admin', 'Buyer', 'Seller'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all duration-200 ${
                role === r 
                ? 'bg-[#3b82f6] text-white shadow-lg scale-105' 
                : 'text-[#64748b] hover:bg-gray-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
            <input 
              type="email" 
              placeholder="dipendra@mail.com" 
              className="w-full p-5 bg-[#eef4ff] rounded-2xl outline-none text-gray-700 font-bold focus:ring-4 focus:ring-blue-100 transition-all" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Password</label>
            <input 
              type="password" 
              placeholder="••••••" 
              className="w-full p-5 bg-[#eef4ff] rounded-2xl outline-none text-gray-700 font-bold focus:ring-4 focus:ring-blue-100 transition-all" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-[#3b82f6] text-white p-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 mt-4 active:scale-95"
          >
            Login as {role}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-8">
          <p className="text-[#64748b] font-medium">
            New to ChainDocs? 
            <Link to="/register" className="ml-2 text-[#3b82f6] font-bold hover:underline">
              Register Now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;