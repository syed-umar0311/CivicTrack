import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileText, MapPin, Tag, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon, Video, X, Upload } from 'lucide-react';
import { ComplaintCategory } from '../types';

const complaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Please provide more details (min 10 chars)").max(2000),
  category: z.enum(['water', 'garbage', 'electricity', 'infrastructure', 'other'] as const),
  location: z.string().min(5, "Please enter a valid location/block/house info").max(500),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

export const ComplaintForm: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      category: 'other',
    }
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Limit to 50MB
      if (file.size > 50 * 1024 * 1024) {
        alert("File is too large. Max 50MB allowed.");
        return;
      }
      setAttachment(file);
    }
  };

  const onSubmit = async (data: ComplaintFormData) => {
    if (!user || !profile) return;
    setIsSubmitting(true);
    let attachmentUrl = '';
    let attachmentType: 'image' | 'video' | undefined = undefined;

    try {
      // 1. Upload file if exists
      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const fileName = `${user.uid}_${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, `complaints/${fileName}`);
        
        const snapshot = await uploadBytes(storageRef, attachment);
        attachmentUrl = await getDownloadURL(snapshot.ref);
        attachmentType = attachment.type.startsWith('video/') ? 'video' : 'image';
      }

      // 2. Save to Firestore
      await addDoc(collection(db, 'complaints'), {
        ...data,
        attachmentUrl,
        attachmentType,
        userId: user.uid,
        userName: profile.name,
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("Failed to subit complaint. This might be due to a storage quota or permission issue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-emerald-100 p-6 rounded-full mb-6 animate-bounce">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Complaint Submitted!</h2>
        <p className="text-gray-600 max-w-md">
          Your report has been successfully recorded. Our management team will review it shortly. Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-8 sm:p-12">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-slate-900 p-2.5 rounded-lg">
            <FileText className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Citizen Feedback</h1>
            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-widest mt-1">Lodge a new official report</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Tag className="h-3 w-3" /> Report Title
            </label>
            <input
              {...register('title')}
              placeholder="e.g., Streetlight failure at Block B Entry"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 bg-slate-50/50"
            />
            {errors.title && (
              <p className="text-[11px] text-red-500 mt-1 font-bold flex items-center gap-1 uppercase tracking-tighter">
                <AlertCircle className="h-3 w-3" /> {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Tag className="h-3 w-3" /> Dept Category
              </label>
              <select
                {...register('category')}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none bg-slate-50/50"
              >
                <option value="water">Water & Sanitation</option>
                <option value="garbage">Waste Management</option>
                <option value="electricity">Power & Lighting</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="other">General Services</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Precise Area
              </label>
              <input
                {...register('location')}
                placeholder="e.g. Block C, Sector 4, Street 2"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-slate-50/50"
              />
              {errors.location && (
                <p className="text-[11px] text-red-500 mt-1 font-bold flex items-center gap-1 uppercase tracking-tighter">
                  <AlertCircle className="h-3 w-3" /> {errors.location.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Issue Description</label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Provide a specific account of the issue..."
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none bg-slate-50/50"
            />
            {errors.description && (
              <p className="text-[11px] text-red-500 mt-1 font-bold flex items-center gap-1 uppercase tracking-tighter">
                <AlertCircle className="h-3 w-3" /> {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Upload className="h-3 w-3" /> Media Attachments
            </label>
            
            {!attachment ? (
              <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-8 transition-all hover:bg-slate-50 hover:border-emerald-300 group cursor-pointer">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={onFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-emerald-100 transition-colors">
                    <ImageIcon className="h-6 w-6 text-slate-400 group-hover:text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Select Issue Photo or Video</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">Support for JPG, PNG, MP4 (Max 50MB)</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-100 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg">
                    {attachment.type.startsWith('video/') ? (
                      <Video className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{attachment.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{(attachment.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="p-1.5 hover:bg-white rounded-full transition-all text-slate-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-slate-900 text-emerald-500 font-bold uppercase tracking-widest rounded-lg hover:bg-slate-800 focus:ring-4 focus:ring-slate-100 transition-all disabled:opacity-50 flex items-center justify-center border border-slate-800 shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Transmitting...
                </>
              ) : (
                "Finalize Submission"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
