/**
 * Derives a citizen's tier from their total Impact Points.
 * @param {number} totalPoints
 * @returns {'BRONZE' | 'SILVER' | 'GOLD'}
 */
export function calculateTier(totalPoints) {
  if (totalPoints >= 500) return 'GOLD';
  if (totalPoints >= 200) return 'SILVER';
  return 'BRONZE';
}
