import { X, User } from "lucide-react";

export default function LoginModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">

      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-yellow">
          <User className="h-8 w-8 text-brand-black" />
        </div>

        {/* Heading */}
        <h2 className="mt-4 text-center text-2xl font-bold text-brand-black">
          Welcome to Bhook_Lgi 🍴
        </h2>

        <p className="mt-1 text-center text-sm text-gray-500">
          Sign in to order your favourite snacks
        </p>

        {/* Email */}
        <div className="mt-6">
          <label className="mb-1 block text-sm font-semibold">
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-yellow"
          />
        </div>

        {/* Password */}
        <div className="mt-4">
          <label className="mb-1 block text-sm font-semibold">
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-yellow"
          />
        </div>

        {/* Sign In */}
       <button
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-brand-yellow py-3 font-bold text-brand-black transition hover:scale-[1.02]"
        >
              Sign In
        </button>

        {/* Sign Up */}
        <p className="mt-5 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <button className="font-semibold text-brand-black hover:underline">
            Create Account
          </button>
        </p>

      </div>
    </div>
  );
}