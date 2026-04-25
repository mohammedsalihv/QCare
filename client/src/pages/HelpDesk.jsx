import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { PhoneCall, Mail, MapPin, Hash, LifeBuoy, Clock, ArrowRight } from 'lucide-react';

const HelpDesk = () => {
  const contactInfo = [
    {
      icon: PhoneCall,
      label: "Main Phone Number",
      value: "+971 4 123 4567",
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      icon: Hash,
      label: "Internal Extension",
      value: "Ext. 4040",
      color: "text-rose-500",
      bgColor: "bg-rose-50"
    },
    {
      icon: Mail,
      label: "Support Email",
      value: "it.support@cmcholding.com",
      color: "text-amber-500",
      bgColor: "bg-amber-50"
    },
    {
      icon: MapPin,
      label: "Office Location",
      value: "IT Dept, 4th Floor, Main Wing",
      color: "text-emerald-500",
      bgColor: "bg-emerald-50"
    }
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto min-h-[calc(100vh-160px)]">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">IT Help Desk</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-60">Technical Support & Contact Information</p>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-slate-900 rounded-2xl p-8 relative overflow-hidden shadow-xl shadow-slate-900/10 mt-2">
          {/* Decorative background shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 right-32 w-32 h-32 bg-[#b59662]/20 rounded-full blur-2xl -mb-10"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#b59662]/20 flex items-center justify-center border border-[#b59662]/30">
                <LifeBuoy className="w-8 h-8 text-[#b59662]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Need Technical Assistance?</h2>
                <p className="text-sm font-medium text-slate-400 mt-1 max-w-md">
                  Our IT support team is available to help you resolve any technical issues, account access problems, or system errors.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#b59662]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Working Hours</span>
              </div>
              <p className="text-sm font-medium text-slate-300">Mon - Fri: 8:00 AM - 6:00 PM</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Currently Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Grid */}
        <div className="mt-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactInfo.map((info, idx) => {
              const Icon = info.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1"
                >
                  <div className={`w-10 h-10 rounded-xl ${info.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${info.color}`} />
                  </div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{info.label}</h4>
                  <p className="text-sm font-bold text-slate-800">{info.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Help Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-start justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
                <LifeBuoy className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Remote Support</h3>
              <p className="text-xs font-medium text-slate-500 mb-6 leading-relaxed">
                If instructed by our IT staff, please download the remote support client so we can securely access your computer to fix your issue.
              </p>
            </div>
            <button className="flex items-center gap-2 text-xs font-black text-purple-600 uppercase tracking-widest hover:text-purple-800 transition-colors">
              Download Client <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-[#b59662] to-[#8a7248] p-6 rounded-2xl shadow-sm text-white relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mt-10 -mr-10"></div>
            <div className="relative z-10">
              <h3 className="text-sm font-black uppercase tracking-widest mb-2">Urgent Issues</h3>
              <p className="text-xs font-medium text-white/80 mb-4 leading-relaxed">
                For critical system outages affecting patient care or hospital operations, please use the emergency hotline immediately.
              </p>
              <div className="bg-white/20 p-3 rounded-xl inline-block border border-white/30 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Emergency Hotline</p>
                <p className="text-xl font-black tracking-widest">Ext. 9999</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default HelpDesk;
