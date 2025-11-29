"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Play,
  Search,
  Layers,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface Quest {
  id: string;
  name: string;
  description: string | null;
  difficulty: number;
  playCount: number;
  thumbnailUrl: string | null;
  tags: string[];
  author: { username: string };
  _count: { layers: number };
}

interface QuestsResponse {
  success: boolean;
  data: Quest[];
  pagination: {
    total: number;
    page?: number;
    limit?: number;
  };
}

export default function QuestsPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch quests
  const fetchQuests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (difficultyFilter) params.append("difficulty", String(difficultyFilter));

      const response = await fetch(`/api/quests?${params.toString()}`);
      const data: QuestsResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("Failed to fetch quests");
      }

      setQuests(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quests");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, difficultyFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuests();
    }
  }, [isAuthenticated, fetchQuests]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        fetchQuests();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, difficultyFilter, isAuthenticated, fetchQuests]);

  // Navigate to quest details
  const handleQuestClick = (questId: string) => {
    router.push(`/quests/${questId}`);
  };

  // Navigate back to menu
  const handleBack = () => {
    router.push("/menu");
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

  // Loading state (only show if no error)
  if (authLoading || (isLoading && quests.length === 0 && !error)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto" data-testid="quests-loading">
          {/* Header skeleton */}
          <div className="h-10 w-48 bg-white/10 rounded animate-pulse mb-8" />
          {/* Cards skeleton */}
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-40 bg-white/10 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
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
            <h2 className="text-xl font-semibold mb-2">Error Loading Quests</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchQuests} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl text-white font-display">Select Quest</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search quests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          {/* Difficulty filter */}
          <select
            data-testid="difficulty-filter"
            value={difficultyFilter || ""}
            onChange={(e) =>
              setDifficultyFilter(e.target.value ? Number(e.target.value) : null)
            }
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
          >
            <option value="">All Difficulties</option>
            <option value="1">Beginner</option>
            <option value="2">Easy</option>
            <option value="3">Medium</option>
            <option value="4">Hard</option>
            <option value="5">Expert</option>
          </select>
        </div>

        {/* Quest Grid */}
        {quests.length === 0 ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-8 text-center">
              <p className="text-white/70 text-lg">No quests found</p>
              <p className="text-white/50 text-sm mt-2">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {quests.map((quest) => {
              const difficultyInfo = getDifficultyInfo(quest.difficulty);

              return (
                <Card
                  key={quest.id}
                  data-testid="quest-card"
                  onClick={() => handleQuestClick(quest.id)}
                  className="bg-white/10 border-white/20 hover:bg-white/20 transition-colors cursor-pointer group"
                >
                  <CardContent className="p-4">
                    {/* Quest Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {quest.name}
                        </h3>
                        <p className="text-white/60 text-sm line-clamp-2 mt-1">
                          {quest.description || "No description"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuestClick(quest.id);
                        }}
                        className="bg-green-500 hover:bg-green-600 ml-2"
                      >
                        <Play className="w-4 h-4" />
                        <span className="sr-only">Play</span>
                      </Button>
                    </div>

                    {/* Quest Meta */}
                    <div className="flex items-center gap-4 text-sm">
                      {/* Difficulty */}
                      <span
                        data-testid={`difficulty-${quest.id}`}
                        className={`px-2 py-1 rounded ${difficultyInfo.bg} ${difficultyInfo.color}`}
                      >
                        {difficultyInfo.label}
                      </span>

                      {/* Layers */}
                      <span className="flex items-center gap-1 text-white/60">
                        <Layers className="w-4 h-4" />
                        {quest._count.layers} layers
                      </span>

                      {/* Author */}
                      <span className="flex items-center gap-1 text-white/60">
                        <User className="w-4 h-4" />
                        {quest.author.username}
                      </span>
                    </div>

                    {/* Tags */}
                    {quest.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {quest.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
