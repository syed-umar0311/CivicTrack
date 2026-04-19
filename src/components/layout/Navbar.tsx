import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, LayoutDashboard, FileText, Settings, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
          CC
        </div>
        <div className="overflow-hidden">
          <h1 className="text-white font-bold leading-none truncate">CitizenConnect</h1>
          <p className="text-[10px] opacity-60 uppercase tracking-wider mt-1 truncate">Management Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-2 bg-slate-800 text-white rounded-md text-sm font-medium transition-all"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        
        {!isAdmin && (
          <Link
            to="/report"
            className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 hover:text-white rounded-md text-sm transition-colors"
          >
            <FileText className="h-4 w-4" />
            New Complaint
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="bg-slate-800 rounded-lg p-3 text-xs">
          <p className="text-slate-400">Logged in as {profile?.role}</p>
          <p className="text-white font-medium truncate">{profile?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-sm transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
};
