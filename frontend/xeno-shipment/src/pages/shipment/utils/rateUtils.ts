export const isRateChosen = (val: any): boolean => {
  if (val === true) return true
  const s = String(val).trim().toLowerCase()
  if (s === '1' || s === 'true') return true
  if (Number(val) === 1) return true
  return false
}

export const isRatePastChosen = (val: any): boolean => {
  // past_chosen uses the same conventions (1 / '1' / true)
  return isRateChosen(val)
}

export default { isRateChosen, isRatePastChosen }
