"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Play, Settings, LogOut, User, UserPlus } from "lucide-react";

export default function MenuPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, isGuest, logout } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Handle play
  const handlePlay = () => {
    router.push("/quests");
  };

  // Handle settings
  const handleSettings = () => {
    router.push("/settings");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div
          data-testid="loading-spinner"
          className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-4">
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

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-purple-600 rounded-2xl mb-4 shadow-2xl">
            <div className="text-5xl">📦</div>
          </div>
          <h1 className="text-5xl text-white mb-2 font-display">
            Packet Journey
          </h1>
          <p className="text-purple-200 text-lg">
            Learn full-stack development through adventure
          </p>
        </div>

        {/* User Card */}
        <Card className="mb-6 shadow-2xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div
                data-testid="user-avatar"
                className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              >
                {user?.username?.charAt(0).toUpperCase() || "G"}
              </div>

              <div className="flex-1">
                <p className="text-lg font-medium text-foreground">
                  Welcome, {user?.username || "Guest"}!
                </p>
                {isGuest ? (
                  <p className="text-sm text-muted-foreground">
                    Create an account to save progress
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Buttons */}
        <div className="space-y-4">
          {/* Play Button */}
          <Button
            onClick={handlePlay}
            className="w-full h-16 text-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
          >
            <Play className="w-6 h-6 mr-3" />
            Play
          </Button>

          {/* Settings Button */}
          <Button
            onClick={handleSettings}
            variant="secondary"
            className="w-full h-14 text-lg"
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Button>

          {/* Guest Sign Up */}
          {isGuest && (
            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              className="w-full h-14 text-lg border-purple-400 text-purple-300 hover:bg-purple-900/50"
            >
              <UserPlus className="w-5 h-5 mr-3" />
              Create Account
            </Button>
          )}

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full h-12 text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <LogOut className="w-5 h-5 mr-3" />
            {isGuest ? "Exit" : "Logout"}
          </Button>
        </div>

        {/* Stats Preview (for non-guests) */}
        {!isGuest && (
          <div className="mt-8 bg-white/10 backdrop-blur rounded-xl p-6">
            <h3 className="text-white text-lg mb-4 text-center font-medium">
              Your Progress
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-purple-300">0</div>
                <div className="text-sm text-purple-200">Quests</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-300">0</div>
                <div className="text-sm text-purple-200">XP</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-300">0</div>
                <div className="text-sm text-purple-200">Achievements</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
