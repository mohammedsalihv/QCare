import React, { useState, useEffect, useRef } from 'react';
import { Lock, ArrowRight, ShieldCheck, Activity, User, Database, CheckCircle, Heart, Plus, Stethoscope, Mail, X, Send, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const forgotInputRef = useRef(null);
  
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post('http://192.168.1.160:5000/api/auth/login', {
        employeeId: username, // Sending as employeeId for backend compatibility
        password,
      });

       setError('');
       localStorage.setItem("userInfo", JSON.stringify(data));
       localStorage.setItem("token", data.token);
       showNotification('Welcome, ' + (data.employeeName || 'User') + '!', 'success');
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
    primary: 'var(--color-primary)', // Sky blue
    background: '#f1f5f9',
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans relative overflow-hidden bg-slate-50">
      {/* Pure Medical Field Background Animation */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -bottom-[5%] -left-[5%] opacity-[0.03] -rotate-12">
          <Stethoscope size={500} strokeWidth={0.5} className="text-[#040404]" />
        </div>
        <div className="absolute -top-[10%] -right-[5%] opacity-[0.03] rotate-12">
          <Activity size={600} strokeWidth={0.5} className="text-[#040404]" />
        </div>

        <div className="absolute top-[45%] w-full h-[120px] opacity-[0.08]">
          <svg width="100%" height="100%" viewBox="0 0 1000 120" preserveAspectRatio="none">
            <path 
              d="M0,60 L200,60 L210,30 L220,90 L230,10 L240,110 L250,60 L1000,60" 
              stroke="var(--color-primary)" 
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

        <div className="absolute top-[15%] left-[8%] text-[var(--color-primary)]/10 animate-float-slow">
          <Stethoscope size={120} strokeWidth={1} />
        </div>
        <div className="absolute bottom-[20%] right-[10%] text-[var(--color-secondary)]/10 animate-float-slow" style={{ animationDelay: '-4s' }}>
          <ShieldCheck size={120} strokeWidth={1} />
        </div>

        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute text-[#C9A84C]/15 animate-pulse-medical" style={{
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
          background: linear-gradient(155deg, #153f3c, #245e56);
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
        #password::-ms-reveal, #password::-ms-clear { display: none; }
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
      
      <div className={`w-full flex items-center justify-center p-4 sm:p-6 transition-all duration-1000 ease-in-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-md lg:max-w-[940px] bg-white rounded-2xl shadow-2xl flex overflow-hidden relative">
          
          <div className="hidden lg:flex flex-col w-5/12 bg-mesh relative p-8 text-white overflow-hidden justify-between">
            <div className="absolute inset-0 bg-black/20 z-0"></div>
            
            <div className="relative z-10 flex items-center gap-3 slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-teal-700 shadow-lg">
                <Activity size={28} strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">QCare<span className="text-[var(--color-primary)]">.</span></h1>
            </div>

            <div className="relative z-10 slide-up" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-4xl font-bold leading-tight mb-4">
                Better care.<br />
                <span className="text-teal-200">Clearer action.</span>
              </h2>
              <p className="text-sm text-white/75 max-w-md font-medium leading-relaxed">
                One workspace to measure quality, learn from incidents and move improvements forward.
              </p>
              
              <div className="mt-6 space-y-3 text-xs">
                <div className="flex items-center gap-3 text-white/85 font-medium">
                  <CheckCircle className="text-[var(--color-primary)]" size={20} />
                  <span>Measure what matters</span>
                </div>
                <div className="flex items-center gap-3 text-white/85 font-medium">
                  <CheckCircle className="text-[var(--color-primary)]" size={20} />
                  <span>Learn from every incident</span>
                </div>
                <div className="flex items-center gap-3 text-white/85 font-medium">
                  <CheckCircle className="text-[var(--color-primary)]" size={20} />
                  <span>Keep evidence and actions together</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-4 text-sm font-semibold slide-up" style={{ animationDelay: '0.5s', color: 'rgba(255,255,255,0.6)' }}>
              <ShieldCheck size={18} />
              <span>Healthcare quality, connected</span>
            </div>
          </div>

          <div className="w-full lg:w-7/12 flex flex-col justify-center items-center p-6 sm:p-8 relative bg-white">
             <div className="w-full max-w-md slide-up" style={{ animationDelay: '0.2s' }}>
                
                <div className="text-center lg:text-left mb-6">
                   <div className="inline-flex lg:hidden w-12 h-12 bg-white rounded-xl items-center justify-center text-white mb-4 shadow-lg">
                      <Activity size={32} strokeWidth={2.5} className="text-[var(--color-primary)]" />
                   </div>
                   <h3 className="text-3xl font-bold text-black font-bold mb-3 tracking-tight">Welcome Back</h3>
                   <p className="text-black font-bold font-medium text-sm">Please enter your credentials to access the portal.</p>
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-black font-bold" htmlFor="username">
                      Username or Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-black font-bold group-focus-within:text-[var(--color-primary)] transition-colors" />
                      </div>
                      <input
                        id="username"
                        autoComplete="username"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        className="w-full pl-12 pr-4 py-3.5 border-0 border-b-2 border-slate-200 bg-white text-black font-bold font-semibold focus:outline-none focus:border-[var(--color-primary)] transition-all duration-200"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-black font-bold" htmlFor="password">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => { setShowForgotModal(true); setForgotUsername(''); setForgotSent(false); }}
                        className="text-xs font-bold text-[var(--color-primary)] hover:underline transition-colors focus:outline-none"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-black font-bold group-focus-within:text-[var(--color-primary)] transition-colors" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full pl-12 pr-14 py-3.5 border-0 border-b-2 border-slate-200 bg-white text-black font-bold font-semibold focus:outline-none focus:border-[var(--color-primary)] transition-all duration-200"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        aria-controls="password"
                        title={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded text-slate-500 hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="w-full py-4 rounded-md text-white font-bold text-sm bg-[var(--color-primary)] hover:bg-[var(--color-primary)] transition-all focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/20 flex justify-center items-center gap-2 group mt-8 shadow-lg shadow-[var(--color-primary)]/20 disabled:opacity-70"
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

                <div className="mt-6 text-center border-t border-slate-100 pt-4 slide-up" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center justify-center gap-6 mb-3 text-black font-bold">
                    <Database size={24} className="hover:text-black font-bold transition-colors cursor-pointer" />
                    <ShieldCheck size={24} className="hover:text-black font-bold transition-colors cursor-pointer" />
                    <Activity size={24} className="hover:text-black font-bold transition-colors cursor-pointer" />
                  </div>
                  <p className="text-xs font-semibold text-black font-bold">
                    &copy; {new Date().getFullYear()} CMC Holding. All rights reserved. <br/>
                    <span className="text-black font-bold mt-1 inline-block">Developed by Enterprise IT Department</span>
                  </p>
                </div>

             </div>
          </div>
        </div>
      </div>
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowForgotModal(false); setForgotSent(false); } }}
        >
          <style>{`
            @keyframes modalIn {
              from { opacity: 0; transform: scale(0.92) translateY(24px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
            .modal-pop { animation: modalIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards; }
          `}</style>

          <div className="modal-pop bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-mesh relative px-8 pt-8 pb-6">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Mail size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Forgot Password?</h2>
                    <p className="text-xs text-white/70 mt-0.5">We'll help you reset it</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowForgotModal(false); setForgotSent(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-7">
              {!forgotSent ? (
                <>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    Enter your <span className="font-semibold text-slate-800">username</span> below and we'll send a
                    password reset request to our support team at{' '}
                    <span className="font-semibold text-[var(--color-primary)]">support@canadiancmc.com</span>.
                  </p>

                  <div className="space-y-2 mb-6">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="forgot-username">
                      Your Username
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                      </div>
                      <input
                        id="forgot-username"
                        ref={forgotInputRef}
                        type="text"
                        value={forgotUsername}
                        onChange={(e) => setForgotUsername(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 border-0 border-b-2 border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:border-[var(--color-primary)] transition-all duration-200 rounded-t-md"
                        placeholder="Enter your username"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!forgotUsername.trim() || forgotLoading}
                    onClick={async () => {
                      setForgotLoading(true);
                      setForgotError('');
                      try {
                        await axios.post('http://192.168.1.160:5000/api/auth/forgot-password', {
                          username: forgotUsername.trim(),
                        });
                        setForgotSent(true);
                      } catch (err) {
                        setForgotError(err.response?.data?.message || 'Failed to send email. Please try again.');
                      } finally {
                        setForgotLoading(false);
                      }
                    }}
                    className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/20"
                    style={{
                      background: (forgotUsername.trim() && !forgotLoading) ? 'var(--color-primary)' : '#cbd5e1',
                      cursor: (forgotUsername.trim() && !forgotLoading) ? 'pointer' : 'not-allowed',
                      boxShadow: (forgotUsername.trim() && !forgotLoading) ? '0 8px 24px -4px color-mix(in srgb, var(--color-primary) 40%, transparent)' : 'none'
                    }}
                  >
                    {forgotLoading ? (
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    {forgotLoading ? 'Sending...' : 'Send Reset Request'}
                  </button>
                  {forgotError && (
                    <p className="mt-3 text-xs text-red-500 font-semibold text-center">{forgotError}</p>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle size={36} className="text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Request Sent!</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Your password reset request has been sent directly to{' '}
                    <span className="font-semibold text-[var(--color-primary)]">support@canadiancmc.com</span>.
                    The support team will contact you shortly.
                  </p>
                  <button
                    onClick={() => { setShowForgotModal(false); setForgotSent(false); }}
                    className="mt-6 w-full py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
