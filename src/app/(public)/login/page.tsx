'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [requestAdmin, setRequestAdmin] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      setLoading(false)
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            request_admin: requestAdmin ? 'true' : 'false'
          }
        }
      })
      setLoading(false)
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4">
      <div className="w-full max-w-md p-8 rounded-3xl backdrop-blur-xl bg-white/10 shadow-2xl border border-white/20 relative overflow-hidden">
        
        {/* Glow effects */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/30 rounded-full blur-3xl -ml-16 -mt-16"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-500/30 rounded-full blur-3xl -mr-16 -mb-16"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white text-center mb-2 drop-shadow-md">
            {mode === 'login' ? 'Welcome Back' : 'Join the Club'}
          </h2>
          <p className="text-slate-300 text-center mb-8 text-sm">
            {mode === 'login' 
              ? 'Sign in to access your dashboard.' 
              : 'Create an account to track hikes and manage trips.'}
          </p>
          
        {error && <div className="bg-red-500/80 text-white p-3 rounded-xl mb-6 text-center text-sm backdrop-blur-md border border-red-400/50">{error}</div>}
          
            <form onSubmit={handleAuth} className="space-y-5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-slate-300 mb-1.5 text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                    placeholder="John Doe"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-slate-300 mb-1.5 text-sm font-medium">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                  placeholder="john@university.edu"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1.5 text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="requestAdmin"
                  checked={requestAdmin}
                  onChange={(e) => setRequestAdmin(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 bg-slate-900 border-white/10 rounded focus:ring-emerald-500/50"
                />
                <label htmlFor="requestAdmin" className="ml-2 text-sm text-slate-300 font-medium">
                  Request Core Team (Admin) Access
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-lg hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/25 mt-4 disabled:opacity-50"
              >
                {loading 
                  ? (mode === 'login' ? 'Signing in...' : 'Sending Code...') 
                  : (mode === 'login' ? 'Sign In' : 'Sign Up')}
              </button>
              
              <div className="text-center text-slate-400 text-sm mt-6">
                {mode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button 
                      type="button" 
                      onClick={() => { setMode('signup'); setError(null); }} 
                      className="text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button 
                      type="button" 
                      onClick={() => { setMode('login'); setError(null); }} 
                      className="text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </form>
        </div>
      </div>
    </div>
  )
}
