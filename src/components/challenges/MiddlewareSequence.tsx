'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, ChevronUp, ChevronDown, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MiddlewareSequenceConfig {
  steps: string[]
  correctOrder: number[]
}

interface MiddlewareSequenceProps {
  config: MiddlewareSequenceConfig
  onAnswer: (result: { correct: boolean; order: number[] }) => void
}

export function MiddlewareSequence({ config, onAnswer }: MiddlewareSequenceProps) {
  // Track current order as indices into original array
  const [order, setOrder] = useState<number[]>(config.steps.map((_, i) => i))
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const moveUp = (index: number) => {
    if (index === 0 || submitted) return
    const newOrder = [...order]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    setOrder(newOrder)
  }

  const moveDown = (index: number) => {
    if (index === order.length - 1 || submitted) return
    const newOrder = [...order]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    setOrder(newOrder)
  }

  const handleSubmit = () => {
    if (submitted) return

    // Check if current order matches correct order
    const correct = order.every((val, idx) => val === config.correctOrder[idx])
    setIsCorrect(correct)
    setSubmitted(true)
    onAnswer({ correct, order })
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="flex items-start gap-3">
        <Layers className="w-6 h-6 text-purple-400 mt-1" />
        <p className="text-lg text-white/90">
          Order the middleware in the correct execution sequence
        </p>
      </div>

      {/* Middleware Steps */}
      <div className="space-y-2">
        {order.map((originalIndex, currentIndex) => {
          const step = config.steps[originalIndex]
          const isFirstItem = currentIndex === 0
          const isLastItem = currentIndex === order.length - 1

          return (
            <div
              key={originalIndex}
              data-testid="middleware-item"
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border-2 transition-all',
                'bg-purple-500/10 border-purple-500/30',
                submitted && 'opacity-70'
              )}
            >
              {/* Order number */}
              <span className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-white font-bold">
                {currentIndex + 1}
              </span>

              {/* Step name */}
              <span className="flex-1 font-mono text-white">{step}</span>

              {/* Move buttons */}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveUp(currentIndex)}
                  disabled={isFirstItem || submitted}
                  aria-label="Move up"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveDown(currentIndex)}
                  disabled={isLastItem || submitted}
                  aria-label="Move down"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feedback */}
      {submitted && (
        <div className={cn(
          'p-4 rounded-lg',
          isCorrect ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
        )}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-green-400">Correct! Middleware is in the right order.</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="font-semibold text-red-400">Incorrect order. Try again!</span>
              </>
            )}
          </div>
          {!isCorrect && (
            <p className="text-white/60 text-sm">
              Hint: Think about what needs to happen first - validation, then authorization, then rate limiting.
            </p>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitted}
          className="bg-green-500 hover:bg-green-600 gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Submit Answer
        </Button>
      </div>
    </div>
  )
}
