import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldCheck, Activity, Fingerprint, Database, CheckCircle, Heart, Plus, Stethoscope } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationContext';

function Login() {
  const [username, setUsername] = useState('');
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
        employeeId: username, // Sending as employeeId for backend compatibility
        password,
      });

       setError('');
       localStorage.setItem("userInfo", JSON.stringify(data));
       showNotification('Authentication Successful. Welcome, ' + (data.employeeName || 'User'), 'success');
       navigate('/dashboard');
     } catch (err) {
       const errorMsg = err.response?.data?.message || 'Authentication failed. Please verify credentials.';
       setError(errorMsg);
     } finally {
      setLoading(false);
    }
  };

  /* Modern Corporate Tech Theme */
  const C = {
    primary: '#0ea5e9', // Sky blue
    background: '#f1f5f9',
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans relative overflow-hidden bg-[#f0f9ff]">
      {/* Pure Medical Field Background Animation */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -bottom-[5%] -left-[5%] opacity-[0.03] -rotate-12">
          <Stethoscope size={500} strokeWidth={0.5} className="text-blue-900" />
        </div>
        <div className="absolute -top-[10%] -right-[5%] opacity-[0.03] rotate-12">
          <Activity size={600} strokeWidth={0.5} className="text-blue-900" />
        </div>

        <div className="absolute top-[45%] w-full h-[120px] opacity-[0.08]">
          <svg width="100%" height="100%" viewBox="0 0 1000 120" preserveAspectRatio="none">
            <path 
              d="M0,60 L200,60 L210,30 L220,90 L230,10 L240,110 L250,60 L1000,60" 
              stroke="#0ea5e9" 
              strokeWidth="2" 
              fill="none"
              strokeDasharray="1000"
              strokeDashoffset="1000"
            >
              <animate 
                attributeName="stroke-dashoffset" 
                values="1000;0" 
                dur="8s" 
                repeatCount="indefinite" 
              />
            </path>
          </svg>
        </div>

        <div className="absolute top-[15%] left-[8%] text-blue-600/10 animate-float-slow">
          <Stethoscope size={120} strokeWidth={1} />
        </div>
        <div className="absolute bottom-[20%] right-[10%] text-sky-600/10 animate-float-slow" style={{ animationDelay: '-4s' }}>
          <ShieldCheck size={120} strokeWidth={1} />
        </div>

        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute text-blue-500/15 animate-pulse-medical" style={{
            top: `${15 + Math.random() * 70}%`,
            left: `${5 + Math.random() * 90}%`,
            animationDelay: `${i * 1.5}s`
          }}>
            <Plus size={48} strokeWidth={2} />
          </div>
        ))}
      </div>

      <style>{`
        .bg-mesh {
          background-color: #0f172a;
          background-image: 
            radial-gradient(at 0% 0%, hsla(198,100%,30%,1) 0px, transparent 50%),
            radial-gradient(at 100% 0%, hsla(189,100%,40%,1) 0px, transparent 50%),
            radial-gradient(at 100% 100%, hsla(198,100%,30%,1) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(189,100%,40%,1) 0px, transparent 50%),
            radial-gradient(at 50% 50%, hsla(198,100%,20%,1) 0px, transparent 50%);
          position: relative;
          background-size: 150% 150%;
          animation: meshGradient 15s ease infinite alternate;
        }
        @keyframes meshGradient {
          0% { background-position: 0% 0%; filter: hue-rotate(0deg); }
          50% { background-position: 100% 100%; filter: hue-rotate(10deg); }
          100% { background-position: 0% 100%; filter: hue-rotate(-10deg); }
        }
        .bg-mesh::after {
          content: "";
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.05;
          mix-blend-mode: overlay;
          pointer-events: none;
        }
        @keyframes float-slow {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 40px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes pulse-medical {
          0% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.1); }
          100% { opacity: 0.1; transform: scale(1); }
        }
        .animate-float-slow { animation: float-slow 12s infinite ease-in-out; }
        .animate-pulse-medical { animation: pulse-medical 4s infinite ease-in-out; }
        .slide-up {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        @keyframes slideUp {
          to { opacity: 1; transform: translateY(0); }
        }
        .hover-lift {
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hover-lift:hover {
          transform: translateY(-5px);
        }
      `}</style>
      
      <div className={`w-full flex items-center justify-center lg:p-12 transition-all duration-1000 ease-in-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-[1080px] lg:h-[640px] bg-white lg:rounded-2xl shadow-2xl flex overflow-hidden relative hover-lift">
          
          <div className="hidden lg:flex flex-col w-5/12 bg-mesh relative p-12 text-white overflow-hidden justify-between">
            <div className="absolute inset-0 bg-black/20 z-0"></div>
            
            <div className="relative z-10 flex items-center gap-3 slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#0f172a] shadow-lg">
                <Activity size={28} strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">QCare<span className="text-[#38bdf8]">.</span></h1>
            </div>

            <div className="relative z-10 slide-up" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-5xl font-bold leading-tight mb-6">
                Health & Medical <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] to-white">Quality Portal</span>
              </h2>
              <p className="text-lg text-slate-300 max-w-md font-medium leading-relaxed">
                Enhancing clinical excellence, ensuring patient safety, and streamlining healthcare quality standards.
              </p>
              
              <div className="mt-12 space-y-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <CheckCircle className="text-[#38bdf8]" size={20} />
                  <span>JCI & ISO 9001 Compliant Workflows</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <CheckCircle className="text-[#38bdf8]" size={20} />
                  <span>Real-time Risk Mitigation Dashboard</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <CheckCircle className="text-[#38bdf8]" size={20} />
                  <span>Automated PDCA Cycle Optimization</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-4 text-sm font-semibold slide-up" style={{ animationDelay: '0.5s', color: 'rgba(255,255,255,0.6)' }}>
              <ShieldCheck size={18} />
              <span>Secure End-to-End Encryption Enabled</span>
            </div>
          </div>

          <div className="w-full lg:w-7/12 flex flex-col justify-center items-center p-8 sm:p-16 relative bg-white">
             <div className="w-full max-w-md slide-up" style={{ animationDelay: '0.2s' }}>
                
                <div className="text-center lg:text-left mb-10">
                   <div className="inline-flex lg:hidden w-16 h-16 bg-slate-900 rounded-2xl items-center justify-center text-white mb-6 shadow-xl">
                      <Activity size={32} strokeWidth={2.5} className="text-[#38bdf8]" />
                   </div>
                   <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Welcome Back</h3>
                   <p className="text-slate-500 font-medium text-sm">Please enter your credentials to access the portal.</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 slide-up">
                    <div className="text-red-500 mt-0.5">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-red-700">Authentication Failed</h4>
                      <p className="text-xs font-medium text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="username">
                      Username or Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Fingerprint className="h-5 w-5 text-slate-400 group-focus-within:text-[#0ea5e9] transition-colors" />
                      </div>
                      <input
                        id="username"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        className="w-full pl-12 pr-4 py-3.5 border-0 border-b-2 border-slate-200 bg-white text-slate-900 font-semibold focus:outline-none focus:border-[#0ea5e9] transition-all duration-200"
                        placeholder="e.g. johndoe or john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="password">
                        Password
                      </label>
                      <a href="#" className="text-xs font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors">
                        Forgot Password?
                      </a>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#0ea5e9] transition-colors" />
                      </div>
                      <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full pl-12 pr-4 py-3.5 border-0 border-b-2 border-slate-200 bg-white text-slate-900 font-semibold focus:outline-none focus:border-[#0ea5e9] transition-all duration-200"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="w-full py-4 rounded-md text-white font-bold text-sm bg-slate-900 hover:bg-slate-800 transition-all focus:outline-none focus:ring-4 focus:ring-slate-200 flex justify-center items-center gap-2 group mt-8 shadow-lg shadow-slate-900/20 disabled:opacity-70"
                  >
                    {loading ? (
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Sign In to QCare</span>
                        <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'translate-x-1.5' : ''}`} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-12 text-center border-t border-slate-100 pt-8 slide-up" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center justify-center gap-6 mb-6 text-slate-400">
                    <Database size={24} className="hover:text-slate-600 transition-colors cursor-pointer" />
                    <ShieldCheck size={24} className="hover:text-slate-600 transition-colors cursor-pointer" />
                    <Activity size={24} className="hover:text-slate-600 transition-colors cursor-pointer" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    &copy; {new Date().getFullYear()} CMC Holding. All rights reserved. <br/>
                    <span className="text-slate-400 mt-1 inline-block">Developed by Enterprise IT Department</span>
                  </p>
                </div>

             </div>
          </div>
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