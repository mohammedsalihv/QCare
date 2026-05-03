import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../components/NotificationContext';
import DashboardLayout from '../components/DashboardLayout';
import Pagination from '../components/Pagination';
import Dropdown from '../components/Dropdown';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  ThumbsUp, 
  FileEdit, 
  Trash2,
  ChevronRight,
  ShieldCheck,
  FileText,
  Clock,
  ExternalLink,
  Upload,
  Download,
  X,
  Maximize,
  ArrowUpRight
} from 'lucide-react';
import { getAuthConfig } from '../utils/authConfig';

const DocumentLibrary = () => {
  const [activeTab, setActiveTab] = useState('Active');
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const recordsPerPage = 10;
  const { showNotification, confirm } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Policy',
    department: '',
    ref: '',
    revisedDate: '',
    classification: 'Restricted'
  });

  const typeOptions = [
    { label: 'Policy', value: 'Policy' },
    { label: 'Procedure', value: 'Procedure' },
    { label: 'Manual', value: 'Manual' },
    { label: 'Form', value: 'Form' }
  ];

  const classificationOptions = [
    { label: 'Restricted', value: 'Restricted' },
    { label: 'Confidential', value: 'Confidential' },
    { label: 'Secret', value: 'Secret' }
  ];

  const getClassificationColor = (classification) => {
    switch(classification) {
      case 'Secret':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'Confidential':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Restricted':
      default:
        return 'bg-blue-50 text-blue-600 border-blue-200';
    }
  };
  
  const getTypeColor = (type) => {
    switch(type) {
      case 'Policy':
        return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'Procedure':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Manual':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Form':
        return 'bg-cyan-50 text-cyan-600 border-cyan-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/documents', getAuthConfig());
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      setUserRole(parsed.role);
      setUserId(parsed.id || parsed._id);
    }
    fetchDocuments();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleEndorse = async (doc) => {
    try {
      await axios.put(`http://localhost:5000/api/documents/${doc._id}/endorse`, {}, getAuthConfig());
      const isEndorsed = doc.endorsedBy?.includes(userId);
      showNotification(isEndorsed ? 'Endorsement removed' : 'Document successfully endorsed', 'success');
      fetchDocuments();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error toggling endorsement', 'error');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (selectedFile) data.append('file', selectedFile);

      if (isEditing && currentDoc) {
        await axios.put(`http://localhost:5000/api/documents/${currentDoc._id}`, data, getAuthConfig());
        showNotification('Document updated successfully', 'success');
      } else {
        await axios.post('http://localhost:5000/api/documents', data, getAuthConfig());
        showNotification('Document added successfully', 'success');
      }
      setShowAddModal(false);
      setIsEditing(false);
      setCurrentDoc(null);
      setSelectedFile(null);
      setFormData({ name: '', type: 'Policy', department: '', ref: '', revisedDate: '', classification: 'Restricted' });
      fetchDocuments();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error occurred while saving', 'error');
    }
  };

  const handleEditClick = (doc) => {
    setCurrentDoc(doc);
    setFormData({
      name: doc.name,
      type: doc.type,
      department: doc.department,
      ref: doc.ref,
      revisedDate: new Date(doc.revisedDate).toISOString().split('T')[0],
      classification: doc.classification
    });
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleDeleteClick = (id) => {
    confirm({
      title: 'Delete Document',
      message: 'Are you sure you want to permanently delete this document?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`http://localhost:5000/api/documents/${id}`, getAuthConfig());
          showNotification('Document deleted successfully', 'success');
          fetchDocuments();
        } catch (err) {
          showNotification(err.response?.data?.message || 'Error deleting document', 'error');
        }
      }
    });
  };
  
  const filteredData = documents.filter(d => d.status === activeTab);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
              <span>Home</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#2dd4bf]">Document Library</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Document Library</h1>
          </div>
          
          <div className="flex items-center gap-3">

             {(userRole === 'admin' || userRole === 'superadmin') && (
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setCurrentDoc(null);
                    setSelectedFile(null);
                    setFormData({ name: '', type: 'Policy', department: '', ref: '', revisedDate: '', classification: 'Restricted' });
                    setShowAddModal(true);
                  }}
                  className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold transition-all shadow-lg shadow-slate-900/20 active:scale-95 group text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5" />
                    <span>Add Document</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
             )}
          </div>
        </div>

        {/* Filters and Table Section */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            {['Active', 'Draft'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-12 py-5 text-sm font-bold transition-all relative ${
                  activeTab === tab 
                  ? 'text-slate-900' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2dd4bf] rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="p-6 border-b border-slate-100 flex flex-col sm:row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search by document name or reference..."
                 className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#2dd4bf] transition-all text-sm"
               />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1300px]">
              <thead>
                <tr className="bg-slate-100/50">
                  <th className="w-16 px-4 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200 text-center">S.No</th>
                  <th className="px-4 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">Doc ID</th>
                  <th className="w-1/4 px-6 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">Document Name</th>
                  <th className="px-4 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">Type</th>
                  <th className="px-4 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">Classification</th>
                  <th className="px-4 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">Department</th>
                  <th className="px-4 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">Ref. No.</th>
                  <th className="px-4 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">Upload Date</th>
                  <th className="w-16 px-4 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200 text-center">Ver.</th>
                  <th className="px-4 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">Revised</th>
                  <th className="px-4 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200">Next Rev.</th>
                  <th className="w-40 px-4 py-5 text-[12px] font-bold text-slate-900 tracking-wider border-b-2 border-slate-200 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((doc, idx) => (
                  <tr key={doc._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-4 text-xs text-slate-600 text-center">{(currentPage - 1) * recordsPerPage + idx + 1}</td>
                    <td className="px-4 py-4 text-xs text-slate-600">{doc.documentId}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 group-hover:text-[#2dd4bf] transition-colors">{doc.name}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-lg text-xs border ${getTypeColor(doc.type)}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 border rounded-md text-[10px] tracking-wide ${getClassificationColor(doc.classification)}`}>
                        {doc.classification}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">{doc.department}</td>
                    <td className="px-4 py-4 text-xs text-slate-600">{doc.ref}</td>
                    <td className="px-4 py-4 text-xs text-slate-600">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-xs text-slate-600 text-center">{doc.version}</td>
                    <td className="px-4 py-4 text-xs text-slate-600">{new Date(doc.revisedDate).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                       <span className={`inline-flex px-2 py-1 rounded text-xs ${
                         activeTab === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                       }`}>
                         {new Date(doc.nextRevDate).toLocaleDateString()}
                       </span>
                    </td>
                    <td className="px-4 py-4 text-right pr-8">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            title="View" 
                            onClick={() => setSelectedDoc(doc)}
                            className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:border-slate-900 hover:text-white transition-all duration-300 active:scale-95 shadow-sm"
                          >
                             <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            title="Endorse" 
                            onClick={() => handleEndorse(doc)}
                            className={`w-9 h-9 rounded-md flex items-center justify-center transition-all duration-300 active:scale-95 ${
                              doc.endorsedBy?.includes(userId) 
                              ? 'bg-amber-600 border border-amber-600 text-white shadow-lg' 
                              : 'bg-white border border-slate-200 text-slate-400 hover:bg-amber-600 hover:border-amber-600 hover:text-white shadow-sm'
                            }`}
                          >
                             <ThumbsUp className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            title="Edit"
                            onClick={() => handleEditClick(doc)} 
                            className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:border-slate-900 hover:text-white transition-all duration-300 active:scale-95 shadow-sm"
                          >
                             <FileEdit className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            title="Delete" 
                            onClick={() => handleDeleteClick(doc._id)}
                            className="w-9 h-9 rounded-md border border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:bg-rose-600 hover:border-rose-600 hover:text-white transition-all duration-300 active:scale-95 shadow-sm"
                          >
                             <Trash2 className="w-4.5 h-4.5" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
                {currentRecords.length === 0 && (
                  <tr>
                    <td colSpan="11" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30">
                        <Search className="w-10 h-10" />
                        <span className="text-xs font-bold uppercase tracking-widest">No documents found matching your criteria</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Pagination 
            totalRecords={filteredData.length} 
            recordsPerPage={recordsPerPage} 
            currentPage={currentPage} 
            onPageChange={setCurrentPage} 
          />
        </div>

        {/* Layout Footer placeholder */}
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 py-8 border-t border-slate-200 text-slate-400">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2dd4bf]" />
              <span className="text-sm font-semibold tracking-tight text-slate-500">QCare Secure Repository</span>
           </div>
           <span className="text-xs font-medium uppercase tracking-widest">Compliance Management System</span>
        </div>
      </div>

      {/* View Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedDoc(null)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl relative w-full max-w-6xl h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between text-slate-900 relative bg-slate-50 shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight leading-tight">{selectedDoc.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Version {selectedDoc.version}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 border rounded font-bold uppercase ${getClassificationColor(selectedDoc.classification)}`}>
                        {selectedDoc.classification}
                      </span>
                    </div>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                 {selectedDoc.fileUrl && (
                   <button 
                     onClick={() => setIsFullscreen(true)}
                     className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-bold transition-all shadow-sm active:scale-95"
                   >
                     <Maximize className="w-4 h-4" />
                     <span className="text-xs uppercase tracking-wider">Fullscreen</span>
                   </button>
                 )}
                 <button 
                   onClick={() => {
                     if (selectedDoc.fileUrl) {
                       const link = document.createElement('a');
                       link.href = `http://localhost:5000${selectedDoc.fileUrl}`;
                       link.download = selectedDoc.name;
                       document.body.appendChild(link);
                       link.click();
                       document.body.removeChild(link);
                     } else {
                       showNotification('No file available to download', 'error');
                     }
                   }}
                   className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-bold transition-all shadow-sm active:scale-95"
                 >
                    <Download className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Download</span>
                 </button>
                 <button onClick={() => setSelectedDoc(null)} className="p-3 bg-white rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all border border-slate-200 shadow-sm active:scale-95">
                   <X className="w-5 h-5" />
                 </button>
               </div>
            </div>
            
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-slate-50">
               {/* Document Preview Area (Left) */}
               <div className="flex-1 p-6 overflow-hidden flex flex-col">
                 <div className="flex-1 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm flex items-center justify-center p-0 relative overflow-hidden group">
                   {selectedDoc.fileUrl ? (
                      <iframe 
                        src={`http://localhost:5000${selectedDoc.fileUrl}#zoom=FitH`} 
                        className="w-full h-full border-none"
                        title="Document Preview"
                      />
                   ) : (
                     <div className="absolute inset-0 bg-slate-50 flex flex-col items-center py-12 overflow-y-auto w-full">
                       <div className="w-[80%] max-w-2xl bg-white aspect-[1/1.4] shadow-md border border-slate-200 rounded-lg p-12">
                          <div className="w-full flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-8">
                             <h2 className="text-2xl font-black text-slate-900 tracking-tight">QCare Docs</h2>
                             <span className="text-sm font-bold font-mono text-slate-400">{selectedDoc.ref}</span>
                          </div>
                          <h1 className="text-3xl font-black text-slate-900 mb-6 leading-tight">{selectedDoc.name}</h1>
                          <p className="text-sm text-slate-600 leading-relaxed space-y-4 mb-8">
                             <div className="h-4 bg-slate-100 rounded w-full mb-3"></div>
                             <div className="h-4 bg-slate-100 rounded w-full mb-3"></div>
                             <div className="h-4 bg-slate-100 rounded w-[85%] mb-3"></div>
                             <div className="h-4 bg-slate-100 rounded w-[90%] mb-3"></div>
                             <div className="h-4 bg-slate-100 rounded w-[60%] mb-6"></div>
                          </p>
                          <div className="mt-12 pt-8 border-t border-slate-200 flex items-center justify-between">
                             <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                                <p className="text-xs font-bold text-slate-800">{selectedDoc.department}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Effective Date</p>
                                <p className="text-xs font-bold text-slate-800">{new Date(selectedDoc.revisedDate).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <div className="mt-12 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-lg text-center">
                            No physical file uploaded for this document
                          </div>
                       </div>
                     </div>
                   )}
                 </div>
               </div>

               {/* Document Metadata Sidebar (Right) */}
               <div className="w-full lg:w-80 bg-white border-l border-slate-100 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)]">
                 <div>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                     <ShieldCheck className="w-3.5 h-3.5" /> Core Details
                   </h4>
                   <div className="space-y-3">
                     <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                       <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase tracking-wider">
                         {selectedDoc.status}
                       </span>
                     </div>
                     <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Document Type</p>
                       <span className={`inline-flex px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${getTypeColor(selectedDoc.type)}`}>
                         {selectedDoc.type}
                       </span>
                     </div>
                   </div>
                 </div>

                 <div>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                     <Clock className="w-3.5 h-3.5" /> Lifecycle Info
                   </h4>
                   <div className="space-y-3">
                     <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revised On</p>
                       <span className="text-xs font-bold text-slate-700">{new Date(selectedDoc.revisedDate).toLocaleDateString()}</span>
                     </div>
                     <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Rev.</p>
                       <span className="text-xs font-bold text-emerald-600">{new Date(selectedDoc.nextRevDate).toLocaleDateString()}</span>
                     </div>
                     <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uploaded</p>
                       <span className="text-xs font-bold text-slate-700">{new Date(selectedDoc.uploadDate).toLocaleDateString()}</span>
                     </div>
                   </div>
                 </div>

                 <button 
                   onClick={() => {
                     const url = selectedDoc.fileUrl ? `http://localhost:5000${selectedDoc.fileUrl}` : window.location.href;
                     navigator.clipboard.writeText(url);
                     showNotification('Document link copied to clipboard', 'success');
                   }}
                   className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-[10px] font-black rounded-xl shadow-sm transition-all active:scale-[0.98] uppercase tracking-[0.1em] mt-auto"
                 >
                   Copy Document Link
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Document Viewer Overlay */}
      {isFullscreen && selectedDoc?.fileUrl && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
          <div className="flex justify-end p-2 bg-slate-900 shrink-0">
             <button onClick={() => setIsFullscreen(false)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 font-bold transition-all shadow-sm active:scale-95 border border-white/10">
               <span className="text-[10px] uppercase tracking-wider">Close</span>
               <X className="w-4 h-4" />
             </button>
          </div>
          <div className="flex-1 bg-white relative">
            <iframe 
              src={`http://localhost:5000${selectedDoc.fileUrl}#zoom=FitH`} 
              className="w-full h-full border-none absolute inset-0"
              title="Fullscreen Document Preview"
            />
          </div>
        </div>
      )}

      {/* Add Document Modal for Admins */}
      {showAddModal && (userRole === 'admin' || userRole === 'superadmin') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl relative w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between text-slate-900 relative bg-slate-50">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#2dd4bf]/10 flex items-center justify-center text-[#2dd4bf]">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight leading-tight">{isEditing ? 'Edit Document' : 'Add New Document'}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{isEditing ? 'Update Details' : 'Upload PDF, CSV or Excel'}</p>
                  </div>
               </div>
               <button onClick={() => setShowAddModal(false)} className="p-2 bg-white rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all border border-slate-200 shadow-sm">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Document Name</label>
                 <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Enter title" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#2dd4bf] transition-all text-xs font-bold text-slate-800" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5 z-40">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Type</label>
                   <Dropdown 
                     options={typeOptions} 
                     value={formData.type} 
                     onSelect={(val) => setFormData(prev => ({ ...prev, type: val }))} 
                     fullWidth
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Department</label>
                   <input type="text" name="department" value={formData.department} onChange={handleInputChange} required placeholder="e.g. IT" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#2dd4bf] transition-all text-xs font-bold text-slate-800" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Ref No</label>
                   <input type="text" name="ref" value={formData.ref} onChange={handleInputChange} required placeholder="e.g. CMC-001" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#2dd4bf] transition-all text-xs font-bold text-slate-800" />
                 </div>
                 <div className="space-y-1.5 z-30">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Classification</label>
                   <Dropdown 
                     options={classificationOptions} 
                     value={formData.classification} 
                     onSelect={(val) => setFormData(prev => ({ ...prev, classification: val }))} 
                     fullWidth
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Revised Date</label>
                   <input type="date" name="revisedDate" value={formData.revisedDate} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:bg-white focus:border-[#2dd4bf] transition-all text-xs font-bold text-slate-800" />
                 </div>
               </div>
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Upload File (PDF, CSV, Excel)</label>
                 <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-[#2dd4bf] transition-colors overflow-hidden relative">
                   <div className="flex flex-col items-center justify-center pt-5 pb-6">
                     <p className="text-xs font-bold text-slate-600">
                       {selectedFile ? selectedFile.name : (isEditing && currentDoc?.fileUrl ? 'Replace current file' : 'Click to upload PDF, CSV or Excel')}
                     </p>
                     {!selectedFile && <p className="text-[10px] text-slate-400 mt-1">.pdf, .csv, .xlsx</p>}
                   </div>
                   <input type="file" onChange={handleFileChange} accept=".pdf,.csv,.xlsx" className="hidden" />
                 </label>
               </div>
               <button type="submit" className="w-full py-3.5 bg-slate-900 text-white text-sm font-bold rounded-md shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98] mt-2">
                 {isEditing ? 'Save Changes' : 'Submit Document'}
               </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DocumentLibrary;
