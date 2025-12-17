'use client';

import { useState } from 'react';
import { X, Lock, Trophy, Palette } from 'lucide-react';
import { verifyPassword, changePassword } from '@/lib/auth';
import { useDataCache } from '@/lib/DataCacheContext';
import SportsTeamSettingsContent from './SportsTeamSettingsContent';
import AppearanceSettingsContent from './AppearanceSettingsContent';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'password' | 'sports' | 'appearance';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('password');
  const { teamPreferences, setTeamPreferences, setSports } = useDataCache();

  // Password reset state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters');
      return;
    }

    setLoading(true);

    try {
      const isValid = await verifyPassword(currentPassword);
      if (!isValid) {
        setError('Current password is incorrect');
        setLoading(false);
        return;
      }

      const changed = await changePassword(currentPassword, newPassword);
      if (changed) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
      } else {
        setError('Failed to change password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'password'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Lock className="w-4 h-4" />
              Password
            </button>
            <button
              onClick={() => setActiveTab('sports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'sports'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Sports Teams
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'appearance'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Palette className="w-4 h-4" />
              Appearance
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'password' ? (
            <div className="max-w-md">
              {success ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">Password changed successfully!</p>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      required
                      minLength={4}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      required
                      minLength={4}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : activeTab === 'sports' ? (
            <SportsTeamSettingsContent
              selectedTeams={teamPreferences.selectedTeams}
              favoriteTeams={teamPreferences.favoriteTeams}
              onTeamsChange={(teams) => {
                setTeamPreferences({ ...teamPreferences, selectedTeams: teams });
                // Reset sports cache to force refresh
                setSports({ teams: [], timestamp: 0 });
              }}
              onFavoritesChange={(teams) => {
                setTeamPreferences({ ...teamPreferences, favoriteTeams: teams });
              }}
            />
          ) : (
            <AppearanceSettingsContent />
          )}
        </div>
      </div>
    </div>
  );
}

