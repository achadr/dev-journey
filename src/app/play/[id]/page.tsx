"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import {
  X,
  Pause,
  Play,
  Clock,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { SelectMethod, AddHeaders, PickEndpoint, SelectQuery, MiddlewareSequence, StatusCodeMatch, SequencePuzzle } from "@/components/challenges";
import { saveProgress, getQuestProgress } from "@/lib/api/progress";

// Dynamically import PlatformerChallenge to avoid SSR issues with Phaser
const PlatformerChallenge = dynamic(
  () => import("@/components/challenges/PlatformerChallenge").then((mod) => mod.PlatformerChallenge),
  {
    ssr: false,
    loading: () => (
      <div className="bg-black/30 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
        <p className="text-white/50">Loading game engine...</p>
      </div>
    )
  }
);

interface Challenge {
  id: string;
  type: string;
  question: string;
  config: Record<string, unknown>;
}

interface Layer {
  id: string;
  type: "BROWSER" | "NETWORK" | "API" | "DATABASE";
  order: number;
  timeLimit: number | null;
  challenge: Challenge | null;
}

interface Quest {
  id: string;
  name: string;
  description: string | null;
  difficulty: number;
  layers: Layer[];
}

interface QuestResponse {
  success: boolean;
  data: Quest;
  error?: { message: string };
}

export default function PlayPage() {
  const router = useRouter();
  const params = useParams();
  const questId = params.id as string;

  const { isLoading: authLoading, isAuthenticated, isGuest } = useAuth();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [layerStartTime, setLayerStartTime] = useState(Date.now());
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedProgress, setSavedProgress] = useState<any>(null);

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

    try {
      const response = await fetch(`/api/quests/${questId}`);
      const data: QuestResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to fetch quest");
      }

      setQuest(data.data);

      // Set initial timer from first layer
      const firstLayer = data.data.layers.sort((a, b) => a.order - b.order)[0];
      if (firstLayer?.timeLimit) {
        setTimeRemaining(firstLayer.timeLimit);
      }
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

  // Load saved progress after quest is loaded
  useEffect(() => {
    const loadProgress = async () => {
      if (!quest || isGuest) return;

      try {
        const progress = await getQuestProgress(quest.id);
        if (progress && !progress.completed) {
          setSavedProgress(progress);
          setShowResumeDialog(true);
        }
      } catch (error) {
        console.error('Failed to load progress:', error);
        // Continue with fresh start if progress loading fails
      }
    };

    loadProgress();
  }, [quest, isGuest]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isPaused) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isPaused]);

  // Get current layer
  const currentLayer = quest?.layers.sort((a, b) => a.order - b.order)[currentLayerIndex];

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get layer type info
  const getLayerInfo = (type: string) => {
    const types: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
      BROWSER: { label: "Browser", color: "text-blue-400", bgColor: "bg-blue-500/20", icon: "🌐" },
      NETWORK: { label: "Network", color: "text-green-400", bgColor: "bg-green-500/20", icon: "🔌" },
      API: { label: "API", color: "text-purple-400", bgColor: "bg-purple-500/20", icon: "⚡" },
      DATABASE: { label: "Database", color: "text-orange-400", bgColor: "bg-orange-500/20", icon: "🗄️" },
    };
    return types[type] || { label: type, color: "text-gray-400", bgColor: "bg-gray-500/20", icon: "📦" };
  };

  // Handle quit
  const handleQuit = () => {
    setShowQuitConfirm(true);
  };

  const handleConfirmQuit = () => {
    router.push(`/quests/${questId}`);
  };

  const handleCancelQuit = () => {
    setShowQuitConfirm(false);
  };

  // Handle pause
  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  // Handle resume from saved progress
  const handleResumeProgress = () => {
    if (savedProgress && quest) {
      setCurrentLayerIndex(savedProgress.layerIndex);
      setCurrentScore(savedProgress.score);
      setShowResumeDialog(false);

      // Set timer for resumed layer
      const resumeLayer = quest.layers.sort((a, b) => a.order - b.order)[savedProgress.layerIndex];
      if (resumeLayer?.timeLimit) {
        setTimeRemaining(resumeLayer.timeLimit);
      }
    }
  };

  // Handle start fresh (ignore saved progress)
  const handleStartFresh = () => {
    setShowResumeDialog(false);
    setSavedProgress(null);
  };

  // Handle challenge answer
  const handleChallengeAnswer = (result: { correct: boolean; answer?: string | number | string[]; order?: number[]; headers?: Record<string, string>; score?: number }) => {
    setChallengeCompleted(true);

    // Update score
    if (result.score !== undefined) {
      setCurrentScore(prevScore => prevScore + result.score!);
    }

    // Auto-advance after delay if correct
    if (result.correct) {
      setTimeout(() => {
        advanceToNextLayer(result.score || 0);
      }, 2000);
    }
  };

  // Advance to next layer
  const advanceToNextLayer = async (layerScore: number) => {
    if (!quest) return;

    // Calculate time spent on this layer
    const timeSpent = Math.floor((Date.now() - layerStartTime) / 1000);

    // Save progress (only for authenticated users, not guests)
    if (!isGuest) {
      try {
        const isQuestCompleted = currentLayerIndex >= quest.layers.length - 1;
        await saveProgress({
          questId: quest.id,
          layerIndex: currentLayerIndex,
          score: layerScore,
          completed: isQuestCompleted,
          timeSpent,
        });
      } catch (error) {
        console.error('Failed to save progress:', error);
        // Continue anyway - don't block progression
      }
    }

    if (currentLayerIndex < quest.layers.length - 1) {
      setCurrentLayerIndex(currentLayerIndex + 1);
      setChallengeCompleted(false);
      setLayerStartTime(Date.now()); // Reset timer for next layer
      const nextLayer = quest.layers.sort((a, b) => a.order - b.order)[currentLayerIndex + 1];
      if (nextLayer?.timeLimit) {
        setTimeRemaining(nextLayer.timeLimit);
      }
    } else {
      // Quest completed - redirect to results
      router.push(`/quests/${questId}?completed=true`);
    }
  };

  // Render challenge based on type
  const renderChallenge = () => {
    if (!currentLayer?.challenge) {
      return (
        <div className="bg-black/30 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
          <p className="text-white/50">No challenge configured for this layer</p>
        </div>
      );
    }

    const { type, config } = currentLayer.challenge;
    const challengeConfig = config as Record<string, unknown>;
    // Use layer id + index as key to force component remount when layer changes
    const challengeKey = `${currentLayer.id}-${currentLayerIndex}`;

    switch (type) {
      case 'SELECT_METHOD':
        return (
          <SelectMethod
            key={challengeKey}
            config={challengeConfig as { question: string; options: string[]; answer: string; explanation?: string }}
            onAnswer={handleChallengeAnswer}
          />
        );
      case 'ADD_HEADERS':
        return (
          <AddHeaders
            key={challengeKey}
            config={challengeConfig as { requiredHeaders: string[]; headerHints?: Record<string, string> }}
            onAnswer={handleChallengeAnswer}
          />
        );
      case 'PICK_ENDPOINT':
        return (
          <PickEndpoint
            key={challengeKey}
            config={challengeConfig as { question: string; options: string[]; answer: string; explanation?: string }}
            onAnswer={handleChallengeAnswer}
          />
        );
      case 'SELECT_QUERY':
        return (
          <SelectQuery
            key={challengeKey}
            config={challengeConfig as { question: string; options: string[]; answer: string; explanation?: string }}
            onAnswer={handleChallengeAnswer}
          />
        );
      case 'MIDDLEWARE_SEQUENCE':
        return (
          <MiddlewareSequence
            key={challengeKey}
            config={challengeConfig as { steps: string[]; correctOrder: number[] }}
            onAnswer={handleChallengeAnswer}
          />
        );
      case 'PLATFORMER':
        return (
          <PlatformerChallenge
            key={challengeKey}
            config={challengeConfig as { levelLength?: number; obstacles?: number; speed?: number; obstacleTypes?: string[]; theme?: string }}
            onAnswer={handleChallengeAnswer}
          />
        );
      case 'STATUS_CODE_MATCH':
        return (
          <StatusCodeMatch
            key={challengeKey}
            config={challengeConfig as { scenario: string; statusCodes: number[]; correctCode: number; explanation?: string }}
            onAnswer={handleChallengeAnswer}
          />
        );
      case 'SEQUENCE_PUZZLE':
        return (
          <SequencePuzzle
            key={challengeKey}
            config={challengeConfig as { question: string; steps: Array<{ id: string; label: string; description?: string; category?: string }>; correctOrder: string[]; hint?: string; explanation?: string }}
            onAnswer={handleChallengeAnswer}
          />
        );
      default:
        return (
          <div className="bg-black/30 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
            <p className="text-white/50">
              Challenge type &quot;{type}&quot; not yet implemented
            </p>
          </div>
        );
    }
  };

  // Loading state
  if (authLoading || (isLoading && !quest && !error)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div data-testid="play-loading" className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading quest...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Quest</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push(`/quests/${questId}`)}>
                Back to Quest
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

  if (!quest || !currentLayer) return null;

  const layerInfo = getLayerInfo(currentLayer.type);
  const totalLayers = quest.layers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col">
      {/* Top HUD */}
      <div className="flex items-center justify-between p-4 bg-black/30">
        {/* Left: Quit Button */}
        <Button
          variant="ghost"
          onClick={handleQuit}
          className="text-white hover:bg-white/10"
        >
          <X className="w-5 h-5 mr-2" />
          Quit
        </Button>

        {/* Center: Quest Name + Layer Progress */}
        <div className="text-center">
          <h1 className="text-white font-semibold">{quest.name}</h1>
          <div data-testid="layer-indicator" className="flex items-center justify-center gap-2 text-white/60 text-sm">
            <span className={`${layerInfo.color}`}>{layerInfo.icon} {layerInfo.label}</span>
            <span>•</span>
            <span>Layer {currentLayerIndex + 1} of {totalLayers}</span>
          </div>
        </div>

        {/* Right: Timer + Pause */}
        <div className="flex items-center gap-3">
          {timeRemaining !== null && (
            <div data-testid="layer-timer" className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4" />
              <span className={timeRemaining <= 30 ? "text-red-400" : ""}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePause}
            className="text-white hover:bg-white/10"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            <span className="sr-only">Pause</span>
          </Button>
        </div>
      </div>

      {/* Guest Warning */}
      {isGuest && (
        <div className="mx-4 mt-4">
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-200 text-sm">
                Progress will not be saved - playing as guest
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Game Area */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div
          data-testid={`layer-${currentLayer.type.toLowerCase()}`}
          className="w-full max-w-4xl"
        >
          {/* Layer Type Badge */}
          <div className="flex justify-center mb-6">
            <span className={`px-4 py-2 rounded-full ${layerInfo.bgColor} ${layerInfo.color} font-medium flex items-center gap-2`}>
              <span className="text-xl">{layerInfo.icon}</span>
              {layerInfo.label} Layer
            </span>
          </div>

          {/* Challenge Card */}
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6">
              {/* Challenge Title */}
              <h2 className="text-xl text-white font-semibold mb-4">Challenge</h2>

              {/* Challenge Component */}
              {renderChallenge()}

              {/* Continue Button (shown after correct answer) */}
              {challengeCompleted && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => advanceToNextLayer(currentScore)}
                    className="bg-purple-500 hover:bg-purple-600 gap-2"
                  >
                    {currentLayerIndex < (quest?.layers.length || 0) - 1 ? (
                      <>Continue to Next Layer</>
                    ) : (
                      <>Complete Quest</>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quit Confirmation Modal */}
      {/* Resume Progress Dialog */}
      {showResumeDialog && savedProgress && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw className="w-8 h-8 text-blue-500" />
                <h2 className="text-xl font-semibold">Continue Quest?</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                You have saved progress for this quest.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Layer:</span>
                  <span className="font-medium">
                    {savedProgress.layerIndex + 1} of {quest?.layers.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Best Score:</span>
                  <span className="font-medium">{savedProgress.bestScore}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Attempts:</span>
                  <span className="font-medium">{savedProgress.attempts}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleStartFresh}
                  className="flex-1"
                >
                  Start Fresh
                </Button>
                <Button
                  onClick={handleResumeProgress}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  Resume Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showQuitConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="max-w-sm w-full">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Leave Quest?</h2>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to leave? Your progress in this attempt will be lost.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleCancelQuit}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirmQuit}>
                  Yes, Leave
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-40">
          <Card className="max-w-sm w-full">
            <CardContent className="p-6 text-center">
              <Pause className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Paused</h2>
              <p className="text-muted-foreground mb-6">
                Take your time. The timer is paused.
              </p>
              <Button onClick={handlePause} className="gap-2">
                <Play className="w-4 h-4" />
                Resume
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
