import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Complaint, ComplaintStatus } from '../types';
import { ComplaintCard } from '../components/dashboard/ComplaintCard';
import { StatusBadge } from '../components/dashboard/StatusBadge';
import { formatDate } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { 
  Plus, Search, Filter, AlertCircle, CheckCircle2, 
  Clock, Activity, BarChart3, List, X, ExternalLink, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('Pending');

  useEffect(() => {
    if (!user || authLoading) return;

    let q = query(
      collection(db, 'complaints'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    if (!isAdmin) {
      q = query(
        collection(db, 'complaints'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Complaint[];
      setComplaints(data);
      setLoading(false);
    }, (error) => {
      console.error("Snapshot error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, isAdmin]);

  const handleUpdateStatus = async () => {
    if (!selectedComplaint?.id) return;
    try {
      await updateDoc(doc(db, 'complaints', selectedComplaint.id), {
        status: newStatus,
        adminComment: adminComment || selectedComplaint.adminComment || '',
        updatedAt: serverTimestamp(),
      });
      setSelectedComplaint(null);
      setAdminComment('');
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update status.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Activity className="h-8 w-8 text-emerald-600 animate-pulse" />
      </div>
    );
  }

  // Analytics Helpers
  const statusCounts = {
    'Pending': complaints.filter(c => c.status === 'Pending').length,
    'In Progress': complaints.filter(c => c.status === 'In Progress').length,
    'Resolved': complaints.filter(c => c.status === 'Resolved').length,
  };

  const categoryCounts = complaints.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const barData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981'];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {isAdmin ? 'Management Portal' : 'My Applications'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAdmin 
              ? 'Oversee all community issues and coordinate resolutions.' 
              : 'Track the status of your reported problems and submit new ones.'}
          </p>
        </div>
        {!isAdmin && (
          <Link
            to="/report"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
          >
            <Plus className="h-5 w-5" />
            New Complaint
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Reports</p>
          <h3 className="text-2xl font-bold text-slate-900 leading-none">{complaints.length}</h3>
          <p className="text-emerald-600 text-[10px] font-bold mt-2 uppercase">↑ Sync Active</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Pending</p>
          <h3 className="text-2xl font-bold text-slate-900 leading-none">{statusCounts['Pending']}</h3>
          <p className="text-red-500 text-[10px] font-bold mt-2 uppercase">Requires Attention</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">In Progress</p>
          <h3 className="text-2xl font-bold text-slate-900 leading-none">{statusCounts['In Progress']}</h3>
          <p className="text-amber-600 text-[10px] font-bold mt-2 uppercase">Active Coordination</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Resolved</p>
          <h3 className="text-2xl font-bold text-slate-900 leading-none">{statusCounts['Resolved']}</h3>
          <p className="text-emerald-600 text-[10px] font-bold mt-2 uppercase font-mono">{( (statusCounts['Resolved'] / (complaints.length || 1)) * 100).toFixed(0)}% Efficiency</p>
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Charts */}
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Category Overview
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Activity className="h-5 w-5 text-emerald-600" />
              Efficiency Status
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Complaint List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <List className="h-5 w-5 text-emerald-600" />
            Recent Reports
          </div>
        </div>

        {complaints.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4 font-light">
              <FileText className="w-full h-full" />
            </div>
            <p className="text-gray-500 font-medium">No complaints found.</p>
            {!isAdmin && (
              <Link to="/report" className="text-emerald-600 font-bold mt-2 inline-block">
                Start by filing your first report
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((complaint) => (
              <ComplaintCard 
                key={complaint.id} 
                complaint={complaint} 
                onClick={() => isAdmin && setSelectedComplaint(complaint)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Admin Quick View / Edit Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedComplaint(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Review Complaint</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">ID: {selectedComplaint.id}</p>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="p-2 hover:bg-white rounded-full transition-all"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="text-2xl font-bold text-gray-900">{selectedComplaint.title}</h4>
                  <StatusBadge status={selectedComplaint.status} />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5 font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-xs">
                    By: {selectedComplaint.userName}
                  </span>
                  <span className="flex items-center gap-1.5 italic">
                    <Clock className="h-3.5 w-3.5" /> {formatDate(selectedComplaint.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl text-sm italic">
                  "{selectedComplaint.description}"
                </p>
                {selectedComplaint.attachmentUrl && (
                  <div className="rounded-2xl overflow-hidden border border-gray-100 bg-slate-50">
                    {selectedComplaint.attachmentType === 'video' ? (
                      <video 
                        src={selectedComplaint.attachmentUrl} 
                        controls 
                        className="w-full h-auto max-h-64"
                      />
                    ) : (
                      <img 
                        src={selectedComplaint.attachmentUrl} 
                        alt="Complaint Attachment" 
                        className="w-full h-auto max-h-64 object-contain mx-auto"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              <div className="space-y-4">
                <h5 className="font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  Update Status & Response
                </h5>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Resolution State</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Admin Comment</label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Add your response or resolution details..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-24 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
