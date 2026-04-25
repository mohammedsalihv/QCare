import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, User, AtSign, AtSignIcon } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationContext';

function Login() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', {
        employeeId,
        password,
      });

       setError('');
       localStorage.setItem("userInfo", JSON.stringify(data));
       showNotification('Login successful! Redirecting to dashboard...', 'success');
       navigate('/dashboard');
     } catch (err) {
       const errorMsg = err.response?.data?.message || 'Login failed. Please try again.';
       setError(errorMsg);
     } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-slate-800 font-sans bg-slate-50">
      {/* Left side - Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden isolate">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2000&auto=format&fit=crop"
            alt="Medical Quality"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-[#b59662]/30"></div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
           <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#b59662] blur-[128px] opacity-20 rounded-full mix-blend-screen"></div>
           <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-teal-500 blur-[100px] opacity-20 rounded-full mix-blend-screen"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-12 w-full h-full">
          <div>
            <div className="flex items-center gap-5 mb-8">
              <div className="w-18 h-18 overflow-hidden">
                 <img src="/logo.svg" alt="QCare" className="w-full h-full object-contain" />
              </div>
              <span className="text-3xl font-black text-white tracking-tighter">QCare Portal</span>
            </div>
          </div>
          
          <div className="space-y-5 max-w-lg pb-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b59662] animate-pulse shadow-[0_0_8px_#b59662]"></span>
              <span className="text-[10px] font-semibold text-slate-200 uppercase tracking-widest gap-1 flex">
                Quality Assurance System
              </span>
            </div>
             <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.2]">
               Excellence in <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b59662] to-[#fcebca]">Healthcare Standards</span>
             </h1>
             <p className="text-base xl:text-lg text-slate-300 font-light leading-relaxed max-w-md">
               Secure access to CMC Holding's advanced quality management platform. Monitoring, evaluating, and elevating patient care.
             </p>
          </div>

          <div className="flex flex-col gap-2 text-sm text-slate-400 font-medium">
             <div className="flex items-center gap-3">
               <span>&copy; {new Date().getFullYear()} CMC Holding</span>
               <span className="w-1 h-1 rounded-full bg-slate-600"></span>
               <span>Quality Department</span>
             </div>
             <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
               Designed & Developed by <span className="text-[#b59662]">IT Department</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 xl:p-12 relative">
        {/* Subtle background glow for mobile */}
        <div className="absolute inset-0 lg:hidden bg-slate-50 z-0">
          <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-b from-white to-transparent"></div>
        </div>

        <div className="w-full max-w-[380px] relative z-10 lg:bg-transparent bg-white lg:shadow-none shadow-xl lg:p-0 p-8 sm:p-10 rounded-3xl border border-slate-100 lg:border-none">
          
          <div className="text-center mb-8 mt-4">
            {/* The Logo Redesigned container */}
            <div className="mb-6 flex justify-center">
              {/* CMC Holding Logo */}
              <div className="h-28 sm:h-32 relative flex items-center justify-center inline-block">
                 <img 
                    src="/logo.svg" 
                    alt="QCare Logo" 
                    className="h-full w-auto object-contain" 
                    onError={(e) => {
                       e.target.onerror = null;
                       e.target.src = "https://ui-avatars.com/api/?name=QCare&background=b59662&color=fff&size=256&font-size=0.33&rounded=true&bold=true";
                    }}
                 />
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full bg-[#b59662]/10 border border-[#b59662]/20">
               <ShieldCheck className="w-4 h-4 text-[#b59662]" />
               <span className="text-xs font-bold text-[#b59662] uppercase tracking-wide">QCare Access</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-slate-500 mt-2 text-xs sm:text-sm font-medium max-w-[280px] mx-auto">
              Sign in to your authorized personnel account.
            </p>
          </div>

          {/* Notifications are handled by the global toast system */}

          {/* Inline Error Banner */}
          {error && (
            <div className={`mb-5 flex items-start gap-3 px-4 py-3.5 rounded-xl border text-xs font-semibold leading-relaxed ${
              error.toLowerCase().includes('blocked') || error.toLowerCase().includes('inactive') || error.toLowerCase().includes('deactivated')
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <span className="mt-0.5 shrink-0 text-base">
                {error.toLowerCase().includes('blocked') || error.toLowerCase().includes('inactive') || error.toLowerCase().includes('deactivated')
                  ? '🔒'
                  : '⚠️'
                }
              </span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[13px] font-semibold text-slate-700" htmlFor="employeeId">Employee ID</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-[#b59662] transition-colors" />
                </div>
                <input
                  id="employeeId"
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#b59662]/10 focus:border-[#b59662] focus:bg-white transition-all shadow-sm"
                  placeholder="EMPXXXXX"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold text-slate-700" htmlFor="password">Security Password</label>
                <a href="#" className="text-xs font-bold text-[#b59662] hover:text-[#a68959] transition-colors">Forgot Access?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-[#b59662] transition-colors" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#b59662]/10 focus:border-[#b59662] focus:bg-white transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="w-full relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold bg-[#b59662] hover:bg-[#a68959] focus:outline-none focus:ring-4 focus:ring-[#b59662]/30 transition-all shadow-xl shadow-[#b59662]/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
              >
                {/* Gloss effect */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Enter Portal</span>
                    <ArrowRight className={`w-4.5 h-4.5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2">
                <img src="/logo.svg" className="w-4 h-4 grayscale opacity-50" alt="" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Protection</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;