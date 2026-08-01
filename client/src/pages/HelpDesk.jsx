import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { PhoneCall, Mail, MapPin, Hash, LifeBuoy, Clock } from 'lucide-react';

const HelpDesk = () => {
  const contactInfo = [
    {
      icon: PhoneCall,
      label: "Main Phone Number",
      value: "+971 52 782 4304",
      color: "text-[#040404]",
      bgColor: "bg-slate-100"
    },
    {
      icon: Hash,
      label: "Internal Extension",
      value: "Ext. 225",
      color: "text-rose-500",
      bgColor: "bg-rose-50"
    },
    {
      icon: Mail,
      label: "Support Email",
      value: "support@canadiancmc.com",
      color: "text-amber-500",
      bgColor: "bg-amber-50"
    },
    {
      icon: MapPin,
      label: "Office Location",
      value: "CMC Head Office — Block C, Bldg. No. 21, 3rd Floor (Golden Beach Tower)",
      sub: "Back side of WTC / Lulu Side / Old FAB Bldg.",
      link: "https://goo.gl/maps/Kk1AKqSsKwptLegq9",
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
            <h1 className="text-xl font-black text-black font-bold tracking-tight uppercase">IT Help Desk</h1>
            <p className="text-xs text-black font-bold font-bold uppercase tracking-widest mt-1 opacity-60">Technical Support & Contact Information</p>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl p-8 relative overflow-hidden shadow-xl shadow-slate-900/10 mt-2">
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
                <p className="text-sm font-medium text-black font-bold mt-1 max-w-md">
                  Our IT support team is available to help you resolve any technical issues, account access problems, or system errors.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#b59662]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Working Hours</span>
              </div>
              <p className="text-sm font-medium text-black font-bold">Mon - Sun: 9:00 AM - 6:00 PM</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Currently Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Grid */}
        <div className="mt-4">
          <h3 className="text-xs font-black text-black font-bold uppercase tracking-[0.2em] mb-4 ml-1">Contact Details</h3>
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
                  <h4 className="text-[10px] font-black text-black font-bold uppercase tracking-widest mb-1">{info.label}</h4>
                  <p className="text-sm font-bold text-black font-bold">{info.value}</p>
                  {info.sub && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{info.sub}</p>}
                  {info.link && (
                    <a
                      href={info.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-800 transition-colors"
                    >
                      <MapPin className="w-3 h-3" /> View on Maps
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default HelpDesk;
