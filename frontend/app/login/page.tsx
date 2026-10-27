'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, AlertCircle, Loader2, GraduationCap, ChefHat, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const DEMO_ROLES = [
  {
    role: 'STUDENT',
    label: 'Student',
    icon: GraduationCap,
    email: 'student@canteenq.local',
    description: 'Browse menu, place orders, track queue',
    color: 'from-blue-500/20 to-blue-400/10',
    border: 'border-blue-500/30 hover:border-blue-400/60',
    badge: 'bg-blue-500/20 text-blue-400',
    iconColor: 'text-blue-400',
    redirect: '/dashboard',
  },
  {
    role: 'STAFF',
    label: 'Kitchen Chef',
    icon: ChefHat,
    email: 'staff@canteenq.local',
    description: 'Manage orders, update kitchen status',
    color: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    badge: 'bg-amber-500/20 text-amber-400',
    iconColor: 'text-amber-400',
    redirect: '/staff',
  },
  {
    role: 'ADMIN',
    label: 'Campus Admin',
    icon: ShieldCheck,
    email: 'admin@canteenq.local',
    description: 'Full analytics, reports & system control',
    color: 'from-purple-500/20 to-violet-500/10',
    border: 'border-purple-500/30 hover:border-purple-400/60',
    badge: 'bg-purple-500/20 text-purple-400',
    iconColor: 'text-purple-400',
    redirect: '/admin',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRoleSelect = (roleConfig: typeof DEMO_ROLES[0]) => {
    setSelectedRole(roleConfig.role);
    setEmail(roleConfig.email);
    setPassword('Password@123');
    setErrorMsg(null);
  };

  const handleRoleLogin = async (roleConfig: typeof DEMO_ROLES[0]) => {
    setLoadingRole(roleConfig.role);
    setErrorMsg(null);
    try {
      await login(roleConfig.email, 'Password@123');
      router.push(roleConfig.redirect);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Backend may not be running yet.');
      // In demo mode (no backend), mock the login locally
      setLoadingRole(null);
    } finally {
      setLoadingRole(null);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await login(email, password);
      if (user.role === 'STAFF') router.push('/staff');
      else if (user.role === 'ADMIN' || user.role === 'COLLEGE_ADMIN') router.push('/admin');
      else router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-10 bg-[#0d1117]">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg space-y-6">

        {/* Logo Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-primary/30 shadow-glow-blue">
              <Image
                src="/canteenq-logo.png"
                alt="CanteenQ"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading text-white">
              Welcome to <span className="text-primary">CanteenQ</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Good Food. Shorter Queues.</p>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="bg-[#161b27] rounded-3xl p-6 border border-[#1f2937] shadow-float space-y-5">
          <div className="text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select your role to sign in
            </p>
          </div>

          <div className="space-y-3">
            {DEMO_ROLES.map((roleConfig) => {
              const Icon = roleConfig.icon;
              const isSelected = selectedRole === roleConfig.role;
              const isThisLoading = loadingRole === roleConfig.role;

              return (
                <div key={roleConfig.role} className="space-y-2">
                  {/* Role card — click selects + shows email */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect(roleConfig)}
                    className={`w-full text-left p-4 rounded-2xl bg-gradient-to-r ${roleConfig.color} border transition-all duration-200 ${roleConfig.border} ${
                      isSelected ? 'ring-2 ring-offset-2 ring-offset-[#161b27] ring-primary/50 scale-[1.01]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center ${roleConfig.iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{roleConfig.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleConfig.badge}`}>
                            {roleConfig.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{roleConfig.description}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{roleConfig.email}</p>
                      </div>
                      {/* Enter button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRoleLogin(roleConfig);
                        }}
                        disabled={isThisLoading}
                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isThisLoading
                            ? 'opacity-60 cursor-not-allowed bg-white/5 text-slate-400'
                            : `bg-gradient-to-r ${roleConfig.color} border ${roleConfig.border} text-white hover:scale-105`
                        }`}
                      >
                        {isThisLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <span>Enter</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1f2937]" />
            <span className="text-[11px] text-slate-600 font-medium">or sign in manually</span>
            <div className="flex-1 h-px bg-[#1f2937]" />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Manual Login Form */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Campus Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@canteenq.local"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d1117] border border-[#1f2937] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0d1117] border border-[#1f2937] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500">
          New campus student?{' '}
          <Link href="/register" className="text-primary font-bold hover:text-primary-light transition-colors">
            Register your ID
          </Link>
        </p>

        <p className="text-center text-[11px] text-slate-700">
          All demo accounts use password: <code className="text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">Password@123</code>
        </p>
      </div>
    </div>
  );
}
