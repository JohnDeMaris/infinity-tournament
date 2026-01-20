import { RegisterForm } from '@/components/auth/register-form';

export const metadata = {
  title: 'Create Account - Infinity Tournament Manager',
  description: 'Create your tournament account',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <RegisterForm />
    </div>
  );
}
