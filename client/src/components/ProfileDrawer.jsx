import React from 'react';
import { 
  X, 
  User, 
  Mail, 
  Shield, 
  Building2,
  CalendarDays,
  Camera,
  RefreshCcw,
  Plus,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { useNotification } from './NotificationContext';
import defaultProfile from '../assets/default_profile.png';

const ProfileDrawer = ({ isOpen, onClose, user = { name: 'User', id: 'N/A', dept: 'N/A', role: 'N/A', email: 'N/A', photo: null } }) => {
  const { showNotification, confirm } = useNotification();
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const handleClose = () => {
    onClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showNotification('Image size should be less than 2MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    setUploading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const { data } = await axios.put('http://192.168.1.160:5000/api/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      
      // Update local storage
      const newUserInfo = { ...userInfo, photo: data.photo };
      localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
      
      showNotification('Profile photo updated successfully', 'success');
      
      // Delay reload so notification can be seen
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to upload photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation(); // Avoid triggering file upload input click
    confirm({
      title: 'Remove Profile Photo?',
      message: 'Are you sure you want to remove your profile photo?',
      type: 'warning',
      onConfirm: async () => {
        setUploading(true);
        try {
          const userInfo = JSON.parse(localStorage.getItem('userInfo'));
          const formData = new FormData();
          formData.append('removePhoto', 'true');

          const { data } = await axios.put('http://192.168.1.160:5000/api/users/profile', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${userInfo.token}`
            }
          });
          
          // Update local storage
          const newUserInfo = { ...userInfo, photo: "" };
          localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
          
          showNotification('Profile photo removed successfully', 'success');
          
          // Delay reload so notification can be seen
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          showNotification(error.response?.data?.message || 'Failed to remove photo', 'error');
        } finally {
          setUploading(false);
        }
      }
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-white/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-white shadow-2xl z-[70] transition-transform duration-500 ease-in-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-extrabold text-black font-bold">User Profile</h2>
            <button 
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-white hover:shadow-sm text-black font-bold hover:text-black font-bold transition-all active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Profile Section */}
          <div className="p-8 flex flex-col items-center text-center">
            <div className="relative mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] p-1 shadow-xl shadow-[var(--color-primary)]/20 relative">
                <div className="w-full h-full rounded-[20px] bg-white p-1 overflow-hidden relative">
                   <img 
                      src={user?.photo ? `http://192.168.1.160:5000${user.photo}` : defaultProfile}
                      alt={user?.name || 'User'}
                      className="w-full h-full object-cover rounded-[18px]"
                    />
                   
                   {/* Overlay */}
                   <div className={`absolute inset-0 bg-white/40 transition-opacity flex items-center justify-center rounded-[18px] ${
                     uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                   }`}>
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                           <RefreshCcw className="w-6 h-6 text-white animate-spin" />
                           <span className="text-[8px] font-black text-white uppercase tracking-widest">Uploading...</span>
                        </div>
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                   </div>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[var(--color-primary)] border-4 border-white flex items-center justify-center shadow-lg text-black font-bold">
                 <Plus className="w-3.5 h-3.5 font-black" />
              </div>
            </div>

            {user.photo && (
              <button
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="mb-4 px-3 py-1.5 rounded-xl border border-red-200 text-red-500 hover:text-white hover:bg-red-500 transition-all font-bold text-xs flex items-center gap-1.5 hover:shadow-lg hover:shadow-red-500/10 active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Photo
              </button>
            )}
            
            <h3 className="text-2xl font-bold text-black font-bold tracking-tight">{user.name}</h3>
            <p className="text-sm font-semibold text-[var(--color-primary)] tracking-[0.2em] mt-1 opacity-90">
  {user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}
</p>
            
          </div>

          {/* Details Section */}
          <div className="px-8 pb-8 space-y-6">
            <div className="space-y-4">
               <h4 className="text-[11px] font-bold text-black font-bold uppercase tracking-widest flex items-center gap-2">
                 Professional Information
                 <div className="flex-1 h-[1px] bg-slate-100"></div>
               </h4>
               
               <div className="grid grid-cols-1 gap-4">
                 <DetailItem label="Employee ID" value={user.id} icon={User} />
                 <DetailItem label="Department" value={user.dept} icon={Building2} />
                 <DetailItem label="Official Email" value={user.email} icon={Mail} />

                 <DetailItem 
                   label="Last Login" 
                   value={user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-US', {
                     day: '2-digit',
                     month: 'short',
                     year: 'numeric',
                     hour: '2-digit',
                     minute: '2-digit',
                     hour12: true
                   }) : 'First Session'} 
                   icon={CalendarDays} 
                 />
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const DetailItem = ({ label, value, icon: Icon, status }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-sm">
    <div className="p-2.5 rounded-xl bg-white text-black font-bold shadow-inner-sm">
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-black font-bold uppercase tracking-wider leading-none mb-1">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-black font-bold">{value}</span>
        {status && (
          <span className="text-[10px] font-bold text-emerald-500 tracking-tighter">
            {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default ProfileDrawer;
