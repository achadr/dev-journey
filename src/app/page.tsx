"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  Play,
  Globe,
  Network,
  Server,
  Database,
  Trophy,
  Users,
  Zap,
  ChevronRight,
  Sparkles,
  Code2,
  Shield,
} from "lucide-react";
import Link from "next/link";

const LAYER_ICONS = [
  { icon: Globe, label: "Browser", color: "text-green-400", bg: "bg-green-500/20" },
  { icon: Network, label: "Network", color: "text-blue-400", bg: "bg-blue-500/20" },
  { icon: Server, label: "API", color: "text-purple-400", bg: "bg-purple-500/20" },
  { icon: Database, label: "Database", color: "text-amber-400", bg: "bg-amber-500/20" },
];

const FEATURES = [
  {
    icon: Code2,
    title: "Learn by Doing",
    description: "Interactive challenges teach you real-world web development concepts through gameplay.",
    color: "text-blue-400",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description: "Get immediate feedback on your answers with detailed explanations for every challenge.",
    color: "text-yellow-400",
  },
  {
    icon: Trophy,
    title: "Earn Achievements",
    description: "Unlock achievements, climb leaderboards, and track your progress as you master each layer.",
    color: "text-purple-400",
  },
  {
    icon: Shield,
    title: "Security First",
    description: "Learn best practices for authentication, SQL injection prevention, and secure API design.",
    color: "text-green-400",
  },
];

const STATS = [
  { value: "4", label: "Network Layers" },
  { value: "5+", label: "Unique Quests" },
  { value: "6", label: "Achievements" },
  { value: "100%", label: "Free" },
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [activeLayer, setActiveLayer] = useState(0);

  // Auto-cycle through layers for animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLayer((prev) => (prev + 1) % LAYER_ICONS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/menu");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white font-display">Packet Journey</span>
          </div>
          <div className="flex items-center gap-4">
            {!isLoading && (
              isAuthenticated ? (
                <Button onClick={() => router.push("/menu")} className="bg-purple-600 hover:bg-purple-700">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => router.push("/login")} className="text-white hover:bg-white/10">
                    Sign In
                  </Button>
                  <Button onClick={() => router.push("/login")} className="bg-purple-600 hover:bg-purple-700">
                    Get Started
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                Learn Full-Stack Development Through Play
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-display leading-tight mb-6">
                Master the{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  Web Stack
                </span>{" "}
                One Layer at a Time
              </h1>

              <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto lg:mx-0">
                Journey through Browser, Network, API, and Database layers in an interactive
                game that teaches you how the web really works.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Your Journey
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/login?guest=true")}
                  className="border-white/20 text-white hover:bg-white/10 text-lg px-8"
                >
                  Try as Guest
                </Button>
              </div>
            </div>

            {/* Hero Visual - Layer Stack Animation */}
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                {/* Glowing background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl" />

                {/* Layer cards stacked */}
                <div className="relative z-10 space-y-4 p-8">
                  {LAYER_ICONS.map((layer, index) => {
                    const Icon = layer.icon;
                    const isActive = index === activeLayer;

                    return (
                      <div
                        key={layer.label}
                        className={`
                          flex items-center gap-4 p-4 rounded-xl border transition-all duration-500
                          ${isActive
                            ? `${layer.bg} border-white/30 scale-105 shadow-lg shadow-${layer.color.replace('text-', '')}/20`
                            : 'bg-white/5 border-white/10'
                          }
                        `}
                      >
                        <div className={`w-12 h-12 rounded-lg ${layer.bg} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${layer.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold ${isActive ? 'text-white' : 'text-white/70'}`}>
                            {layer.label} Layer
                          </h3>
                          <div className="h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ${isActive ? layer.bg.replace('/20', '') : 'bg-white/20'}`}
                              style={{ width: isActive ? '100%' : '0%' }}
                            />
                          </div>
                        </div>
                        {isActive && (
                          <ChevronRight className={`w-5 h-5 ${layer.color} animate-pulse`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="text-3xl font-bold text-white font-display">{stat.value}</div>
                <div className="text-white/60 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-slate-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-display mb-4">
              Why Packet Journey?
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Traditional tutorials tell you how the web works. We let you experience it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/60">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-display mb-4">
              How It Works
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Each quest takes you through all four layers of a web request
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {LAYER_ICONS.map((layer, index) => {
              const Icon = layer.icon;
              return (
                <div key={layer.label} className="relative">
                  {/* Connector line */}
                  {index < LAYER_ICONS.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gradient-to-r from-white/30 to-transparent" />
                  )}

                  <Card className="bg-white/5 border-white/10 h-full">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-white/20 mb-4">0{index + 1}</div>
                      <div className={`w-16 h-16 rounded-xl ${layer.bg} flex items-center justify-center mx-auto mb-4`}>
                        <Icon className={`w-8 h-8 ${layer.color}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{layer.label}</h3>
                      <p className="text-white/60 text-sm">
                        {index === 0 && "Build HTTP requests, set headers, choose methods"}
                        {index === 1 && "Navigate through firewalls, handle packet loss"}
                        {index === 2 && "Match status codes, order middleware"}
                        {index === 3 && "Write SQL queries, manage data"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30 overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center relative">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Users className="w-6 h-6 text-purple-400" />
                  <span className="text-purple-300">Join developers learning the web stack</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-white font-display mb-4">
                  Ready to Start Your Journey?
                </h2>

                <p className="text-white/70 mb-8 max-w-xl mx-auto">
                  Create a free account and begin mastering web development through
                  interactive gameplay. No credit card required.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={handleGetStarted}
                    className="bg-white text-purple-900 hover:bg-white/90 text-lg px-8"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Get Started Free
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white/60 text-sm">Packet Journey</span>
          </div>
          <p className="text-white/40 text-sm">
            Learn web development through interactive gameplay
          </p>
        </div>
      </footer>
    </div>
  );
}
