'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectQueryConfig {
  question: string
  options: string[]
  answer: string
  explanation?: string
}

interface SelectQueryProps {
  config: SelectQueryConfig
  onAnswer: (result: { correct: boolean; answer: string }) => void
}

export function SelectQuery({ config, onAnswer }: SelectQueryProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleSelect = (query: string) => {
    if (submitted) return
    setSelected(query)
  }

  const handleSubmit = () => {
    if (!selected || submitted) return

    const correct = selected === config.answer
    setIsCorrect(correct)
    setSubmitted(true)
    onAnswer({ correct, answer: selected })
  }

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="flex items-start gap-3">
        <Database className="w-6 h-6 text-orange-400 mt-1" />
        <p className="text-lg text-white/90">{config.question}</p>
      </div>

      {/* SQL Options */}
      <div className="space-y-3">
        {config.options.map((query) => {
          const isSelected = selected === query
          const isAnswer = query === config.answer

          return (
            <button
              key={query}
              onClick={() => handleSelect(query)}
              disabled={submitted}
              data-selected={isSelected}
              aria-label={query}
              className={cn(
                'w-full p-4 rounded-lg border-2 transition-all text-left font-mono text-sm',
                'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20',
                isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-transparent bg-orange-500/30',
                submitted && isAnswer && 'ring-2 ring-green-400 bg-green-500/20 border-green-500/50',
                submitted && isSelected && !isAnswer && 'ring-2 ring-red-400 bg-red-500/20 border-red-500/50',
                submitted && 'cursor-not-allowed'
              )}
            >
              <div className="flex items-center justify-between">
                <code className="text-white">{query}</code>
                {submitted && isAnswer && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 ml-2" />}
                {submitted && isSelected && !isAnswer && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 ml-2" />}
              </div>
            </button>
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
                <span className="font-semibold text-green-400">Correct!</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="font-semibold text-red-400">Incorrect</span>
              </>
            )}
          </div>
          {config.explanation && (
            <p className="text-white/80 text-sm">{config.explanation}</p>
          )}
          {!isCorrect && (
            <p className="text-white/60 text-sm mt-2">
              The correct query is: <code className="text-green-400 bg-black/30 px-2 py-1 rounded">{config.answer}</code>
            </p>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!selected || submitted}
          className="bg-green-500 hover:bg-green-600 gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Submit Answer
        </Button>
      </div>
    </div>
  )
}
