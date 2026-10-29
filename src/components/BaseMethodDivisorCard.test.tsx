import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BaseMethodDivisorCard from './BaseMethodDivisorCard'

describe('BaseMethodDivisorCard', () => {
  it('renders a dash for base and difference when both are null (pending simplification)', () => {
    const { container } = render(<BaseMethodDivisorCard base={null} difference={null} />)

    expect(screen.getByText('base').nextElementSibling).toHaveTextContent('—')
    expect(screen.getByText('difference').nextElementSibling).toHaveTextContent('—')
    expect(container.textContent?.match(/—/g)).toHaveLength(2)
  })

  it('renders the base and difference numbers with no dash', () => {
    const { container } = render(<BaseMethodDivisorCard base={10} difference={1} />)

    expect(screen.getByText('base').nextElementSibling?.textContent).toBe('10')
    expect(screen.getByText('difference').nextElementSibling?.textContent).toBe('1')
    expect(container.textContent).not.toContain('—')
  })
})
