/**
 * Home page.
 * Landing page with links to sign up and sign in.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A]">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-5xl font-extrabold gradient-text mb-4">
            TaskFlow
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Manage your tasks efficiently with our premium glassmorphism experience
          </p>
        </div>

        <div className="space-y-4">
          <a
            href="/signup"
            className="block w-full py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B6B]"
          >
            Get Started
          </a>
          <a
            href="/login"
            className="block w-full py-3 px-4 border border-gray-700 text-base font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B6B]"
          >
            Sign In
          </a>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-500">
            Premium productivity with glassmorphism design
          </p>
        </div>
      </div>
    </div>
  );
}
