import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Shield } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>

      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative z-10 border border-white/20">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
            <Shield className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-500 mt-2 text-center">
            {isLogin 
              ? 'Securely manage your blockchain trade documents.' 
              : 'Join the ChainDocs platform to secure your trade finance.'}
          </p>
        </div>

        {/* Form Section */}
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {!isLogin && (
            <div className="relative">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <User size={18} />
                </span>
                <input 
                  type="text" 
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-700"
                  placeholder="John Doe" 
                />
              </div>
            </div>
          )}

          <div className="relative">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <Mail size={18} />
              </span>
              <input 
                type="email" 
                className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-700"
                placeholder="name@company.com" 
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <Lock size={18} />
              </span>
              <input 
                type="password" 
                className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-700"
                placeholder="••••••••" 
              />
            </div>
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Forgot password?
              </button>
            </div>
          )}

          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transform hover:scale-[1.02] transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2 mt-4">
            {isLogin ? 'Sign In' : 'Get Started'}
            <ArrowRight size={20} />
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-600 font-medium">
            {isLogin ? "New to ChainDocs?" : "Already have an account?"} 
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-blue-600 font-bold ml-2 hover:underline decoration-2 underline-offset-4"
            >
              {isLogin ? 'Create an account' : 'Log in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;