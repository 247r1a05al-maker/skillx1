import { useCallback } from 'react'
import { debounce } from 'lodash-es'

export const useDebounce = (callback, delay = 300) => {
  return useCallback(debounce(callback, delay), [callback, delay])
}

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = React.useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue]
}

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
