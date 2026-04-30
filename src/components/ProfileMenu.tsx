import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AVATAR_KEY = 'shiftly_avatar';

export default function ProfileMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedAvatar = localStorage.getItem(AVATAR_KEY);
    if (savedAvatar) setAvatar(savedAvatar);
  }, []);

  const displayName = (user?.user_metadata as any)?.full_name || user?.email || 'Shiftly User';
  const displayRole = 'Admin';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      localStorage.setItem(AVATAR_KEY, result);
      setAvatar(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-sm shadow-sm transition hover:shadow-md"
      >
        {avatar ? (
          <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <span className="font-semibold text-slate-700">{displayName[0].toUpperCase()}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="p-4">
            <div className="flex items-center gap-3 pb-4">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-semibold text-slate-500">{displayName[0].toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{displayName}</p>
                <p className="text-sm text-slate-500">{displayRole}</p>
              </div>
            </div>
            <p className="mb-3 text-sm text-slate-600">Upload an avatar and personalize your profile menu.</p>
            <button
              type="button"
              className="mb-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload avatar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 w-full rounded-2xl bg-rose-500 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}