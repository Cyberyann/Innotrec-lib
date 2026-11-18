import {
  ChangePasswordForm,
  DeleteAccountForm,
  ProfileForm,
  TwoFactorSettings,
} from '@innotrec/ui';
import { useNavigate } from 'react-router';

export function ProfilePage() {
  const navigate = useNavigate();
  return (
    <>
      <h1 className="page-title">My account</h1>
      <div className="grid">
        <div>
          <ProfileForm />
          <ChangePasswordForm />
        </div>
        <div>
          <TwoFactorSettings />
          <DeleteAccountForm onDeleted={() => navigate('/login')} />
        </div>
      </div>
    </>
  );
}
