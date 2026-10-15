import { useState, useEffect } from 'react';
import { FiUser, FiLock, FiSave, FiPhone, FiMapPin } from 'react-icons/fi';
import { getProfile, updateProfile, changePassword } from '../api/users';
import { getErrorMessage } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then((r) => {
        setProfile(r.data);
        setProfileForm({ name: r.data.name || '', phone: r.data.phone || '', address: r.data.address || '' });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await updateProfile(profileForm);
      setProfile(data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await changePassword(pwdForm);
      toast.success('Password changed successfully!');
      setPwdForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="page-header">
          <h1 className="page-title flex items-center gap-3"><FiUser /> Profile Settings</h1>
        </div>

        {/* Avatar */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{profile?.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{profile?.email}</div>
            <span className={`badge badge-${profile?.role?.toLowerCase()}`} style={{ marginTop: '0.25rem', background: 'rgba(0,200,215,0.15)', color: 'var(--color-primary)' }}>
              {profile?.role}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
            Personal Info
          </button>
          <button className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
            Change Password
          </button>
        </div>

        {tab === 'profile' && (
          <div className="card">
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <FiUser style={iconStyle} />
                  <input type="text" className="form-input" style={{ paddingLeft: '2.5rem' }}
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={profile?.email} disabled />
                <span className="form-hint">Email cannot be changed</span>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <FiPhone style={iconStyle} />
                  <input type="tel" className="form-input" style={{ paddingLeft: '2.5rem' }}
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="Your phone number"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <div style={{ position: 'relative' }}>
                  <FiMapPin style={{ ...iconStyle, top: '0.875rem', transform: 'none' }} />
                  <textarea className="form-input" style={{ paddingLeft: '2.5rem', resize: 'vertical' }}
                    rows={3}
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="Your address"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {tab === 'password' && (
          <div className="card">
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={iconStyle} />
                  <input type="password" className="form-input" style={{ paddingLeft: '2.5rem' }}
                    value={pwdForm.currentPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={iconStyle} />
                  <input type="password" className="form-input" style={{ paddingLeft: '2.5rem' }}
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                    placeholder="Min. 6 characters"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <FiLock /> {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const iconStyle = {
  position: 'absolute', left: '0.875rem', top: '50%',
  transform: 'translateY(-50%)', color: 'var(--text-muted)',
};
