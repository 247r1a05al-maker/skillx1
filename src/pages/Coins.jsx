import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiDownload, FiCalendar, FiAlertCircle, FiTrash2 } from 'react-icons/fi'
import { Card, StatCard, Badge } from '../components/UI'
import SCoinIcon from '../components/SCoinIcon'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'
import { useToast } from '../hooks'

const Coins = () => {
  const { user: authUser } = useAuthStore()
  const { error: showError, success: showSuccess } = useToast()
  // INSTANT: Use cached coins from authUser (no 0 flash!)
  const [balance, setBalance] = useState(authUser?.coins || 0)
  const [history, setHistory] = useState([])
  const [filterDate, setFilterDate] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalSpent: 0,
    thisMonth: 0
  })

  const MIN_DELETE_DAYS = 7

  const normalizeTimestamp = (value) => {
    if (!value) return null
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const fromDate = new Date(value).getTime()
      if (!Number.isNaN(fromDate)) return fromDate
      const fromNumber = Number(value)
      return Number.isFinite(fromNumber) ? fromNumber : null
    }
    if (typeof value === 'object' && typeof value.seconds === 'number') {
      return value.seconds * 1000
    }
    return null
  }

  const recalculateStats = (transactions) => {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    let totalEarned = 0
    let totalSpent = 0
    let thisMonth = 0

    transactions.forEach(tx => {
      const amount = Math.abs(tx.amount || 0)
      const txTs = normalizeTimestamp(tx.timestamp)
      if (tx.type === 'earned' || tx.amount > 0) {
        totalEarned += amount
        if (txTs && txTs >= thisMonthStart) {
          thisMonth += amount
        }
      } else if (tx.type === 'spent' || tx.amount < 0) {
        totalSpent += amount
      }
    })

    setStats({ totalEarned, totalSpent, thisMonth })
  }

  // Load coin data
  useEffect(() => {
    const loadCoinData = async () => {
      if (!authUser?.id) {
        setLoadError('Please login to view your coins')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError(null)

      try {
        // Get user's current coin balance from authUser (instant!)
        const cachedCoins = authUser.coins || 0
        setBalance(cachedCoins)
        console.log('💰 Coins page loaded instantly:', cachedCoins)

        // Get transaction history
        const transactions = await firebaseRealtime.getCoinTransactions(authUser.id, 50)
        setHistory(transactions)

        recalculateStats(transactions)
      } catch (error) {
        console.error('Error loading coin data:', error)
        setLoadError(`Failed to load coin data: ${error.message || 'Unknown error'}`)
        showError('Failed to load coin data')
      } finally {
        setIsLoading(false)
      }
    }

    loadCoinData()
  }, [authUser])

  // Filter transactions by date
  const filteredHistory = history.filter(tx => {
    if (filterDate === 'all') return true
    
    const txDate = new Date(tx.timestamp)
    const now = new Date()
    
    switch (filterDate) {
      case 'day':
        return txDate.toDateString() === now.toDateString()
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return txDate >= weekAgo
      case 'month':
        return txDate.getMonth() === now.getMonth() && 
               txDate.getFullYear() === now.getFullYear()
      default:
        return true
    }
  })

  const canDeleteTransaction = (timestamp) => {
    const txTs = normalizeTimestamp(timestamp)
    if (!txTs) return false
    const ageMs = Date.now() - txTs
    return ageMs >= MIN_DELETE_DAYS * 24 * 60 * 60 * 1000
  }

  const handleDeleteTransaction = async (transaction) => {
    if (!authUser?.id || !transaction?.id) return
    if (!canDeleteTransaction(transaction.timestamp)) {
      showError(`You can delete only transactions older than ${MIN_DELETE_DAYS} days`)
      return
    }

    const ok = window.confirm('Delete this transaction history item?')
    if (!ok) return

    const result = await firebaseRealtime.deleteCoinTransaction(authUser.id, transaction.id, MIN_DELETE_DAYS)
    if (!result.success) {
      showError(result.error || 'Failed to delete transaction')
      return
    }

    const nextHistory = history.filter((tx) => tx.id !== transaction.id)
    setHistory(nextHistory)
    recalculateStats(nextHistory)
    showSuccess('Transaction deleted from history')
  }

  // Format date
  const formatDate = (timestamp) => {
    const normalized = normalizeTimestamp(timestamp)
    if (!normalized) return 'N/A'
    const date = new Date(normalized)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Format amount with sign
  const formatAmount = (amount) => {
    if (!amount) return '0'
    return amount > 0 ? `+${amount}` : `${amount}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-900">Coins</h1>
        <p className="text-gray-500 mt-2">Track your skill exchange credits</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
        <div
          className="rounded-xl p-8 text-white border border-indigo-400/30 shadow-md"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #2563eb 100%)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white text-lg mb-2 font-semibold">Current Balance</p>
              <p className="text-5xl font-bold mb-2 text-white">{balance.toLocaleString()}</p>
              <p className="text-white/90 font-medium">SkillEx Credits</p>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <SCoinIcon size={40} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          icon={SCoinIcon} 
          label="Total Earned" 
          value={isLoading ? '...' : stats.totalEarned.toLocaleString()} 
        />
        <StatCard 
          icon={FiTrendingUp} 
          label="This Month" 
          value={isLoading ? '...' : stats.thisMonth.toLocaleString()} 
          trend={stats.thisMonth > 0 ? `+${stats.thisMonth}` : '0'}
        />
        <StatCard 
          icon={FiDownload} 
          label="Total Spent" 
          value={isLoading ? '...' : stats.totalSpent.toLocaleString()} 
        />
      </div>

      {/* Error Message */}
      {loadError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
        >
          <FiAlertCircle className="text-red-600 flex-shrink-0" size={24} />
          <div>
            <p className="font-semibold text-red-900">Error Loading Data</p>
            <p className="text-sm text-red-700">{loadError}</p>
          </div>
        </motion.div>
      )}

      {/* History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
            <option value="day">Today</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-500 mt-4">Loading transactions...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <SCoinIcon className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 text-lg font-semibold">No transactions yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Start earning coins by completing tasks on the Dashboard
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Balance</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Manage</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiCalendar size={16} />
                        {formatDate(transaction.timestamp)}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {transaction.reason || transaction.action || 'Coin transaction'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={transaction.amount > 0 ? 'success' : 'danger'}>
                        {formatAmount(transaction.amount)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-indigo-600">
                      {(transaction.balanceAfter || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canDeleteTransaction(transaction.timestamp) ? (
                        <button
                          onClick={() => handleDeleteTransaction(transaction)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition"
                          title="Delete this history item"
                        >
                          <FiTrash2 size={13} /> Delete
                        </button>
                      ) : (
                        <span
                          className="text-xs text-gray-400"
                          title={`Only transactions older than ${MIN_DELETE_DAYS} days can be deleted`}
                        >
                          Locked
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

    </div>
  )
}

export default Coins
