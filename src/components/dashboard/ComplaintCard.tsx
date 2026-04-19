import React from 'react';
import { Complaint } from '../../types';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../../lib/utils';
import { MapPin, Calendar, MessageSquare, ExternalLink } from 'lucide-react';

interface ComplaintCardProps {
  complaint: Complaint;
  onClick?: () => void;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1">
            REF: #{complaint.id?.slice(-6).toUpperCase()}
          </span>
          <StatusBadge status={complaint.status} />
        </div>
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          <Calendar className="h-3 w-3 inline mr-1" />
          {formatDate(complaint.createdAt).split(',')[0]}
        </div>
      </div>

      <h3 className="text-base font-bold text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors leading-tight">
        {complaint.title}
      </h3>
      
      <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1 font-medium">
        {complaint.description}
      </p>

      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
          <MapPin className="h-3 w-3 text-emerald-500" />
          {complaint.location}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md capitalize">
          <MessageSquare className="h-3 w-3 text-emerald-500" />
          {complaint.category}
        </div>
      </div>

      {complaint.adminComment && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-[11px] font-bold text-emerald-800 bg-emerald-50/50 p-2 rounded-lg leading-relaxed">
            <span className="uppercase text-[9px] block mb-1 opacity-60">Management Update:</span> {complaint.adminComment}
          </p>
        </div>
      )}
    </div>
  );
};
