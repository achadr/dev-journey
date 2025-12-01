import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as React from 'react'

// Ensure React is available globally for JSX
globalThis.React = React

// Cleanup after each test
afterEach(() => {
  cleanup()
})
