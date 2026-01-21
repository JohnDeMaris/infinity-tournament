import { RegisterForm } from '@/components/auth/register-form';

export const metadata = {
  title: 'Create Account - Infinity Tournament Manager',
  description: 'Create your tournament account',
};

export default function RegisterPage() {
  return (
    <div className="px-4 py-12">
      <RegisterForm />
    </div>
  );
}
