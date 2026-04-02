'use client'

import { apiFetch } from '@/lib/apiFetch'

import { useState } from 'react'
import * as React from 'react'
import { useNotification } from '@/contexts/NotificationContext'

interface SecurityModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SecurityModal({ isOpen, onClose }: SecurityModalProps) {
  const { addNotification } = useNotification()
  const [activeTab, setActiveTab] = useState<'password' | 'twofa' | 'sessions'>('password')
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [twoFAStatus, setTwoFAStatus] = useState({ enabled: false, methods: { authenticator: false, sms: false } })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Password Mismatch',
        message: 'New passwords do not match.',
        duration: 4000
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      addNotification({
        type: 'error',
        title: 'Weak Password',
        message: 'Password must be at least 8 characters long.',
        duration: 4000
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        addNotification({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please login to change password.',
          duration: 4000
        })
        return
      }

      const response = await apiFetch('/api/user/security/password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Password Updated',
          message: 'Your password has been successfully changed.',
          duration: 4000
        })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        onClose()
      } else {
        throw new Error(data.error || 'Failed to update password')
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update password. Please try again.',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'password', label: 'Password', icon: '🔒' },
    { id: 'twofa', label: '2FA', icon: '🛡️' },
    { id: 'sessions', label: 'Sessions', icon: '📱' },
  ]

  // Fetch sessions when tab changes to sessions
  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await apiFetch('/api/user/security/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  // Fetch 2FA status
  const fetch2FAStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await apiFetch('/api/user/security/2fa', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTwoFAStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error)
    }
  }

  // Revoke session
  const handleRevokeSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await apiFetch(`/api/user/security/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Session Revoked',
          message: 'The session has been terminated.',
          duration: 4000
        })
        fetchSessions()
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed',
        message: 'Failed to revoke session.',
        duration: 4000
      })
    }
  }

  // Enable 2FA
  const handleEnable2FA = async (method: 'authenticator' | 'sms') => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await apiFetch('/api/user/security/2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ method })
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: '2FA Setup',
          message: `${method === 'authenticator' ? 'Authenticator' : 'SMS'} 2FA setup initiated.`,
          duration: 4000
        })
        fetch2FAStatus()
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed',
        message: 'Failed to enable 2FA.',
        duration: 4000
      })
    }
  }

  // Load data when tab changes
  React.useEffect(() => {
    if (isOpen) {
      if (activeTab === 'sessions') {
        fetchSessions()
      } else if (activeTab === 'twofa') {
        fetch2FAStatus()
      }
    }
  }, [activeTab, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="glass w-full sm:max-w-lg rounded-xl sm:rounded-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col border border-border shadow-premium-lg animate-scale-in">
        <div className="flex-shrink-0 glass-premium border-b border-border px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Security</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 border-b border-border">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Current Password *</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">New Password *</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="input-premium w-full px-3 py-2.5 sm:py-3 text-sm sm:text-base"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4 sm:pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 sm:py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all duration-200 hover:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'twofa' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">Two-Factor Authentication</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">Add an extra layer of security to your account</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg sm:rounded-xl">
                  <div>
                    <p className="text-sm sm:text-base font-medium text-foreground">Authenticator App</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Use Google Authenticator or similar</p>
                  </div>
                  <button 
                    onClick={() => handleEnable2FA('authenticator')}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    {twoFAStatus.methods.authenticator ? 'Enabled' : 'Enable'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg sm:rounded-xl">
                  <div>
                    <p className="text-sm sm:text-base font-medium text-foreground">SMS Verification</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Receive codes via text message</p>
                  </div>
                  <button 
                    onClick={() => handleEnable2FA('sms')}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-secondary text-foreground rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    {twoFAStatus.methods.sms ? 'Enabled' : 'Setup'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">Active Sessions</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage your active login sessions</p>
              </div>

              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg sm:rounded-xl">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-medium text-foreground flex items-center gap-2">
                        {session.device}
                        {session.current && (
                          <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{session.location} • {session.lastActive}</p>
                    </div>
                  </div>
                  {!session.current && (
                    <button 
                      onClick={() => handleRevokeSession(session.id)}
                      className="px-2 py-1 sm:px-3 sm:py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}