/**
 * Login page.
 * Allows existing users to sign in with email and password.
 */
import AuthForm from '../../../components/AuthForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A]">
      <div className="max-w-md w-full space-y-8 px-4 sm:px-0">
        <div className="text-center">
          <h2 className="mt-6 text-center text-3xl sm:text-4xl font-extrabold gradient-text">
            Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Access your TaskFlow account
          </p>
        </div>
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
