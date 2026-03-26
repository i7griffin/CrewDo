import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProgressDisplay from './ProgressDisplay'

describe('ProgressDisplay', () => {
  const mockTasks = [
    { id: 't1', title: 'Workout', value: 10 },
    { id: 't2', title: 'Study', value: 15 },
    { id: 't3', title: 'LeetCode', value: 20 },
  ]

  const defaultProps = {
    progress: 40,
    streak: 5,
    tasks: mockTasks,
    onTaskComplete: vi.fn(),
    completedTaskIds: [],
  }

  it('renders progress percentage', () => {
    render(<ProgressDisplay {...defaultProps} />)
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('renders streak count', () => {
    render(<ProgressDisplay {...defaultProps} />)
    expect(screen.getByText(/5 days/i)).toBeInTheDocument()
  })

  it('renders all tasks', () => {
    render(<ProgressDisplay {...defaultProps} />)
    expect(screen.getByText('Workout')).toBeInTheDocument()
    expect(screen.getByText('Study')).toBeInTheDocument()
    expect(screen.getByText('LeetCode')).toBeInTheDocument()
  })

  it('shows point values for uncompleted tasks', () => {
    render(<ProgressDisplay {...defaultProps} />)
    expect(screen.getByText('+10%')).toBeInTheDocument()
    expect(screen.getByText('+15%')).toBeInTheDocument()
    expect(screen.getByText('+20%')).toBeInTheDocument()
  })

  it('calls onTaskComplete when uncompleted task is clicked', () => {
    const onTaskComplete = vi.fn()
    render(<ProgressDisplay {...defaultProps} onTaskComplete={onTaskComplete} />)
    
    const workoutButton = screen.getByRole('button', { name: /Workout/i })
    fireEvent.click(workoutButton)
    
    expect(onTaskComplete).toHaveBeenCalledWith(mockTasks[0])
  })

  it('disables completed tasks', () => {
    render(<ProgressDisplay {...defaultProps} completedTaskIds={['t1']} />)
    
    const workoutButton = screen.getByRole('button', { name: /Workout/i })
    expect(workoutButton).toBeDisabled()
  })

  it('shows checkmark for completed tasks', () => {
    render(<ProgressDisplay {...defaultProps} completedTaskIds={['t1', 't2']} />)
    
    const buttons = screen.getAllByRole('button')
    const workoutButton = buttons.find(btn => btn.textContent.includes('Workout'))
    const studyButton = buttons.find(btn => btn.textContent.includes('Study'))
    
    expect(workoutButton.textContent).toContain('✓')
    expect(studyButton.textContent).toContain('✓')
  })

  it('shows "Completed" text instead of point value for completed tasks', () => {
    render(<ProgressDisplay {...defaultProps} completedTaskIds={['t1']} />)
    
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.queryByText('+10%')).not.toBeInTheDocument()
  })

  it('applies different styling to completed tasks', () => {
    render(<ProgressDisplay {...defaultProps} completedTaskIds={['t1']} />)
    
    const workoutButton = screen.getByRole('button', { name: /Workout/i })
    expect(workoutButton).toHaveClass('cursor-not-allowed')
    expect(workoutButton).toHaveClass('bg-gray-600/20')
  })

  it('does not call onTaskComplete when completed task is clicked', () => {
    const onTaskComplete = vi.fn()
    render(<ProgressDisplay {...defaultProps} onTaskComplete={onTaskComplete} completedTaskIds={['t1']} />)
    
    const workoutButton = screen.getByRole('button', { name: /Workout/i })
    fireEvent.click(workoutButton)
    
    expect(onTaskComplete).not.toHaveBeenCalled()
  })

  it('handles empty completedTaskIds array', () => {
    render(<ProgressDisplay {...defaultProps} completedTaskIds={[]} />)
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).not.toBeDisabled()
    })
  })

  it('handles undefined completedTaskIds prop', () => {
    const { completedTaskIds, ...propsWithoutCompleted } = defaultProps
    render(<ProgressDisplay {...propsWithoutCompleted} />)
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).not.toBeDisabled()
    })
  })

  it('handles all tasks completed', () => {
    render(<ProgressDisplay {...defaultProps} completedTaskIds={['t1', 't2', 't3']} />)
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
    
    const completedTexts = screen.getAllByText('Completed')
    expect(completedTexts).toHaveLength(3)
  })

  it('correctly identifies completed vs uncompleted tasks', () => {
    render(<ProgressDisplay {...defaultProps} completedTaskIds={['t2']} />)
    
    const buttons = screen.getAllByRole('button')
    const workoutButton = buttons.find(btn => btn.textContent.includes('Workout'))
    const studyButton = buttons.find(btn => btn.textContent.includes('Study'))
    const leetcodeButton = buttons.find(btn => btn.textContent.includes('LeetCode'))
    
    expect(workoutButton).not.toBeDisabled()
    expect(studyButton).toBeDisabled()
    expect(leetcodeButton).not.toBeDisabled()
    
    expect(screen.getByText('+10%')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('+20%')).toBeInTheDocument()
  })
})
