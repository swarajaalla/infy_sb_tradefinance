import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api'; // This connects to your backend

const Register = () => {
  const [role, setRole] = useState('Buyer');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Sends data to http://localhost:8000/auth/register
      await authApi.register({ ...formData, role });
      alert("Registration successful! Please login.");
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. check backend connection.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
        <h2 className="text-4xl font-bold text-[#1e293b] mb-8 text-center">Create Account</h2>
        
        {/* Role Selector */}
        <div className="flex gap-2 mb-8 bg-[#f1f5f9] p-2 rounded-2xl">
          {['Admin', 'Buyer', 'Seller'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                role === r ? 'bg-[#3b82f6] text-white shadow-lg' : 'text-[#64748b] hover:bg-gray-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-center mb-4 font-medium">{error}</p>}

        <form onSubmit={handleRegister} className="space-y-5">
          <input 
            type="text" 
            placeholder="Full Name" 
            className="w-full p-5 bg-[#eef4ff] rounded-2xl outline-none text-gray-700 font-medium"
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            required 
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full p-5 bg-[#eef4ff] rounded-2xl outline-none text-gray-700 font-medium"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-5 bg-[#eef4ff] rounded-2xl outline-none text-gray-700 font-medium"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required 
          />
          
          <button type="submit" className="w-full bg-[#3b82f6] text-white p-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition shadow-xl mt-4">
            Register as {role}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[#64748b] font-medium">
            Already have an account? 
            <Link to="/login" className="ml-2 text-[#3b82f6] font-bold hover:underline">
              Login Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;