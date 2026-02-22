import { formatDistanceToNow, format } from 'date-fns'

export const formatTimeAgo = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const formatDate = (date, dateFormat = 'MMM dd, yyyy') => {
  return format(new Date(date), dateFormat)
}

export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

export const truncate = (text, length = 50) => {
  return text.length > length ? text.slice(0, length) + '...' : text
}
