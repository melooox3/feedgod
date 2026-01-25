import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToastProvider, useToast } from '@/components/Toast'

// Test component that uses the toast hook
function ToastTester() {
  const toast = useToast()

  return (
    <div>
      <button onClick={() => toast.success('Success message')}>Show Success</button>
      <button onClick={() => toast.error('Error message')}>Show Error</button>
      <button onClick={() => toast.warning('Warning message')}>Show Warning</button>
      <button onClick={() => toast.info('Info message')}>Show Info</button>
      <button onClick={() => toast.addToast('Custom message', 'info', 0)}>Show Persistent</button>
    </div>
  )
}

describe('Toast', () => {
  it('renders provider children', () => {
    render(
      <ToastProvider>
        <div>Child content</div>
      </ToastProvider>
    )

    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('throws error when useToast is used outside provider', () => {
    // Suppress console.error for cleaner output
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<ToastTester />)
    }).toThrow('useToast must be used within a ToastProvider')
  })

  describe('toast types', () => {
    it('shows success toast', () => {
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Success'))

      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveClass('bg-emerald-50')
    })

    it('shows error toast', () => {
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Error'))

      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveClass('bg-red-50')
    })

    it('shows warning toast', () => {
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Warning'))

      expect(screen.getByText('Warning message')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveClass('bg-amber-50')
    })

    it('shows info toast', () => {
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Info'))

      expect(screen.getByText('Info message')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveClass('bg-blue-50')
    })
  })

  describe('toast behavior', () => {
    it('can be dismissed manually', () => {
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Success'))

      expect(screen.getByText('Success message')).toBeInTheDocument()

      fireEvent.click(screen.getByLabelText('Dismiss'))

      expect(screen.queryByText('Success message')).not.toBeInTheDocument()
    })

    it('can show multiple toasts', () => {
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Success'))
      fireEvent.click(screen.getByText('Show Error'))
      fireEvent.click(screen.getByText('Show Warning'))

      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByText('Error message')).toBeInTheDocument()
      expect(screen.getByText('Warning message')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has alert role', () => {
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Info'))

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('has aria-live region', () => {
      render(
        <ToastProvider>
          <ToastTester />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Info'))

      const container = screen.getByRole('alert').parentElement
      expect(container).toHaveAttribute('aria-live', 'polite')
    })
  })
})
