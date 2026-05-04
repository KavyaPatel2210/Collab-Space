import * as React from "react";
import { Link, useNavigate } from "react-router";
import { Button, Input } from "../components/ui-components";
import { Mail, Lock, ArrowRight, AlertCircle, User } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "../components/Logo";
import axios from "axios";
import { API_URL } from "../config";

export function LoginPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isSignUp, setIsSignUp] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setError("Please enter your name.");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setIsLoading(false);
          return;
        }
        const res = await axios.post("http://localhost:5000/api/auth/register", {
          name: displayName.trim(),
          email,
          password
        });
        login(res.data.token, res.data.user);
        toast.success("Account created! Welcome to CollabSpace!");
      } else {
        const res = await axios.post("http://localhost:5000/api/auth/login", {
          email,
          password
        });
        login(res.data.token, res.data.user);
        toast.success("Welcome back!");
      }
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.response?.data?.msg || "Authentication failed.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 aurora-bg grain-texture relative overflow-hidden">
      <div className="absolute top-[20%] left-[15%] w-80 h-80 bg-[#8B5CF6]/12 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[15%] w-72 h-72 bg-[#6EE7B7]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[60%] left-[55%] w-48 h-48 bg-[#FB7185]/8 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex mb-6">
            <Logo height={44} linkTo="/" />
          </div>
          <h1 className="text-3xl font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>
            {isSignUp ? "Create Your Account" : "Welcome Back"}
          </h1>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] mt-2 text-[15px]">
            {isSignUp ? "Join the future of collaborative productivity." : "The future of collaborative productivity."}
          </p>
        </div>

        <div className="glass-panel-strong rounded-[24px] p-8 glow-border">
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF] mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] z-10 pointer-events-none" />
                  <Input
                    className="pl-11 h-12"
                    type="text"
                    placeholder="John Smith"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] z-10 pointer-events-none" />
                <Input
                  className="pl-11 h-12"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#4B5563] dark:text-[#9CA3AF]">Password</label>
                {!isSignUp && (
                  <a href="#" className="text-xs text-[#6366F1] dark:text-[#C4B5FD] hover:underline font-medium">Forgot Password?</a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] z-10 pointer-events-none" />
                <Input
                  className="pl-11 h-12"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[#EF4444] bg-[rgba(239,68,68,0.08)] p-3 rounded-[12px] text-sm font-medium border border-[rgba(239,68,68,0.15)]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 font-bold text-lg" isLoading={isLoading}>
              {isSignUp ? "Create Account" : "Sign In"} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          <p className="text-center text-[#6B7280] dark:text-[#9CA3AF] text-sm mt-8">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={(e) => { e.preventDefault(); setIsSignUp(!isSignUp); setError(""); }}
              className="text-[#6366F1] dark:text-[#C4B5FD] font-bold hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up Free"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
