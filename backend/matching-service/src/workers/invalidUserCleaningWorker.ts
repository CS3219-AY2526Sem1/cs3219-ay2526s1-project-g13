import { getSocket } from '../utils/socket'
import { redis } from '../config/redis'

const MATCH_TIMEOUT = Number(process.env.MATCH_TIMEOUT || 30_000)
const CLEANUP_INTERVAL = Number(process.env.CLEANUP_INTERVAL || 90_000)

export function startInvalidUserCleaningWorker() {
  setInterval(async () => {
    try {
      const userKeys = await redis.zRange('matching_queue', 0, -1)
      const now = Date.now()

      for (const userKey of userKeys) {
        const userData = await redis.hGetAll(userKey)
        if (!userData || !userData.requestedAt) continue

        const requestedAtMs = Number(userData.requestedAt)
        if (!Number.isFinite(requestedAtMs)) continue

        const elapsed = now - requestedAtMs
        const timeoutThreshold = MATCH_TIMEOUT

        if (elapsed > timeoutThreshold) {
          const socketId = userData.socketId
          const io = getSocket()
          const socket = io.sockets.sockets.get(socketId)

          if (socket && socket.connected) {
            socket.emit('matchTimeout', { message: 'Match timed out. Please try again.' })
          }

          await redis.zRem('matching_queue', userKey)
          await redis.del(userKey)
          console.log(`Cleaned stale user ${socketId} from matching queue.`)
        }
      }
    } catch (err) {
      console.error('Error during invalid user cleanup:', err)
    }
  }, CLEANUP_INTERVAL)
}


