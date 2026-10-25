import { useState } from "react";
import { X, User } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function LoginModal({ onClose }) {
  const { login } = useAuth();

  const [mode, setMode] = useState("login");

  // Login
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Registration
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hostel, setHostel] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      let result;

      if (mode === "login") {
        result = await api.login({
          identifier: identifier.trim(),
          password,
        });
      } else {
        result = await api.createAccount({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
          hostel: hostel.trim(),
          roomNumber: roomNumber.trim(),
        });
      }

      if (!result.success) {
        throw new Error(
          result.error || "Something went wrong."
        );
      }

      // Save real database user + JWT
      login(result.user, result.token);

      // Close modal after successful authentication
      onClose();
    } catch (err) {
      console.error("Authentication error:", err);

      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(
      mode === "login"
        ? "register"
        : "login"
    );

    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm">

      {/* Login / Register Card */}
      <div className="relative my-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">

        {/* Close Button */}
        <button
          type="button"
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
          {mode === "login"
            ? "Welcome to Bhook_Lgi 🍴"
            : "Create your Bhook_Lgi account"}
        </h2>

        {/* Subtitle */}
        <p className="mt-1 text-center text-sm text-gray-500">
          {mode === "login"
            ? "Sign in to order your favourite snacks"
            : "Create an account to start ordering"}
        </p>

        <form onSubmit={handleSubmit}>

          {/* ================= REGISTER FIELDS ================= */}
          {mode === "register" && (
            <>
              {/* Name */}
              <div className="mt-6">
                <label className="mb-1 block text-sm font-semibold">
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter your name"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-yellow"
                />
              </div>

              {/* Email */}
              <div className="mt-4">
                <label className="mb-1 block text-sm font-semibold">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-yellow"
                />
              </div>

              {/* Phone */}
              <div className="mt-4">
                <label className="mb-1 block text-sm font-semibold">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="Enter your phone number"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-yellow"
                />
              </div>

              {/* Hostel */}
              <div className="mt-4">
                <label className="mb-1 block text-sm font-semibold">
                  Hostel
                </label>

                <input
                  type="text"
                  value={hostel}
                  onChange={(e) =>
                    setHostel(e.target.value)
                  }
                  placeholder="Example: GH4"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-yellow"
                />
              </div>

              {/* Room */}
              <div className="mt-4">
                <label className="mb-1 block text-sm font-semibold">
                  Room Number
                </label>

                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) =>
                    setRoomNumber(e.target.value)
                  }
                  placeholder="Example: 312"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-yellow"
                />
              </div>
            </>
          )}

          {/* ================= LOGIN IDENTIFIER ================= */}
          {mode === "login" && (
            <div className="mt-6">
              <label className="mb-1 block text-sm font-semibold">
                Phone Number or Email
              </label>

              <input
                type="text"
                value={identifier}
                onChange={(e) =>
                  setIdentifier(e.target.value)
                }
                placeholder="Phone number or email"
                required
                autoComplete="username"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-yellow"
              />
            </div>
          )}

          {/* ================= PASSWORD ================= */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter your password"
              required
              minLength={6}
              autoComplete={
                mode === "login"
                  ? "current-password"
                  : "new-password"
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-yellow"
            />
          </div>

          {/* ================= ERROR ================= */}
          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* ================= SUBMIT ================= */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-brand-yellow py-3 font-bold text-brand-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {/* ================= SWITCH LOGIN / REGISTER ================= */}
        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-brand-black hover:underline"
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-brand-black hover:underline"
              >
                Sign In
              </button>
            </>
          )}
        </p>

      </div>
    </div>
  );
}
