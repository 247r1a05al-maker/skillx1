import { useCallback } from 'react'
import { debounce } from 'lodash-es'

export const useDebounce = (callback, delay = 300) => {
  return useCallback(debounce(callback, delay), [callback, delay])
}

// useLocalStorage hook deprecated - use Firebase for persistence instead
// All persistence is now handled via Firebase Realtime Database

// Export Firebase hooks
export {
  useUserPresence,
  useRealtimeMessages,
  useTypingIndicator,
  useNotifications,
  useExchangeRequests,
  useGroupMessages,
  useOnlineUsers,
  useUserOnlineStatus,
} from './useFirebase'

export { useToast } from './useToast'
