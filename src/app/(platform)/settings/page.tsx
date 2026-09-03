"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface User {
  id: string;
  name: string;
  role: string;
  admin_request_status: string;
}

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const { data: userData } = await supabase.from('users').select('role').eq('id', session.user.id).single();
      
      if (userData && userData.role === 'admin') {
        setIsAdmin(true);
        const { data } = await supabase.from('users').select('*');
        if (data) setUsers(data as User[]);
      }
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('users').update({ role: 'admin', admin_request_status: 'approved' }).eq('id', id);
    if (!error) fetchUsers();
    else alert("Error approving admin: " + error.message);
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from('users').update({ admin_request_status: 'rejected' }).eq('id', id);
    if (!error) fetchUsers();
  };

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 text-slate-500 flex justify-center items-center font-sans tracking-wide">Loading portal...</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center font-sans">
        <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-slate-200 mb-4 max-w-md w-full">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">Restricted Area</h2>
          <p className="text-slate-500 text-sm">You must be a Super Admin to access the management portal.</p>
        </div>
      </div>
    );
  }

  const pendingRequests = users.filter(u => u.admin_request_status === 'pending');
  const otherUsers = users.filter(u => u.admin_request_status !== 'pending');

  return (
    <div className="bg-slate-950 min-h-screen font-sans text-slate-200">
      <div className="max-w-6xl mx-auto py-12 px-6 sm:px-8 space-y-12">
        
        <header className="border-b border-slate-800 pb-8">
          <h1 className="text-3xl font-light text-white tracking-tight">System Configuration</h1>
          <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest font-semibold">User Access Control</p>
        </header>

        {pendingRequests.length > 0 && (
          <section>
            <h2 className="text-lg font-medium text-emerald-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Action Required: Pending Approvals
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
              <ul className="divide-y divide-slate-800">
                {pendingRequests.map(user => (
                  <li key={user.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-medium text-white">{user.name}</p>
                      <p className="text-sm text-slate-400">Requested Core Team Access</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleReject(user.id)} className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white rounded-md transition-colors">
                        Deny Request
                      </button>
                      <button onClick={() => handleApprove(user.id)} className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md shadow-sm transition-colors">
                        Approve (Click to approve by me)
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-medium text-slate-300 mb-4">Directory</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Request Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {otherUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-5 font-medium text-white">{user.name}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-500 capitalize">{user.admin_request_status}</td>
                    </tr>
                  ))}
                  {otherUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No active directory users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
