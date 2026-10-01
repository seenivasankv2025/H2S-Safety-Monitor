import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Activity, User, Key, ArrowRight, UserPlus } from 'lucide-react';
import { registerApi } from '../services/api';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccessId, setNewAccessId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('WORKER');
  const [newDepartment, setNewDepartment] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [createError, setCreateError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedUser = await login(username.trim(), password);
      const targetRoute = loggedUser.role?.toUpperCase() === 'MANAGER' ? '/manager/dashboard' : '/worker/dashboard';
      navigate(targetRoute);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreatingAccount(true);
    try {
      const accessId = newAccessId.trim();
      await registerApi(accessId, newPassword, newRole, newDepartment.trim());
      const createdUser = await login(accessId, newPassword);
      window.alert('The account was created');
      const targetRoute = createdUser.role?.toUpperCase() === 'MANAGER' ? '/manager/dashboard' : '/worker/dashboard';
      setUsername('');
      setPassword('');
      setNewAccessId('');
      setNewPassword('');
      setNewRole('WORKER');
      setNewDepartment('');
      setShowCreateAccount(false);
      navigate(targetRoute);
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Unable to create the account.');
    } finally {
      setCreatingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-2xl shadow-cyan-500/30 mb-4">
            <Activity className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">H₂S Safety Monitor</h1>
        </div>

        {/* Login Glass Card */}
        <div className="glass-panel p-8 rounded-3xl space-y-6 shadow-2xl">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">Username / Access ID</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 group"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In to Station'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80">
            {!showCreateAccount ? (
              <button
                type="button"
                onClick={() => setShowCreateAccount(true)}
                className="w-full py-2.5 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 rounded-xl text-xs font-mono transition flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Create Worker Account
              </button>
            ) : (
              <form onSubmit={handleCreateAccount} className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-cyan-400">Create Account</p>
                  <button type="button" onClick={() => setShowCreateAccount(false)} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
                </div>

                <div className="flex gap-3">
                  <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300">
                    <input
                      type="radio"
                      name="accountRole"
                      value="WORKER"
                      checked={newRole === 'WORKER'}
                      onChange={() => setNewRole('WORKER')}
                    />
                    Worker
                  </label>
                  <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300">
                    <input
                      type="radio"
                      name="accountRole"
                      value="MANAGER"
                      checked={newRole === 'MANAGER'}
                      onChange={() => setNewRole('MANAGER')}
                    />
                    Manager
                  </label>
                </div>

                {createError && <p className="text-xs text-red-300 font-mono">{createError}</p>}
                <input
                  type="text"
                  value={newAccessId}
                  onChange={(e) => setNewAccessId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                  placeholder="Create Access ID"
                  minLength={3}
                  required
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                  placeholder="Create Password"
                  minLength={6}
                  required
                />
                {newRole === 'WORKER' && (
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="Department (e.g. Refinery Maintenance)"
                    required
                  />
                )}
                <button
                  type="submit"
                  disabled={creatingAccount}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 font-semibold rounded-xl text-xs transition"
                >
                  {creatingAccount ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
