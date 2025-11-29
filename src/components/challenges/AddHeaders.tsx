'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddHeadersConfig {
  requiredHeaders: string[]
  headerHints?: Record<string, string>
}

interface AddHeadersProps {
  config: AddHeadersConfig
  onAnswer: (result: { correct: boolean; headers: Record<string, string> }) => void
}

const HEADER_SUGGESTIONS: Record<string, string[]> = {
  Authorization: ['Bearer ', 'Basic ', 'Token '],
  'Content-Type': ['application/json', 'text/html', 'multipart/form-data'],
  Accept: ['application/json', '*/*', 'text/html'],
}

const HEADER_VALIDATORS: Record<string, (value: string) => boolean> = {
  Authorization: (value) => value.startsWith('Bearer ') || value.startsWith('Basic ') || value.startsWith('Token '),
  'Content-Type': (value) => value.length > 0,
  Accept: (value) => value.length > 0,
}

export function AddHeaders({ config, onAnswer }: AddHeadersProps) {
  const [headers, setHeaders] = useState<Record<string, string>>(
    Object.fromEntries(config.requiredHeaders.map((h) => [h, '']))
  )
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleChange = (header: string, value: string) => {
    if (submitted) return
    setHeaders((prev) => ({ ...prev, [header]: value }))
  }

  const handleSuggestion = (header: string, suggestion: string) => {
    if (submitted) return
    setHeaders((prev) => ({ ...prev, [header]: suggestion }))
  }

  const allFieldsFilled = config.requiredHeaders.every((h) => headers[h]?.trim().length > 0)

  const handleSubmit = () => {
    if (!allFieldsFilled || submitted) return

    // Validate all headers
    const correct = config.requiredHeaders.every((header) => {
      const validator = HEADER_VALIDATORS[header]
      if (validator) {
        return validator(headers[header])
      }
      return headers[header].trim().length > 0
    })

    setIsCorrect(correct)
    setSubmitted(true)
    onAnswer({ correct, headers })
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <p className="text-lg text-white/90">
        Add the required HTTP headers to complete the request
      </p>

      {/* Header Inputs */}
      <div className="space-y-4">
        {config.requiredHeaders.map((header) => {
          const hint = config.headerHints?.[header]
          const suggestions = HEADER_SUGGESTIONS[header] || []
          const isValid = submitted && HEADER_VALIDATORS[header]?.(headers[header])
          const isInvalid = submitted && !isValid

          return (
            <div key={header} className="space-y-2">
              <Label htmlFor={header} className="text-white flex items-center gap-2">
                {header}
                {submitted && isValid && <CheckCircle className="w-4 h-4 text-green-400" />}
                {submitted && isInvalid && <XCircle className="w-4 h-4 text-red-400" />}
              </Label>

              <Input
                id={header}
                value={headers[header]}
                onChange={(e) => handleChange(header, e.target.value)}
                disabled={submitted}
                placeholder={`Enter ${header} value...`}
                className={cn(
                  'bg-black/30 border-white/20 text-white placeholder:text-white/40',
                  submitted && isValid && 'border-green-500/50',
                  submitted && isInvalid && 'border-red-500/50'
                )}
              />

              {/* Hint */}
              {hint && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Info className="w-4 h-4" />
                  <span>{hint}</span>
                </div>
              )}

              {/* Suggestions */}
              {!submitted && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestion(header, suggestion)}
                      className="text-xs bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                    >
                      {suggestion.trim() || suggestion}
                    </Button>
                  ))}
                </div>
              )}
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
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-green-400">Correct! Headers added successfully.</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="font-semibold text-red-400">Incorrect header format. Check the hints!</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!allFieldsFilled || submitted}
          className="bg-green-500 hover:bg-green-600 gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Submit Answer
        </Button>
      </div>
    </div>
  )
}
