"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Mail, Lock, User, Eye, EyeOff, Rocket } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!isLogin && !username) {
      setError("Please enter a username");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { email, password }
        : { username, email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (data.error?.details) {
          const details = data.error.details;
          const messages = Object.values(details).flat().join(", ");
          setError(messages || data.error.message || "An error occurred");
        } else {
          setError(data.error?.message || "An error occurred");
        }
        return;
      }

      // Success - redirect to menu
      router.push("/menu");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Guest mode - redirect directly to menu
    router.push("/menu");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 text-6xl animate-bounce opacity-20">
          📦
        </div>
        <div className="absolute top-40 right-40 text-5xl animate-pulse opacity-20">
          🌐
        </div>
        <div
          className="absolute bottom-40 left-40 text-5xl animate-bounce opacity-20"
          style={{ animationDelay: "1s" }}
        >
          🔌
        </div>
        <div
          className="absolute bottom-20 right-20 text-6xl animate-pulse opacity-20"
          style={{ animationDelay: "0.5s" }}
        >
          ⚡
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-purple-600 rounded-2xl mb-4 shadow-2xl">
            <div className="text-5xl">📦</div>
          </div>
          <h1 className="text-5xl text-white mb-2 font-display">
            Packet Journey
          </h1>
          <p className="text-purple-200 text-lg">
            Learn full-stack development by traveling through the internet
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-2xl border-0">
          {/* Tab Switcher */}
          <div className="flex border-b border-border">
            <button
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                isLogin
                  ? "bg-purple-50 text-purple-700 border-b-2 border-purple-700"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                !isLogin
                  ? "bg-purple-50 text-purple-700 border-b-2 border-purple-700"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                )}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={handleDemoLogin}
                className="w-full"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Continue as Guest
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Toggle link */}
        <div className="mt-6 text-center text-purple-200 text-sm">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-white hover:underline font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 bg-white/10 backdrop-blur rounded-xl p-6">
          <h3 className="text-white text-lg mb-4 text-center font-medium">
            What you'll get:
          </h3>
          <div className="space-y-3 text-purple-200 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white">
                ✓
              </div>
              <span>Interactive quests teaching full-stack development</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white">
                ✓
              </div>
              <span>Progress tracking and achievements</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white">
                ✓
              </div>
              <span>Create and share your own quests</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white">
                ✓
              </div>
              <span>Compete on leaderboards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
