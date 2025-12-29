// Utility function to play the pickup sound
export function playPickupSound() {
  try {
    const audio = new Audio('/another pickup sound.wav')
    audio.volume = 0.5 // Set volume to 50%
    audio.play().catch((error) => {
      // Silently fail if audio can't play (e.g., browser restrictions)
      console.debug('Could not play pickup sound:', error)
    })
  } catch (error) {
    // Silently fail if audio creation fails
    console.debug('Could not create audio for pickup sound:', error)
  }
}

