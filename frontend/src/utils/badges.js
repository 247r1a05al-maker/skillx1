import { FiUsers, FiHeart, FiMessageCircle, FiAward, FiTrendingUp, FiStar, FiZap, FiTarget, FiGift, FiCheckCircle } from 'react-icons/fi'

export const BADGES = {
  TEAM_PLAYER: {
    id: 'team_player',
    name: 'Team Player',
    description: 'Joined 5+ groups',
    icon: FiUsers,
    color: 'from-blue-500 to-blue-600',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    requirement: (stats) => stats.groups >= 5,
    progress: (stats) => Math.min((stats.groups / 5) * 100, 100)
  },
  
  GROUP_MASTER: {
    id: 'group_master',
    name: 'Group Master',
    description: 'Joined 10+ groups',
    icon: FiUsers,
    color: 'from-purple-500 to-purple-600',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    requirement: (stats) => stats.groups >= 10,
    progress: (stats) => Math.min((stats.groups / 10) * 100, 100)
  },

  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: '50+ followers',
    icon: FiHeart,
    color: 'from-pink-500 to-pink-600',
    textColor: 'text-pink-600',
    bgColor: 'bg-pink-50',
    requirement: (stats) => stats.followers >= 50,
    progress: (stats) => Math.min((stats.followers / 50) * 100, 100)
  },

  INFLUENCER: {
    id: 'influencer',
    name: 'Influencer',
    description: '100+ followers',
    icon: FiTrendingUp,
    color: 'from-orange-500 to-orange-600',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    requirement: (stats) => stats.followers >= 100,
    progress: (stats) => Math.min((stats.followers / 100) * 100, 100)
  },

  CONVERSATIONALIST: {
    id: 'conversationalist',
    name: 'Conversationalist',
    description: 'Sent 50+ messages',
    icon: FiMessageCircle,
    color: 'from-cyan-500 to-cyan-600',
    textColor: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    requirement: (stats) => stats.messagesSent >= 50,
    progress: (stats) => Math.min((stats.messagesSent / 50) * 100, 100)
  },

  COMMUNITY_LEADER: {
    id: 'community_leader',
    name: 'Community Leader',
    description: 'Created 3+ groups',
    icon: FiStar,
    color: 'from-yellow-500 to-yellow-600',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    requirement: (stats) => stats.groupsCreated >= 3,
    progress: (stats) => Math.min((stats.groupsCreated / 3) * 100, 100)
  },

  CONTENT_CREATOR: {
    id: 'content_creator',
    name: 'Content Creator',
    description: 'Posted 10+ times',
    icon: FiZap,
    color: 'from-indigo-500 to-indigo-600',
    textColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    requirement: (stats) => stats.postsCreated >= 10,
    progress: (stats) => Math.min((stats.postsCreated / 10) * 100, 100)
  },

  HELPFUL_HAND: {
    id: 'helpful_hand',
    name: 'Helpful Hand',
    description: 'Earned 500+ coins',
    icon: FiGift,
    color: 'from-green-500 to-green-600',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
    requirement: (stats) => stats.coins >= 500,
    progress: (stats) => Math.min((stats.coins / 500) * 100, 100)
  },

  CERTIFIED_EXPERT: {
    id: 'certified_expert',
    name: 'Certified Expert',
    description: 'Earned 3+ certificates',
    icon: FiAward,
    color: 'from-red-500 to-red-600',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    requirement: (stats) => stats.certificates >= 3,
    progress: (stats) => Math.min((stats.certificates / 3) * 100, 100)
  },

  SKILLED_TEACHER: {
    id: 'skilled_teacher',
    name: 'Skilled Teacher',
    description: 'Teaching 5+ skills',
    icon: FiTarget,
    color: 'from-teal-500 to-teal-600',
    textColor: 'text-teal-600',
    bgColor: 'bg-teal-50',
    requirement: (stats) => stats.teachingSkills >= 5,
    progress: (stats) => Math.min((stats.teachingSkills / 5) * 100, 100)
  },

  EAGER_LEARNER: {
    id: 'eager_learner',
    name: 'Eager Learner',
    description: 'Learning 5+ skills',
    icon: FiCheckCircle,
    color: 'from-lime-500 to-lime-600',
    textColor: 'text-lime-600',
    bgColor: 'bg-lime-50',
    requirement: (stats) => stats.learningSkills >= 5,
    progress: (stats) => Math.min((stats.learningSkills / 5) * 100, 100)
  }
}

export const calculateBadges = (userStats) => {
  const earnedBadges = []
  const inProgressBadges = []

  Object.values(BADGES).forEach(badge => {
    if (badge.requirement(userStats)) {
      earnedBadges.push(badge)
    } else if (badge.progress(userStats) > 0) {
      inProgressBadges.push({
        ...badge,
        progressPercentage: badge.progress(userStats)
      })
    }
  })

  return { earnedBadges, inProgressBadges }
}
