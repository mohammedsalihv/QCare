import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldCheck, User, Activity, Sparkles, HeartPulse, Stethoscope, Pill, Syringe, Dna, Microscope, Waves, FileCheck, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationContext';

function Login() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    setMounted(true);
  }, []);

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
       showNotification('System Access Granted. Welcome, ' + (data.employeeName || 'User'), 'success');
       navigate('/dashboard');
     } catch (err) {
       const errorMsg = err.response?.data?.message || 'Authentication failed. Access Denied.';
       setError(errorMsg);
     } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden bg-[#020617]">
      <style>{`
        @keyframes dna-rotate {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
          50% { transform: translateY(-40px) rotate(180deg); opacity: 0.2; }
          100% { transform: translateY(0) rotate(360deg); opacity: 0.1; }
        }
        .animate-dna {
          animation: dna-rotate 25s linear infinite;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          10%, 30% { transform: scale(1.05); }
          20% { transform: scale(1.1); }
        }
        .animate-heartbeat {
          animation: heartbeat 2s ease-in-out infinite;
        }
        @keyframes float-check {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.15; }
          100% { transform: translateY(-60px) scale(0.8); opacity: 0; }
        }
        .animate-float-qms {
          animation: float-check 6s ease-in-out infinite;
        }
        .glass-panel {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
        }
      `}</style>
      
      {/* High-Fidelity Medical Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(45,212,191,0.06)_0%,_transparent_75%)]"></div>
        
        {/* DNA Strands Background (Core biological theme) */}
        <div className="absolute -left-20 top-0 opacity-20 animate-dna">
          <Dna size={400} strokeWidth={0.5} className="text-teal-900" />
        </div>
        <div className="absolute -right-20 bottom-0 opacity-20 animate-dna" style={{ animationDirection: 'reverse' }}>
          <Dna size={500} strokeWidth={0.5} className="text-blue-900" />
        </div>

        {/* QMS Floating Icons (Shields and Checkmarks representing Quality) */}
        <div className="absolute top-[20%] left-[15%] opacity-10 animate-float-qms">
          <ShieldCheck size={120} strokeWidth={0.5} className="text-teal-400" />
        </div>
        <div className="absolute top-[60%] right-[15%] opacity-10 animate-float-qms" style={{ animationDelay: '2s' }}>
          <FileCheck size={140} strokeWidth={0.5} className="text-blue-400" />
        </div>
        <div className="absolute bottom-[20%] left-[25%] opacity-10 animate-float-qms" style={{ animationDelay: '4s' }}>
          <BarChart3 size={100} strokeWidth={0.5} className="text-teal-500" />
        </div>

        {/* Floating Cellular Particles */}
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full border border-teal-500/20 bg-teal-500/5 blur-[2px] animate-pulse"
            style={{
              width: Math.random() * 40 + 20 + 'px',
              height: Math.random() * 40 + 20 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: i * 0.8 + 's',
              animationDuration: Math.random() * 5 + 5 + 's'
            }}
          ></div>
        ))}
      </div>

      {/* Main Login Portal Container */}
      <div className={`relative z-10 w-full max-w-[800px] mx-auto px-6 py-8 transition-all duration-[1500ms] ease-out transform ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-95'}`}>
        
        <div className="grid lg:grid-cols-2 glass-panel rounded-[3rem] overflow-hidden relative border-white/10">
          
          {/* Scanning Effect Over the Whole Panel */}


          {/* Left Side: Medical Hero Section */}
          <div className="p-7 lg:p-10 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-900/60 to-transparent">
            
            {/* Top Branding */}
            <div className="relative z-10">
               <div className="flex items-center gap-5 mb-8 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-teal-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="w-24 h-24 bg-white/5 backdrop-blur-3xl rounded-3xl p-2 border border-white/10 shadow-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-105 overflow-hidden">
                      <img src="/logo.svg" alt="QCare" className="w-full h-full object-contain scale-125" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">QCare<span className="text-teal-400">.</span></h1>
                    <p className="text-[9px] text-teal-400 font-black tracking-[0.4em] uppercase mt-2">QMS Enterprise Portal</p>
                  </div>
               </div>

                {/* Central Hero Text */}
                <div className="space-y-6 mt-10">
                   <h2 className="text-4xl lg:text-5xl font-light text-white leading-[1.1] tracking-tight">
                     Clinical <br/>
                     <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-200 to-blue-400">Quality & Governance</span>
                   </h2>
                   
                   <p className="text-slate-400 text-sm lg:text-base leading-relaxed max-w-sm font-medium opacity-80">
                     The definitive ecosystem for healthcare quality assurance. Standardizing clinical excellence, regulatory compliance, and patient safety through data-driven insights.
                   </p>

                   {/* Medical Quality Narrative - Replaces Points */}
                   <div className="mt-12 pt-8 border-t border-white/5 space-y-5">
                      <p className="text-slate-400 text-xs font-semibold leading-relaxed opacity-90">
                        Engineered to align clinical workflows with international standards (ISO 9001/JCI), QCare facilitates zero-harm patient safety initiatives through automated PDCA cycle optimization. 
                      </p>
                      <p className="text-slate-400 text-xs font-semibold leading-relaxed opacity-90">
                        By integrating proactive clinical audits and real-time risk mitigation, we empower healthcare institutions to maintain the highest levels of medical quality and regulatory excellence.
                      </p>
                   </div>
             </div>
            </div>
            
            {/* Decorative Grid Line */}
            <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
          </div>

          {/* Right Side: High-Security Login Form */}
          <div className="p-7 lg:p-10 relative flex items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="mb-8 text-center lg:text-left">
                 <div className="inline-block lg:hidden mb-6">
                   <ShieldCheck size={40} className="text-teal-400 mx-auto" />
                 </div>
                 <h3 className="text-3xl font-black text-white tracking-tight mb-3">Gateway Access</h3>
                 <p className="text-slate-400 text-sm font-medium">Authentication required for Quality Control modules.</p>
              </div>

              {/* Enhanced Error State */}
              {error && (
                <div className="mb-8 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-start gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1">Access Denied</h4>
                    <p className="text-xs text-rose-200/70 font-medium leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Employee ID Field */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-teal-400/60 uppercase tracking-[0.25em] ml-1" htmlFor="employeeId">
                    Operator Identification
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    </div>
                    <input
                      id="employeeId"
                      type="text"
                      required
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      disabled={loading}
                      className="block w-full pl-14 pr-6 py-4 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400/50 transition-all font-bold shadow-inner text-sm"
                      placeholder="EMPLOYEE ID"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-teal-400/60 uppercase tracking-[0.25em]" htmlFor="password">
                      Security Passphrase
                    </label>
                    <button type="button" className="text-[10px] font-black text-slate-500 hover:text-teal-400 uppercase tracking-widest transition-colors">
                      Forgot Key?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="block w-full pl-14 pr-6 py-4 bg-slate-950/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400/50 transition-all font-bold shadow-inner text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="w-full mt-6 relative flex items-center justify-center gap-4 py-5 px-8 rounded-2xl text-slate-950 font-black uppercase tracking-[0.2em] bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-300 hover:to-blue-400 focus:outline-none focus:ring-4 focus:ring-teal-500/30 transition-all shadow-2xl shadow-teal-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 skew-x-12"></div>
                  
                  {loading ? (
                    <RefreshCcw className="w-6 h-6 animate-spin text-slate-900" />
                  ) : (
                    <>
                      <span className="relative z-10 text-[13px]">Initialize Session</span>
                      <ArrowRight className={`w-5 h-5 relative z-10 transition-all duration-500 ${isHovered ? 'translate-x-2' : ''}`} />
                    </>
                  )}
                </button>
              </form>

              {/* Secondary Actions */}
              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                 <div className="flex items-center gap-3 px-5 py-2.5 bg-teal-500/5 rounded-full border border-teal-500/10 shadow-sm shadow-teal-500/5">
                    <ShieldCheck size={14} className="text-teal-400 animate-heartbeat" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AES-256 Multi-Layer Encryption Active</span>
                 </div>
                 
                 <p className="text-[10px] text-slate-600 font-bold text-center leading-relaxed px-4">
                   Unauthorized access to Quality Management modules is strictly prohibited and monitored.
                 </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modernized Footer */}
        <div className="mt-12 flex flex-col items-center gap-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
          <div className="inline-flex items-center gap-4 py-2.5 px-6 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
             <div className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(45,212,191,0.6)] animate-pulse"></div>
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
               Designed & Developed by <span className="text-white border-b border-white/20 ml-1">IT Department</span>
             </span>
          </div>

          <div className="flex items-center gap-8">
             <span className="hover:text-teal-400 cursor-pointer transition-colors">Privacy & Data Governance</span>
             <span className="w-1 h-1 rounded-full bg-slate-800"></span>
             <span className="hover:text-teal-400 cursor-pointer transition-colors">Compliance IT</span>
             <span className="w-1 h-1 rounded-full bg-slate-800"></span>
             <span className="hover:text-teal-400 cursor-pointer transition-colors">Audit Status</span>
          </div>
          <p className="opacity-40">&copy; {new Date().getFullYear()} CMC Holding • Quality Management & Compliance System</p>
        </div>
      </div>
    </div>
  );
}

// Helper icon import for Refresh
const RefreshCcw = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 16h5v5"/>
  </svg>
);

export default Login;