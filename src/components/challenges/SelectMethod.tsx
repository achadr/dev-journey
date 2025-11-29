'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectMethodConfig {
  question: string
  options: string[]
  answer: string
  explanation?: string
}

interface SelectMethodProps {
  config: SelectMethodConfig
  onAnswer: (result: { correct: boolean; answer: string }) => void
}

const METHOD_INFO: Record<string, { color: string; description: string }> = {
  GET: { color: 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30', description: 'Retrieve data from server' },
  POST: { color: 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30', description: 'Send data to server' },
  PUT: { color: 'bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30', description: 'Update existing data' },
  DELETE: { color: 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30', description: 'Remove data from server' },
  PATCH: { color: 'bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30', description: 'Partially update data' },
}

export function SelectMethod({ config, onAnswer }: SelectMethodProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleSelect = (method: string) => {
    if (submitted) return
    setSelected(method)
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
      <p className="text-lg text-white/90">{config.question}</p>

      {/* Options Grid */}
      <div className="grid grid-cols-2 gap-4">
        {config.options.map((method) => {
          const info = METHOD_INFO[method] || { color: 'bg-gray-500/20 border-gray-500/50', description: 'HTTP method' }
          const isSelected = selected === method
          const isAnswer = method === config.answer

          return (
            <button
              key={method}
              onClick={() => handleSelect(method)}
              disabled={submitted}
              data-selected={isSelected}
              aria-label={method}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-left',
                info.color,
                isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-transparent',
                submitted && isAnswer && 'ring-2 ring-green-400',
                submitted && isSelected && !isAnswer && 'ring-2 ring-red-400',
                submitted && 'cursor-not-allowed opacity-70'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-bold text-white" aria-hidden="true">{method}</span>
                {submitted && isAnswer && <CheckCircle className="w-5 h-5 text-green-400" />}
                {submitted && isSelected && !isAnswer && <XCircle className="w-5 h-5 text-red-400" />}
              </div>
              <p className="text-sm text-white/70">{info.description}</p>
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
