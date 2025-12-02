'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, ChevronUp, ChevronDown, ListOrdered, Info, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SequenceStep {
  id: string
  label: string
  description?: string
  category?: string
}

interface SequencePuzzleConfig {
  question: string
  steps: SequenceStep[]
  correctOrder: string[] // Array of step IDs in correct order
  hint?: string
  explanation?: string
}

interface SequencePuzzleProps {
  config: SequencePuzzleConfig
  onAnswer: (result: { correct: boolean; answer: string[] }) => void
}

// Category colors for visual distinction
const CATEGORY_COLORS: Record<string, string> = {
  init: 'border-blue-500/50 bg-blue-500/10',
  process: 'border-purple-500/50 bg-purple-500/10',
  validate: 'border-green-500/50 bg-green-500/10',
  execute: 'border-orange-500/50 bg-orange-500/10',
  complete: 'border-pink-500/50 bg-pink-500/10',
  default: 'border-gray-500/50 bg-gray-500/10',
}

// Sortable Item Component for drag-and-drop
interface SortableStepItemProps {
  step: SequenceStep
  currentIndex: number
  isFirstItem: boolean
  isLastItem: boolean
  submitted: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}

function SortableStepItem({
  step,
  currentIndex,
  isFirstItem,
  isLastItem,
  submitted,
  onMoveUp,
  onMoveDown,
}: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id, disabled: submitted })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const categoryColor = CATEGORY_COLORS[step.category || 'default']

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="sequence-step"
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border-2 transition-all',
        categoryColor,
        submitted && 'opacity-70',
        isDragging && 'opacity-50 z-50'
      )}
    >
      {/* Drag handle */}
      {!submitted && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-white/50 hover:text-white/80 touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      )}

      {/* Order number */}
      <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold shrink-0">
        {currentIndex + 1}
      </span>

      {/* Step content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white">{step.label}</div>
        {step.description && (
          <div className="text-sm text-white/60 mt-1">{step.description}</div>
        )}
        {step.category && (
          <div className="text-xs text-white/40 mt-1 uppercase tracking-wide">
            {step.category}
          </div>
        )}
      </div>

      {/* Move buttons */}
      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMoveUp}
          disabled={isFirstItem || submitted}
          aria-label="Move up"
          data-testid="move-up"
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
        >
          <ChevronUp className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onMoveDown}
          disabled={isLastItem || submitted}
          aria-label="Move down"
          data-testid="move-down"
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export function SequencePuzzle({ config, onAnswer }: SequencePuzzleProps) {
  // Shuffle function using Fisher-Yates algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Track current order as step IDs - initialize with shuffled order
  const [order, setOrder] = useState<string[]>(() => shuffleArray(config.steps.map(step => step.id)))
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showHint, setShowHint] = useState(false)

  // Set up drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleSubmit = () => {
    if (submitted) return

    // Check if current order matches correct order
    const correct = order.every((stepId, idx) => stepId === config.correctOrder[idx])
    setIsCorrect(correct)
    setSubmitted(true)
    onAnswer({ correct, answer: order })
  }

  // Get step by ID
  const getStep = (stepId: string) => {
    return config.steps.find(s => s.id === stepId)
  }

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="flex items-start gap-3">
        <ListOrdered className="w-6 h-6 text-blue-400 mt-1" />
        <p className="text-lg text-white/90">{config.question}</p>
      </div>

      {/* Hint Toggle */}
      {config.hint && !submitted && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHint(!showHint)}
          className="text-blue-400 hover:text-blue-300"
        >
          <Info className="w-4 h-4 mr-2" />
          {showHint ? 'Hide Hint' : 'Show Hint'}
        </Button>
      )}

      {/* Hint Display */}
      {showHint && config.hint && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-sm text-blue-200">{config.hint}</p>
        </div>
      )}

      {/* Sequence Steps */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={order}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {order.map((stepId, currentIndex) => {
              const step = getStep(stepId)
              if (!step) return null

              const isFirstItem = currentIndex === 0
              const isLastItem = currentIndex === order.length - 1

              return (
                <SortableStepItem
                  key={step.id}
                  step={step}
                  currentIndex={currentIndex}
                  isFirstItem={isFirstItem}
                  isLastItem={isLastItem}
                  submitted={submitted}
                  onMoveUp={() => moveUp(currentIndex)}
                  onMoveDown={() => moveDown(currentIndex)}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Feedback */}
      {submitted && (
        <div
          data-testid="feedback"
          className={cn(
            'p-4 rounded-lg',
            isCorrect
              ? 'bg-green-500/20 border border-green-500/50'
              : 'bg-red-500/20 border border-red-500/50'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-green-400">
                  Correct! Steps are in the right sequence.
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="font-semibold text-red-400">
                  Incorrect sequence. Try again!
                </span>
              </>
            )}
          </div>
          {config.explanation && (
            <p className="text-white/70 text-sm mt-2">{config.explanation}</p>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitted}
          data-testid="submit-button"
          className="bg-green-500 hover:bg-green-600 gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Submit Answer
        </Button>
      </div>
    </div>
  )
}
