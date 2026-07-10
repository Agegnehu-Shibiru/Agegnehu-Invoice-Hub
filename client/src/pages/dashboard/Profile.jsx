import { useForm } from 'react-hook-form';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { userApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Camera, Loader2, Save, Lock, User } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const { register: regProfile, handleSubmit: handleProfile, formState: { isSubmitting: submittingProfile } } = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const { register: regPass, handleSubmit: handlePass, formState: { errors: passErrors, isSubmitting: submittingPass }, reset: resetPass } = useForm();

  const onProfileSubmit = async (data) => {
    try {
      const res = await userApi.updateMe(data);
      updateUser(res.data.data.user);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) { toast.error('Passwords do not match'); return; }
    try {
      await userApi.updatePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password updated!');
      resetPass();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await userApi.uploadAvatar(formData);
      updateUser({ avatar: res.data.data.avatar });
      toast.success('Avatar updated!');
    } catch { toast.error('Upload failed'); } finally { setUploading(false); }
  };

  return (
    <div className="animate-slide-up space-y-6 max-w-2xl">
      <h1 className="page-title">Profile</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[['profile', 'Profile', User], ['password', 'Password', Lock]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold overflow-hidden">
                {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase()}
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white hover:bg-primary-700 shadow-md transition-colors">
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role} · {user?.subscription?.plan} plan</p>
            </div>
          </div>

          <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input {...regProfile('name')} className="input" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input value={user?.email || ''} disabled className="input" />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed here. Contact support.</p>
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input {...regProfile('phone')} className="input" placeholder="+1 555 000 0000" />
            </div>
            <button type="submit" disabled={submittingProfile} className="btn-primary">
              {submittingProfile ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Changes
            </button>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card p-6">
          <h2 className="section-title mb-5">Change Password</h2>
          <form onSubmit={handlePass(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input {...regPass('currentPassword', { required: 'Required' })} type="password" className="input" />
              {passErrors.currentPassword && <p className="text-red-500 text-xs mt-1">{passErrors.currentPassword.message}</p>}
            </div>
            <div>
              <label className="label">New Password</label>
              <input {...regPass('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} type="password" className="input" />
              {passErrors.newPassword && <p className="text-red-500 text-xs mt-1">{passErrors.newPassword.message}</p>}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input {...regPass('confirmPassword', { required: 'Required' })} type="password" className="input" />
            </div>
            <button type="submit" disabled={submittingPass} className="btn-primary">
              {submittingPass ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
              Update Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
