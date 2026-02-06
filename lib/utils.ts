import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate dynamic chat height based on message count
 * Increases height by 15% when message count reaches threshold
 * @param baseHeight - Base height string (e.g., "600px")
 * @param messageCount - Current number of messages
 * @param threshold - Message count threshold to trigger expansion (default: 3)
 * @returns Calculated height string
 */
/**
 * Single step tint - linear interpolation towards white in RGB space
 * @param hex - Hex color string (e.g., "#6a0a91" or "6a0a91")
 * @param step - Interpolation factor towards white (0-1), default 0.12
 * @returns Tinted hex color
 */
export function tintOnce(hex: string, step = 0.12): string {
  const clean = hex.replace("#", "")

  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)

  const nr = Math.round(r + (255 - r) * step)
  const ng = Math.round(g + (255 - g) * step)
  const nb = Math.round(b + (255 - b) * step)

  const toHex = (n: number) => n.toString(16).padStart(2, "0")

  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`
}

/**
 * Generate a full tint ramp from base color to white
 * @param hex - Base hex color
 * @param steps - Number of intermediate steps (default 10)
 * @returns Array of hex colors from base to white
 */
export function generateTintRamp(hex: string, steps = 10): string[] {
  const ramp = [hex]
  let current = hex

  for (let i = 0; i < steps; i++) {
    current = tintOnce(current, 0.12)
    ramp.push(current)
  }

  ramp.push("#ffffff")
  return ramp
}

export function calculateDynamicHeight(
  baseHeight: string,
  messageCount: number,
  threshold: number = 3
): string {
  if (messageCount < threshold) {
    return baseHeight
  }

  // Parse the height value and unit
  const match = baseHeight.match(/^(\d+(?:\.\d+)?)(px|rem|em|vh|%)$/)
  if (!match) {
    return baseHeight // Return original if format is unexpected
  }

  const [, value, unit] = match
  const numericValue = parseFloat(value)
  const increasedValue = numericValue * 1.15 // 15% increase

  return `${increasedValue}${unit}`
}
