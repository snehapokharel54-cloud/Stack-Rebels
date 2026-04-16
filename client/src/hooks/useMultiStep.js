import { useState } from 'react'

/**
 * useMultiStep — manages step progression for multi-step forms
 * @param {number} totalSteps  
 */
export function useMultiStep(totalSteps) {
  const [step, setStep] = useState(0)

  const next = () => setStep(s => Math.min(s + 1, totalSteps - 1))
  const prev = () => setStep(s => Math.max(s - 1, 0))
  const goTo = (n) => setStep(Math.max(0, Math.min(n, totalSteps - 1)))
  const reset = () => setStep(0)

  return { step, next, prev, goTo, reset, isFirst: step === 0, isLast: step === totalSteps - 1 }
}
