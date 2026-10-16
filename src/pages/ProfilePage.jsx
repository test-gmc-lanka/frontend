import { useState, useEffect, useRef } from 'react';
import { FiUser, FiLock, FiSave, FiPhone, FiMapPin, FiCamera } from 'react-icons/fi';
import { getProfile, updateProfile, changePassword, uploadAvatar, removeAvatar } from '../api/users';
import { getErrorMessage } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Avatar from '../components/common/Avatar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // matches spring.servlet.multipart.max-file-size

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const { updateUser } = useAuth();

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
      updateUser({ name: data.name });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('Photo must be 10 MB or smaller');
      return;
    }
    setUploadingPhoto(true);
    try {
      const { data } = await uploadAvatar(file);
      setProfile(data);
      updateUser({ profileImageUrl: data.profileImageUrl });
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const [confirmRemovePhoto, setConfirmRemovePhoto] = useState(false);

  const handleRemovePhoto = async () => {
    setConfirmRemovePhoto(false);
    setUploadingPhoto(true);
    try {
      const { data } = await removeAvatar();
      setProfile(data);
      updateUser({ profileImageUrl: null });
      toast.success('Profile photo removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingPhoto(false);
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
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar src={profile?.profileImageUrl} name={profile?.name} size={80} style={{ opacity: uploadingPhoto ? 0.5 : 1 }} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              title={profile?.profileImageUrl ? 'Change photo' : 'Upload photo'}
              aria-label={profile?.profileImageUrl ? 'Change profile photo' : 'Upload profile photo'}
              style={{
                position: 'absolute', right: -2, bottom: -2, width: 30, height: 30,
                borderRadius: '50%', border: '2px solid var(--bg-secondary)',
                background: 'var(--color-primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: uploadingPhoto ? 'wait' : 'pointer',
              }}
            >
              <FiCamera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{profile?.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{profile?.email}</div>
            <span className={`badge badge-${profile?.role?.toLowerCase()}`} style={{ marginTop: '0.25rem', background: 'rgba(0,200,215,0.15)', color: 'var(--color-primary)' }}>
              {profile?.role}
            </span>
            <div style={{ fontSize: '0.78rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>
              {uploadingPhoto ? 'Uploading photo...' : (
                <>
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={linkButtonStyle}>
                    {profile?.profileImageUrl ? 'Change photo' : 'Upload photo'}
                  </button>
                  {profile?.profileImageUrl && (
                    <> · <button type="button" onClick={() => setConfirmRemovePhoto(true)} style={{ ...linkButtonStyle, color: 'var(--danger)' }}>Remove photo</button></>
                  )}
                </>
              )}
            </div>
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
                    placeholder="Min. 8 characters"
                    minLength={8}
                    maxLength={72}
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
      {confirmRemovePhoto && (
        <ConfirmDialog
          title="Remove your profile photo?"
          message="Your initial will be shown instead."
          confirmLabel="Remove photo"
          tone="danger"
          onConfirm={handleRemovePhoto}
          onCancel={() => setConfirmRemovePhoto(false)}
        />
      )}
    </div>
  );
}

const linkButtonStyle = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  color: 'var(--color-primary)', fontSize: 'inherit', fontWeight: 600,
};

const iconStyle = {
  position: 'absolute', left: '0.875rem', top: '50%',
  transform: 'translateY(-50%)', color: 'var(--text-muted)',
};
