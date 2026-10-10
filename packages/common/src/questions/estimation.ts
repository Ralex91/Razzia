const MIN_ACCURACY = 0.5

export const estimationAccuracy = (
  value: number,
  solution: number,
  margin: number,
): number => {
  const distance = Math.abs(value - solution)

  if (distance > margin) {
    return 0
  }

  if (margin === 0) {
    return 1
  }

  return 1 - (distance / margin) * (1 - MIN_ACCURACY)
}
