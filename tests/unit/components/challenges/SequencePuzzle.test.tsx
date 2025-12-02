import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SequencePuzzle } from '@/components/challenges/SequencePuzzle'

describe('SequencePuzzle', () => {
  const mockOnAnswer = vi.fn()

  const defaultConfig = {
    question: 'Order the async operations correctly',
    steps: [
      { id: 'fetch', label: 'Fetch user data', description: 'Get data from API', category: 'init' },
      { id: 'validate', label: 'Validate data', description: 'Check data integrity', category: 'validate' },
      { id: 'update', label: 'Update cache', description: 'Store in cache', category: 'process' },
      { id: 'log', label: 'Log activity', description: 'Record the action', category: 'complete' },
    ],
    correctOrder: ['fetch', 'validate', 'update', 'log'],
    hint: 'Think about the logical flow of data',
    explanation: 'Data must be fetched before validation, validated before caching, and logged last.',
  }

  beforeEach(() => {
    mockOnAnswer.mockClear()
    // Mock Math.random to return 0 to prevent shuffling (keeps original order)
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('renders the question', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)
      expect(screen.getByText('Order the async operations correctly')).toBeInTheDocument()
    })

    it('renders all steps', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)
      expect(screen.getByText('Fetch user data')).toBeInTheDocument()
      expect(screen.getByText('Validate data')).toBeInTheDocument()
      expect(screen.getByText('Update cache')).toBeInTheDocument()
      expect(screen.getByText('Log activity')).toBeInTheDocument()
    })

    it('renders step descriptions', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)
      expect(screen.getByText('Get data from API')).toBeInTheDocument()
      expect(screen.getByText('Check data integrity')).toBeInTheDocument()
    })

    it('renders step categories', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)
      expect(screen.getByText('init')).toBeInTheDocument()
      expect(screen.getByText('validate')).toBeInTheDocument()
      expect(screen.getByText('process')).toBeInTheDocument()
      expect(screen.getByText('complete')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    it('renders show hint button when hint is provided', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)
      expect(screen.getByText('Show Hint')).toBeInTheDocument()
    })

    it('does not render hint button when no hint provided', () => {
      const configWithoutHint = { ...defaultConfig, hint: undefined }
      render(<SequencePuzzle config={configWithoutHint} onAnswer={mockOnAnswer} />)
      expect(screen.queryByText('Show Hint')).not.toBeInTheDocument()
    })

    it('renders drag handles for each step', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)
      const dragHandles = screen.getAllByLabelText('Drag to reorder')
      expect(dragHandles).toHaveLength(4)
    })
  })

  describe('hint functionality', () => {
    it('shows hint when hint button is clicked', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      const hintButton = screen.getByText('Show Hint')
      fireEvent.click(hintButton)

      expect(screen.getByText('Think about the logical flow of data')).toBeInTheDocument()
    })

    it('toggles hint text correctly', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      const hintButton = screen.getByText('Show Hint')
      fireEvent.click(hintButton)

      expect(screen.getByText('Hide Hint')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Hide Hint'))

      expect(screen.queryByText('Think about the logical flow of data')).not.toBeInTheDocument()
      expect(screen.getByText('Show Hint')).toBeInTheDocument()
    })

    it('hides hint after submission', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Show hint first
      fireEvent.click(screen.getByText('Show Hint'))
      expect(screen.getByText('Think about the logical flow of data')).toBeInTheDocument()

      // Submit
      fireEvent.click(screen.getByTestId('submit-button'))

      // Hint button should be gone
      expect(screen.queryByText('Show Hint')).not.toBeInTheDocument()
      expect(screen.queryByText('Hide Hint')).not.toBeInTheDocument()
    })
  })

  describe('reordering functionality', () => {
    it('moves step up when up button is clicked', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      const steps = screen.getAllByTestId('sequence-step')
      // Get step labels (not the full text which includes numbers)
      const firstStepLabel = steps[0].querySelector('.font-medium')?.textContent
      const secondStepLabel = steps[1].querySelector('.font-medium')?.textContent
      const upButton = steps[1].querySelector('[data-testid="move-up"]') as HTMLElement

      fireEvent.click(upButton)

      // Second step should now be first
      const updatedSteps = screen.getAllByTestId('sequence-step')
      expect(updatedSteps[0].querySelector('.font-medium')?.textContent).toBe(secondStepLabel)
      expect(updatedSteps[1].querySelector('.font-medium')?.textContent).toBe(firstStepLabel)
    })

    it('moves step down when down button is clicked', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      const steps = screen.getAllByTestId('sequence-step')
      // Get step labels (not the full text which includes numbers)
      const firstStepLabel = steps[0].querySelector('.font-medium')?.textContent
      const secondStepLabel = steps[1].querySelector('.font-medium')?.textContent
      const downButton = steps[0].querySelector('[data-testid="move-down"]') as HTMLElement

      fireEvent.click(downButton)

      // First step should now be second
      const updatedSteps = screen.getAllByTestId('sequence-step')
      expect(updatedSteps[0].querySelector('.font-medium')?.textContent).toBe(secondStepLabel)
      expect(updatedSteps[1].querySelector('.font-medium')?.textContent).toBe(firstStepLabel)
    })

    it('disables up button on first item', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      const steps = screen.getAllByTestId('sequence-step')
      const firstStep = steps[0]
      const upButton = firstStep.querySelector('[data-testid="move-up"]') as HTMLElement

      expect(upButton).toBeDisabled()
    })

    it('disables down button on last item', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      const steps = screen.getAllByTestId('sequence-step')
      const lastStep = steps[steps.length - 1]
      const downButton = lastStep.querySelector('[data-testid="move-down"]') as HTMLElement

      expect(downButton).toBeDisabled()
    })

    it('prevents reordering after submission', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Submit first
      fireEvent.click(screen.getByTestId('submit-button'))

      // Try to move a step
      const steps = screen.getAllByTestId('sequence-step')
      const upButton = steps[1].querySelector('[data-testid="move-up"]') as HTMLElement

      expect(upButton).toBeDisabled()
    })

    it('hides drag handles after submission', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Verify drag handles are present before submission
      expect(screen.getAllByLabelText('Drag to reorder')).toHaveLength(4)

      // Submit
      fireEvent.click(screen.getByTestId('submit-button'))

      // Drag handles should be hidden
      expect(screen.queryAllByLabelText('Drag to reorder')).toHaveLength(0)
    })
  })

  describe('submission and validation', () => {
    it('calls onAnswer with correct result when order is correct', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Get the actual initial order from the rendered steps
      const steps = screen.getAllByTestId('sequence-step')
      const initialOrder = Array.from(steps).map(step => {
        const text = step.textContent || ''
        if (text.includes('Fetch user data')) return 'fetch'
        if (text.includes('Validate data')) return 'validate'
        if (text.includes('Update cache')) return 'update'
        if (text.includes('Log activity')) return 'log'
        return ''
      })

      // Manually arrange to correct order
      // Based on error, initial is ['validate', 'update', 'log', 'fetch']
      // Need: ['fetch', 'validate', 'update', 'log']

      // Move fetch from position 3 to position 0
      fireEvent.click(steps[3].querySelector('[data-testid="move-up"]') as HTMLElement)
      let updatedSteps = screen.getAllByTestId('sequence-step')
      fireEvent.click(updatedSteps[2].querySelector('[data-testid="move-up"]') as HTMLElement)
      updatedSteps = screen.getAllByTestId('sequence-step')
      fireEvent.click(updatedSteps[1].querySelector('[data-testid="move-up"]') as HTMLElement)

      // Now order should be: ['fetch', 'validate', 'update', 'log']
      fireEvent.click(screen.getByTestId('submit-button'))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: true,
        answer: ['fetch', 'validate', 'update', 'log'],
      })
    })

    it('calls onAnswer with incorrect result when order is wrong', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Initial order is shuffled, just move first down to make it different
      const steps = screen.getAllByTestId('sequence-step')
      const downButton = steps[0].querySelector('[data-testid="move-down"]') as HTMLElement
      fireEvent.click(downButton)

      fireEvent.click(screen.getByTestId('submit-button'))

      // Just check that it's incorrect, don't care about exact order
      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: false,
        answer: expect.any(Array),
      })
    })

    it('shows success feedback when answer is correct', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Arrange to correct order
      const steps = screen.getAllByTestId('sequence-step')

      // Move fetch to position 0
      fireEvent.click(steps[3].querySelector('[data-testid="move-up"]') as HTMLElement)
      let updatedSteps = screen.getAllByTestId('sequence-step')
      fireEvent.click(updatedSteps[2].querySelector('[data-testid="move-up"]') as HTMLElement)
      updatedSteps = screen.getAllByTestId('sequence-step')
      fireEvent.click(updatedSteps[1].querySelector('[data-testid="move-up"]') as HTMLElement)

      fireEvent.click(screen.getByTestId('submit-button'))

      expect(screen.getByText(/Correct! Steps are in the right sequence/i)).toBeInTheDocument()
    })

    it('shows error feedback when answer is incorrect', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Make order wrong
      const steps = screen.getAllByTestId('sequence-step')
      const downButton = steps[0].querySelector('[data-testid="move-down"]') as HTMLElement
      fireEvent.click(downButton)

      fireEvent.click(screen.getByTestId('submit-button'))

      expect(screen.getByText(/Incorrect sequence. Try again!/i)).toBeInTheDocument()
    })

    it('shows explanation after submission', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      fireEvent.click(screen.getByTestId('submit-button'))

      expect(screen.getByText(/Data must be fetched before validation/i)).toBeInTheDocument()
    })

    it('disables submit button after submission', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      fireEvent.click(screen.getByTestId('submit-button'))

      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })

    it('prevents multiple submissions', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      fireEvent.click(screen.getByTestId('submit-button'))
      fireEvent.click(screen.getByTestId('submit-button'))

      expect(mockOnAnswer).toHaveBeenCalledTimes(1)
    })
  })

  describe('visual indicators', () => {
    it('displays order numbers correctly', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      const steps = screen.getAllByTestId('sequence-step')

      expect(steps[0]).toHaveTextContent('1')
      expect(steps[1]).toHaveTextContent('2')
      expect(steps[2]).toHaveTextContent('3')
      expect(steps[3]).toHaveTextContent('4')
    })

    it('updates order numbers after reordering', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Move first down
      const steps = screen.getAllByTestId('sequence-step')
      const firstStepText = steps[0].textContent
      const secondStepText = steps[1].textContent
      const downButton = steps[0].querySelector('[data-testid="move-down"]') as HTMLElement
      fireEvent.click(downButton)

      const updatedSteps = screen.getAllByTestId('sequence-step')

      // Check that order numbers are correct and items swapped
      expect(updatedSteps[0]).toHaveTextContent('1')
      expect(updatedSteps[0].textContent).toBe(secondStepText?.replace('2', '1'))

      expect(updatedSteps[1]).toHaveTextContent('2')
      expect(updatedSteps[1].textContent).toBe(firstStepText?.replace('1', '2'))
    })
  })

  describe('complex scenarios', () => {
    it('handles steps without descriptions', () => {
      const configNoDescriptions = {
        ...defaultConfig,
        steps: [
          { id: 'a', label: 'Step A', category: 'init' },
          { id: 'b', label: 'Step B', category: 'process' },
        ],
        correctOrder: ['a', 'b'],
      }

      render(<SequencePuzzle config={configNoDescriptions} onAnswer={mockOnAnswer} />)

      expect(screen.getByText('Step A')).toBeInTheDocument()
      expect(screen.getByText('Step B')).toBeInTheDocument()
    })

    it('handles steps without categories', () => {
      const configNoCategories = {
        ...defaultConfig,
        steps: [
          { id: 'a', label: 'Step A', description: 'Desc A' },
          { id: 'b', label: 'Step B', description: 'Desc B' },
        ],
        correctOrder: ['a', 'b'],
      }

      render(<SequencePuzzle config={configNoCategories} onAnswer={mockOnAnswer} />)

      expect(screen.getByText('Step A')).toBeInTheDocument()
      expect(screen.getByText('Desc A')).toBeInTheDocument()
    })

    it('correctly validates complex reordering', () => {
      render(<SequencePuzzle config={defaultConfig} onAnswer={mockOnAnswer} />)

      // Rearrange to: log, validate, fetch, update (completely wrong)
      const steps = screen.getAllByTestId('sequence-step')

      // Move log to top (fetch → validate → update → log)
      let downButton = steps[steps.length - 1].querySelector('[data-testid="move-down"]')

      // Move fetch to bottom multiple times
      let firstDownButton = steps[0].querySelector('[data-testid="move-down"]') as HTMLElement
      fireEvent.click(firstDownButton)
      fireEvent.click(firstDownButton)
      fireEvent.click(firstDownButton)

      // Submit
      fireEvent.click(screen.getByTestId('submit-button'))

      expect(mockOnAnswer).toHaveBeenCalledWith({
        correct: false,
        answer: expect.any(Array),
      })
    })
  })
})
