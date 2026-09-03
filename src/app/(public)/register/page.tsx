"use client";

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name');
    const universityId = formData.get('universityId');
    const year = formData.get('year');
    const department = formData.get('department');
    const email = formData.get('email');
    const reason = formData.get('reason');

    const supabase = createClient();

    const { error } = await supabase.from('applications').insert([
      { name, universityId, year, department, email, reason }
    ]);

    setIsSubmitting(false);

    if (error) {
      console.error('Error inserting application:', error);
      alert('Failed to submit application.');
    } else {
      setIsSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-gray-100">
      <div className="max-w-xl w-full space-y-8 bg-gray-900 p-8 sm:p-10 rounded-2xl shadow-2xl border border-gray-800">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
            Join the Hiking Club
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Adventure awaits. Apply for membership today.
          </p>
        </div>
        
        {isSuccess ? (
          <div className="mt-8 text-center p-8 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
            <h3 className="text-2xl font-bold text-emerald-400 mb-2">Application Received!</h3>
            <p className="text-gray-300">Thank you for applying. We will be in touch soon.</p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">Full Name</label>
                <input id="name" name="name" type="text" required className="mt-1 block w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 shadow-sm focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]" placeholder="John Doe" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="universityId" className="block text-sm font-medium text-gray-300">University ID</label>
                  <input id="universityId" name="universityId" type="text" required className="mt-1 block w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 shadow-sm focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]" placeholder="123456789" />
                </div>
                
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-300">Year</label>
                  <select id="year" name="year" className="mt-1 block w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 shadow-sm focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <option>Freshman</option>
                    <option>Sophomore</option>
                    <option>Junior</option>
                    <option>Senior</option>
                    <option>Graduate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-300">Department</label>
                  <input id="department" name="department" type="text" required className="mt-1 block w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 shadow-sm focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]" placeholder="Computer Science" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
                  <input id="email" name="email" type="email" required className="mt-1 block w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 shadow-sm focus:shadow-[0_0_15px_rgba(16,185,129,0.3)]" placeholder="john@university.edu" />
                </div>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-300">Why do you want to join the Hiking Club?</label>
                <textarea id="reason" name="reason" rows={4} required className="mt-1 block w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 shadow-sm focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] resize-none" placeholder="I love the outdoors and want to meet new people..."></textarea>
              </div>
            </div>

            <div>
              <button type="submit" disabled={isSubmitting} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-emerald-500 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="relative z-10 font-bold text-lg">{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
                {!isSubmitting && <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-emerald-600 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
