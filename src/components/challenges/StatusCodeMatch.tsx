'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Server } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusCodeMatchConfig {
  scenario: string
  statusCodes: number[]
  correctCode: number
  explanation?: string
}

interface StatusCodeMatchProps {
  config: StatusCodeMatchConfig
  onAnswer: (result: { correct: boolean; answer: number }) => void
}

// HTTP Status code descriptions
const STATUS_CODE_INFO: Record<number, { name: string; category: 'success' | 'redirect' | 'client-error' | 'server-error' }> = {
  200: { name: 'OK', category: 'success' },
  201: { name: 'Created', category: 'success' },
  204: { name: 'No Content', category: 'success' },
  301: { name: 'Moved Permanently', category: 'redirect' },
  302: { name: 'Found', category: 'redirect' },
  304: { name: 'Not Modified', category: 'redirect' },
  400: { name: 'Bad Request', category: 'client-error' },
  401: { name: 'Unauthorized', category: 'client-error' },
  403: { name: 'Forbidden', category: 'client-error' },
  404: { name: 'Not Found', category: 'client-error' },
  405: { name: 'Method Not Allowed', category: 'client-error' },
  409: { name: 'Conflict', category: 'client-error' },
  422: { name: 'Unprocessable Entity', category: 'client-error' },
  429: { name: 'Too Many Requests', category: 'client-error' },
  500: { name: 'Internal Server Error', category: 'server-error' },
  502: { name: 'Bad Gateway', category: 'server-error' },
  503: { name: 'Service Unavailable', category: 'server-error' },
  504: { name: 'Gateway Timeout', category: 'server-error' },
}

const CATEGORY_STYLES: Record<string, string> = {
  success: 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20',
  redirect: 'border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20',
  'client-error': 'border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20',
  'server-error': 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20',
}

const CATEGORY_TEXT: Record<string, string> = {
  success: 'text-green-400',
  redirect: 'text-blue-400',
  'client-error': 'text-yellow-400',
  'server-error': 'text-red-400',
}

export function StatusCodeMatch({ config, onAnswer }: StatusCodeMatchProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleSelect = (code: number) => {
    if (submitted) return
    setSelected(code)
  }

  const handleSubmit = () => {
    if (selected === null || submitted) return

    const correct = selected === config.correctCode
    setIsCorrect(correct)
    setSubmitted(true)
    onAnswer({ correct, answer: selected })
  }

  // Get unique categories from the status codes
  const categories = [...new Set(config.statusCodes.map(code => {
    const info = STATUS_CODE_INFO[code]
    return info?.category || 'client-error'
  }))]

  return (
    <div className="space-y-6">
      {/* Scenario */}
      <div className="flex items-start gap-3">
        <Server className="w-6 h-6 text-purple-400 mt-1" />
        <div>
          <p className="text-lg text-white/90">{config.scenario}</p>
          <p className="text-sm text-white/60 mt-1">Select the appropriate HTTP status code</p>
        </div>
      </div>

      {/* Category Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {categories.includes('success') && (
          <span className="text-green-400">2xx - Success</span>
        )}
        {categories.includes('redirect') && (
          <span className="text-blue-400">3xx - Redirect</span>
        )}
        {categories.includes('client-error') && (
          <span className="text-yellow-400">4xx - Client Error</span>
        )}
        {categories.includes('server-error') && (
          <span className="text-red-400">5xx - Server Error</span>
        )}
      </div>

      {/* Status Code Options */}
      <div className="grid grid-cols-2 gap-3">
        {config.statusCodes.map((code) => {
          const info = STATUS_CODE_INFO[code] || { name: 'Unknown', category: 'client-error' }
          const isSelected = selected === code
          const isAnswer = code === config.correctCode

          return (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              disabled={submitted}
              data-selected={isSelected}
              data-category={info.category}
              data-correct={submitted && isAnswer}
              aria-label={`${code} ${info.name}`}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-left',
                CATEGORY_STYLES[info.category],
                isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-transparent',
                submitted && isAnswer && 'ring-2 ring-green-400 bg-green-500/30 border-green-500',
                submitted && isSelected && !isAnswer && 'ring-2 ring-red-400 bg-red-500/30 border-red-500',
                submitted && 'cursor-not-allowed opacity-75'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className={cn('text-2xl font-bold', CATEGORY_TEXT[info.category])}>
                    {code}
                  </span>
                  <p className="text-white/80 text-sm mt-1">{info.name}</p>
                </div>
                {submitted && isAnswer && <CheckCircle className="w-6 h-6 text-green-400" />}
                {submitted && isSelected && !isAnswer && <XCircle className="w-6 h-6 text-red-400" />}
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
              The correct status code is: <code className="text-green-400 font-bold">{config.correctCode} {STATUS_CODE_INFO[config.correctCode]?.name}</code>
            </p>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={selected === null || submitted}
          className="bg-purple-500 hover:bg-purple-600 gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Submit Answer
        </Button>
      </div>
    </div>
  )
}
