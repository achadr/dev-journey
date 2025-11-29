"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Play,
  User,
  Users,
  Clock,
  Layers,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface Layer {
  id: string;
  type: "BROWSER" | "NETWORK" | "API" | "DATABASE";
  order: number;
  timeLimit: number | null;
  challenge: { id: string; type: string } | null;
}

interface Quest {
  id: string;
  name: string;
  description: string | null;
  difficulty: number;
  playCount: number;
  thumbnailUrl: string | null;
  tags: string[];
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  layers: Layer[];
}

interface QuestResponse {
  success: boolean;
  data: Quest;
  error?: { message: string };
}

export default function QuestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const questId = params.id as string;

  const { isLoading: authLoading, isAuthenticated, isGuest } = useAuth();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch quest details
  const fetchQuest = useCallback(async () => {
    if (!questId) return;

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const response = await fetch(`/api/quests/${questId}`);
      const data: QuestResponse = await response.json();

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to fetch quest");
      }

      setQuest(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quest");
    } finally {
      setIsLoading(false);
    }
  }, [questId]);

  useEffect(() => {
    if (isAuthenticated && questId) {
      fetchQuest();
    }
  }, [isAuthenticated, questId, fetchQuest]);

  // Navigate to game
  const handleStartQuest = () => {
    router.push(`/play/${questId}`);
  };

  // Navigate back to quests
  const handleBack = () => {
    router.push("/quests");
  };

  // Get difficulty label and color
  const getDifficultyInfo = (difficulty: number) => {
    const levels = [
      { label: "Beginner", color: "text-green-400", bg: "bg-green-500/20" },
      { label: "Easy", color: "text-blue-400", bg: "bg-blue-500/20" },
      { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-500/20" },
      { label: "Hard", color: "text-orange-400", bg: "bg-orange-500/20" },
      { label: "Expert", color: "text-red-400", bg: "bg-red-500/20" },
    ];
    return levels[Math.min(difficulty - 1, 4)] || levels[0];
  };

  // Get layer type icon and color
  const getLayerInfo = (type: string) => {
    const types: Record<string, { label: string; color: string; icon: string }> = {
      BROWSER: { label: "Browser", color: "text-blue-400", icon: "🌐" },
      NETWORK: { label: "Network", color: "text-green-400", icon: "🔌" },
      API: { label: "API", color: "text-purple-400", icon: "⚡" },
      DATABASE: { label: "Database", color: "text-orange-400", icon: "🗄️" },
    };
    return types[type] || { label: type, color: "text-gray-400", icon: "📦" };
  };

  // Loading state
  if (authLoading || (isLoading && !quest && !error && !notFound)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-2xl mx-auto" data-testid="quest-detail-loading">
          {/* Back button skeleton */}
          <div className="h-10 w-24 bg-white/10 rounded animate-pulse mb-6" />
          {/* Title skeleton */}
          <div className="h-10 w-64 bg-white/10 rounded animate-pulse mb-4" />
          {/* Description skeleton */}
          <div className="h-20 bg-white/10 rounded animate-pulse mb-6" />
          {/* Layers skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-white/10 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Quest Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This quest doesn&apos;t exist or has been removed.
            </p>
            <Button onClick={handleBack}>Back to Quests</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Quest</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBack}>
                Back to Quests
              </Button>
              <Button onClick={fetchQuest} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quest) return null;

  const difficultyInfo = getDifficultyInfo(quest.difficulty);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-white hover:bg-white/10 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        {/* Quest Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{quest.name}</h1>
          <p className="text-white/70 text-lg">{quest.description || "No description"}</p>
        </div>

        {/* Quest Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Difficulty */}
          <span
            data-testid="quest-difficulty"
            className={`px-3 py-1 rounded-full ${difficultyInfo.bg} ${difficultyInfo.color} font-medium`}
          >
            {difficultyInfo.label}
          </span>

          {/* Play Count */}
          <span className="flex items-center gap-2 text-white/60">
            <Users className="w-4 h-4" />
            {quest.playCount} plays
          </span>

          {/* Author */}
          <span className="flex items-center gap-2 text-white/60">
            <User className="w-4 h-4" />
            {quest.author.username}
          </span>

          {/* Layer Count */}
          <span className="flex items-center gap-2 text-white/60">
            <Layers className="w-4 h-4" />
            {quest.layers.length} layers
          </span>
        </div>

        {/* Tags */}
        {quest.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {quest.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Guest Warning */}
        {isGuest && (
          <Card className="mb-6 border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-200 font-medium">Playing as Guest</p>
                <p className="text-yellow-200/70 text-sm">
                  Your progress won&apos;t be saved. Sign up to track your achievements!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Layers List */}
        <Card className="mb-6 bg-white/10 border-white/20">
          <CardContent className="p-4">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Quest Layers
            </h2>
            <div className="space-y-3">
              {quest.layers
                .sort((a, b) => a.order - b.order)
                .map((layer, index) => {
                  const layerInfo = getLayerInfo(layer.type);
                  return (
                    <div
                      key={layer.id}
                      data-testid={`layer-item-${index}`}
                      className="flex items-center gap-4 p-3 bg-white/5 rounded-lg"
                    >
                      {/* Order Number */}
                      <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 font-bold">
                        {index + 1}
                      </div>

                      {/* Layer Icon */}
                      <span className="text-2xl">{layerInfo.icon}</span>

                      {/* Layer Info */}
                      <div className="flex-1">
                        <span className={`font-medium ${layerInfo.color}`}>
                          {layerInfo.label}
                        </span>
                      </div>

                      {/* Time Limit */}
                      {layer.timeLimit && (
                        <span className="flex items-center gap-1 text-white/50 text-sm">
                          <Clock className="w-4 h-4" />
                          {Math.floor(layer.timeLimit / 60)}:{(layer.timeLimit % 60).toString().padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button
          onClick={handleStartQuest}
          className="w-full h-14 text-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          <Play className="w-6 h-6 mr-3" />
          Start Quest
        </Button>
      </div>
    </div>
  );
}
