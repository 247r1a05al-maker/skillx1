import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiExternalLink, FiInfo, FiAward, FiCheckCircle, FiDownload } from 'react-icons/fi'
import { Card, Button, Badge, Input } from '../components/UI'
import { useAuthStore } from '../store'
import firebaseRealtime from '../services/firebase-realtime'

// AI Rating Evaluator System
const evaluateCertificateRating = (certificate) => {
  let score = 0
  const factors = []

  // Company Reputation & Market Value (40%)
  const reputedCompanies = {
    'Coursera': 5, 'edX': 5, 'Udacity': 4, 'AWS Training & Certification': 5,
    'Google Cloud Certification': 5, 'Microsoft Azure Certifications': 5,
    'DeepLearning.AI': 5, 'Stanford Online': 5, 'Harvard Business School Online': 5,
    'Wharton Online': 5, 'PMI': 5, 'CompTIA': 5, '(ISC)²': 5, 'SANS / GIAC': 5,
    'Offensive Security': 5, 'Cisco Networking Academy': 5, 'Linux Foundation': 5,
    'CNCF Certifications': 5, 'Red Hat Certification': 5, 'DataCamp': 4,
    'IBM Training': 4, 'Google Career Certificates': 4
  }
  
  const reputationScore = reputedCompanies[certificate.name] || 2
  score += reputationScore * 0.4
  if (reputationScore >= 4) factors.push('✓ Strong company reputation')
  
  // Job Market Demand (35%)
  const jobDemandKeywords = ['AWS', 'Azure', 'GCP', 'Kubernetes', 'DevOps', 'Security', 'Cloud', 'Data Science', 'AI', 'Machine Learning', 'Networking', 'Linux', 'Docker']
  const hasDemandSkill = certificate.skills.some(skill => jobDemandKeywords.some(kw => skill.includes(kw)))
  const demandScore = hasDemandSkill ? 4 : 2
  score += demandScore * 0.35
  if (hasDemandSkill) factors.push('✓ High job market demand')
  
  // Course Quality & Hands-on (15%)
  const qualityIndicators = ['Project-based', 'Hands-on', 'mentored', 'verified', 'specialized', 'recognized']
  const hasQualityIndicator = qualityIndicators.some(indicator => certificate.note.toLowerCase().includes(indicator.toLowerCase()))
  const qualityScore = hasQualityIndicator ? 4 : 3
  score += qualityScore * 0.15
  if (hasQualityIndicator) factors.push('✓ High quality content')
  
  // Cost Effectiveness (10%)
  const costScore = certificate.type === 'free' ? 5 : 3
  score += costScore * 0.1
  if (certificate.type === 'free') factors.push('✓ Free access')

  const finalRating = Math.round(score)
  return { rating: Math.min(5, finalRating), factors }
}

const Certificates = () => {
  const { user: authUser } = useAuthStore()
  const [earnedCertificates, setEarnedCertificates] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterDepartment, setFilterDepartment] = useState('cse')
  const [expandedRatingId, setExpandedRatingId] = useState(null)
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortBy, setSortBy] = useState('rating')
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState(null)
  const [isRedeeming, setIsRedeeming] = useState(false)

  // Load user's earned certificates
  useEffect(() => {
    if (!authUser) return

    const userId = authUser.uid || authUser.id
    const unsubscribe = firebaseRealtime.subscribeToUserCertificates(userId, (certs) => {
      setEarnedCertificates(certs)
    })

    return () => unsubscribe?.()
  }, [authUser])

  // Ensure the default coupon exists (idempotent)
  useEffect(() => {
    if (!authUser) return
    firebaseRealtime.ensureCertificateCouponCode?.().catch(() => {})
  }, [authUser])

  // Redeem coupon code for coins (one-time per user)
  const handleRedeemCoupon = async () => {
    if (!authUser) {
      setCouponResult({ success: false, error: 'Please sign in to redeem codes' })
      return
    }

    const userId = authUser.uid || authUser.id
    const normalized = (couponCode || '').toString().replace(/\D/g, '').slice(0, 8)
    if (normalized.length !== 8) {
      setCouponResult({ success: false, error: 'Enter an 8-digit code' })
      return
    }

    setIsRedeeming(true)
    try {
      const result = await firebaseRealtime.redeemCouponCode(userId, normalized)
      setCouponResult(result)
    } catch (error) {
      console.error('Error redeeming coupon:', error)
      setCouponResult({ success: false, error: 'Something went wrong. Try again.' })
    } finally {
      setIsRedeeming(false)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Certificate resources data
  const certificateResources = [
    // Computer Science & Engineering
    { id: 1, name: 'Coursera', department: 'cse', type: 'paid', rating: 5, skills: ['Computer Science', 'Software Engineering', 'Programming'], link: 'https://www.coursera.org', note: 'Industry-recognized university and employer partners' },
    { id: 2, name: 'edX', department: 'cse', type: 'paid', rating: 5, skills: ['Computer Science', 'Algorithms', 'Systems'], link: 'https://www.edx.org', note: 'University-backed verified certificates' },
    { id: 3, name: 'Udacity', department: 'cse', type: 'paid', rating: 4, skills: ['Computer Science', 'Software Engineering'], link: 'https://www.udacity.com', note: 'Project-based Nanodegrees' },
    { id: 4, name: 'Pluralsight', department: 'cse', type: 'paid', rating: 3, skills: ['Computer Science', 'Software'], link: 'https://www.pluralsight.com', note: 'Upskilling platform' },
    { id: 5, name: 'LinkedIn Learning', department: 'cse', type: 'paid', rating: 3, skills: ['Computer Science', 'Programming'], link: 'https://www.linkedin.com/learning', note: 'Good for resume signal' },
    { id: 6, name: 'Codecademy', department: 'cse', type: 'paid', rating: 3, skills: ['Programming', 'Computer Science'], link: 'https://www.codecademy.com', note: 'Hands-on skill certs' },
    { id: 7, name: 'Khan Academy', department: 'cse', type: 'free', rating: 2, skills: ['Computer Science', 'Algorithms'], link: 'https://www.khanacademy.org', note: 'Learning proof' },
    { id: 8, name: 'Microsoft Learn', department: 'cse', type: 'free', rating: 5, skills: ['Computer Science', 'Azure', 'Cloud'], link: 'https://learn.microsoft.com', note: 'Training free; official cert exams paid' },
    { id: 9, name: 'Google Career Certificates', department: 'cse', type: 'paid', rating: 4, skills: ['Computer Science', 'IT Support'], link: 'https://grow.google/certificates', note: 'Career-focused certificates' },
    { id: 10, name: 'MIT OpenCourseWare', department: 'cse', type: 'free', rating: 3, skills: ['Computer Science'], link: 'https://ocw.mit.edu', note: 'Top content' },
    { id: 11, name: 'FutureLearn', department: 'cse', type: 'paid', rating: 3, skills: ['Computer Science'], link: 'https://www.futurelearn.com', note: 'University-partnered courses' },
    { id: 12, name: 'Udemy', department: 'cse', type: 'paid', rating: 2, skills: ['Computer Science', 'Programming'], link: 'https://www.udemy.com', note: 'Instructor-dependent' },
    { id: 13, name: 'DataCamp', department: 'cse', type: 'paid', rating: 4, skills: ['Data Science', 'Python', 'SQL'], link: 'https://www.datacamp.com', note: 'Hands-on data skills' },
    { id: 14, name: 'Kaggle Learn', department: 'cse', type: 'free', rating: 4, skills: ['Data Science', 'Machine Learning'], link: 'https://www.kaggle.com/learn', note: 'Free micro-courses' },
    { id: 15, name: 'IBM Training', department: 'cse', type: 'paid', rating: 4, skills: ['Data Science'], link: 'https://www.ibm.com/training', note: 'IBM-backed programs' },
    { id: 16, name: 'fast.ai', department: 'cse', type: 'free', rating: 4, skills: ['Data Science', 'Machine Learning'], link: 'https://www.fast.ai', note: 'Highly respected content' },
    { id: 17, name: 'DeepLearning.AI', department: 'cse', type: 'paid', rating: 5, skills: ['AI', 'Machine Learning'], link: 'https://www.deeplearning.ai', note: 'Industry-recognized specializations' },
    { id: 18, name: 'TensorFlow Certificate', department: 'cse', type: 'paid', rating: 4, skills: ['AI', 'Machine Learning'], link: 'https://www.tensorflow.org/certificate', note: 'Official TensorFlow Developer Certificate' },
    { id: 19, name: 'Stanford Online', department: 'cse', type: 'paid', rating: 5, skills: ['AI', 'Machine Learning'], link: 'https://online.stanford.edu', note: 'Top academic prestige' },

    // Cloud & IT
    { id: 20, name: 'AWS Training & Certification', department: 'it', type: 'paid', rating: 5, skills: ['Cloud', 'AWS'], link: 'https://aws.amazon.com/certification', note: 'Highly recognized cloud credentials' },
    { id: 21, name: 'Google Cloud Certification', department: 'it', type: 'paid', rating: 5, skills: ['Cloud', 'GCP'], link: 'https://cloud.google.com/certification', note: 'Industry-recognized GCP certs' },
    { id: 22, name: 'Microsoft Azure Certifications', department: 'it', type: 'paid', rating: 5, skills: ['Cloud', 'Azure'], link: 'https://learn.microsoft.com/en-us/certifications', note: 'Enterprise-recognized Azure certs' },
    { id: 23, name: 'CompTIA', department: 'it', type: 'paid', rating: 5, skills: ['Cybersecurity', 'Security+'], link: 'https://www.comptia.org/certifications', note: 'Vendor-neutral baseline certs' },
    { id: 24, name: '(ISC)²', department: 'it', type: 'paid', rating: 5, skills: ['Cybersecurity', 'CISSP'], link: 'https://www.isc2.org', note: 'Senior-level industry recognition' },
    { id: 25, name: 'SANS / GIAC', department: 'it', type: 'paid', rating: 5, skills: ['Cybersecurity', 'PenTesting'], link: 'https://www.giac.org', note: 'Top-tier security credentials' },
    { id: 26, name: 'Offensive Security', department: 'it', type: 'paid', rating: 5, skills: ['Cybersecurity', 'PenTesting'], link: 'https://www.offensive-security.com', note: 'OSCP and advanced hands-on certs' },
    { id: 27, name: 'Cisco Networking Academy', department: 'it', type: 'paid', rating: 5, skills: ['Networking', 'CCNA', 'CCNP'], link: 'https://www.netacad.com', note: 'Very high industry recognition' },
    { id: 28, name: 'Linux Foundation', department: 'it', type: 'paid', rating: 5, skills: ['DevOps', 'Linux', 'Kubernetes'], link: 'https://training.linuxfoundation.org', note: 'Industry-recognized open-source certs' },
    { id: 29, name: 'CNCF Certifications', department: 'it', type: 'paid', rating: 5, skills: ['DevOps', 'Kubernetes'], link: 'https://www.cncf.io/certification', note: 'CKA/CKAD respected globally' },
    { id: 30, name: 'Red Hat Certification', department: 'it', type: 'paid', rating: 5, skills: ['Cloud', 'DevOps'], link: 'https://www.redhat.com/en/services/certification', note: 'Enterprise-grade credentials' },

    // Business
    { id: 31, name: 'PMI', department: 'business', type: 'paid', rating: 5, skills: ['Business', 'Project Management'], link: 'https://www.pmi.org', note: 'PMP / CAPM global standard' },
    { id: 32, name: 'Harvard Business School Online', department: 'business', type: 'paid', rating: 5, skills: ['Business', 'Management'], link: 'https://online.hbs.edu', note: 'Top academic prestige' },
    { id: 33, name: 'Wharton Online', department: 'business', type: 'paid', rating: 5, skills: ['Business', 'Management'], link: 'https://online.wharton.upenn.edu', note: 'Highly respected business programs' },
    { id: 34, name: 'Skillshare', department: 'business', type: 'paid', rating: 3, skills: ['Business', 'Entrepreneurship'], link: 'https://www.skillshare.com', note: 'Practical creative business skills' },
    { id: 35, name: 'Simplilearn', department: 'business', type: 'paid', rating: 4, skills: ['Business', 'Project Management'], link: 'https://www.simplilearn.com', note: 'Exam prep for PMI and Agile' },

    // Design
    { id: 36, name: 'Adobe Academy', department: 'design', type: 'paid', rating: 4, skills: ['Design', 'Adobe', 'UI/UX'], link: 'https://www.adobe.com/education', note: 'Adobe design tools expertise' },
    { id: 37, name: 'Interaction Design Foundation', department: 'design', type: 'free', rating: 4, skills: ['UI/UX', 'Design'], link: 'https://www.ixdf.org', note: 'Comprehensive UX design education' },
    { id: 38, name: 'Google UX Design Certificate', department: 'design', type: 'paid', rating: 4, skills: ['UI/UX', 'Design'], link: 'https://grow.google/certificates/ux-design', note: 'Career-focused design certificate' },

    // Programming & Software Engineering (Advanced/Niche)
    { id: 39, name: 'Rust Foundation Developer Certification', department: 'cse', type: 'paid', rating: 5, skills: ['Rust', 'Systems Programming'], link: 'https://foundation.rust-lang.org', note: 'Industry-growing systems language' },
    { id: 40, name: 'Go Language Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Go', 'Golang', 'Systems'], link: 'https://go.dev', note: 'Industry-recognized for cloud/DevOps' },
    { id: 41, name: 'Scala Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Scala', 'Functional Programming', 'JVM'], link: 'https://www.lightbend.com', note: 'Enterprise Scala by Lightbend' },
    { id: 42, name: 'Zend Certified PHP Engineer', department: 'cse', type: 'paid', rating: 4, skills: ['PHP', 'Web Development'], link: 'https://www.zend.com', note: 'Recognized PHP certification' },
    { id: 43, name: 'Perl Foundation Certification', department: 'cse', type: 'paid', rating: 3, skills: ['Perl', 'System Administration'], link: 'https://www.perl.org', note: 'Niche but valid for legacy systems' },
    { id: 44, name: 'Ruby Association Certified Programmer', department: 'cse', type: 'paid', rating: 4, skills: ['Ruby', 'Rails', 'Web Development'], link: 'https://www.ruby.or.jp', note: 'Recognized Ruby certification' },
    { id: 45, name: 'Dart Programming Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Dart', 'Flutter', 'Mobile'], link: 'https://dart.dev', note: 'Growing with Flutter ecosystem' },
    { id: 46, name: 'Objective-C Developer Certification', department: 'cse', type: 'paid', rating: 3, skills: ['Objective-C', 'iOS', 'Apple'], link: 'https://apple.com', note: 'Apple ecosystem certification' },
    { id: 47, name: 'MATLAB Programming Certification', department: 'cse', type: 'paid', rating: 5, skills: ['MATLAB', 'Scientific Computing'], link: 'https://www.mathworks.com', note: 'Industry/Academic standard' },
    { id: 48, name: 'Groovy Certification', department: 'cse', type: 'paid', rating: 3, skills: ['Groovy', 'JVM', 'Testing'], link: 'https://groovy-lang.org', note: 'JVM-based dynamic language' },

    // Data Structures, Algorithms & Competitive Coding
    { id: 49, name: 'CodeChef Skill Certifications', department: 'cse', type: 'free', rating: 4, skills: ['Algorithms', 'Competitive Programming'], link: 'https://www.codechef.com/certification', note: 'Portfolio-based coding proof' },
    { id: 50, name: 'AtCoder Programming Certificates', department: 'cse', type: 'free', rating: 5, skills: ['Algorithms', 'Competitive Programming'], link: 'https://atcoder.jp', note: 'Competitive coding excellence' },
    { id: 51, name: 'TopCoder Skill Certifications', department: 'cse', type: 'paid', rating: 5, skills: ['Algorithms', 'Problem Solving'], link: 'https://www.topcoder.com', note: 'Industry contest recognition' },
    { id: 52, name: 'AlgoExpert Certificates', department: 'cse', type: 'paid', rating: 5, skills: ['Algorithms', 'Data Structures', 'Interviews'], link: 'https://www.algoexpert.io', note: 'Interview-focused algorithm mastery' },
    { id: 53, name: 'InterviewBit Skill Track Certificates', department: 'cse', type: 'free', rating: 4, skills: ['Algorithms', 'Data Structures', 'Interviews'], link: 'https://www.interviewbit.com', note: 'Tech interview preparation' },
    { id: 54, name: 'GeeksforGeeks Practice Track Certificates', department: 'cse', type: 'paid', rating: 4, skills: ['Algorithms', 'Programming'], link: 'https://practice.geeksforgeeks.org', note: 'Comprehensive practice platform' },
    { id: 55, name: 'CS50 Verified Certificates', department: 'cse', type: 'paid', rating: 5, skills: ['Computer Science', 'Algorithms'], link: 'https://cs50.harvard.edu', note: 'Harvard CS50 formal certificate' },
    { id: 56, name: 'MIT Algorithms Verified Track', department: 'cse', type: 'paid', rating: 5, skills: ['Algorithms', 'Computer Science'], link: 'https://mitxonline.mit.edu', note: 'MIT official credential' },

    // Operating Systems, Linux, Systems
    { id: 57, name: 'LPIC-1 Linux Certification', department: 'cse', type: 'paid', rating: 5, skills: ['Linux', 'Operating Systems', 'System Administration'], link: 'https://www.lpi.org', note: 'Industry-recognized Linux foundation' },
    { id: 58, name: 'LPIC-2 Linux Certification', department: 'cse', type: 'paid', rating: 5, skills: ['Linux', 'Advanced Administration'], link: 'https://www.lpi.org', note: 'Advanced Linux systems engineer' },
    { id: 59, name: 'Oracle Linux OCA/OCP', department: 'cse', type: 'paid', rating: 5, skills: ['Linux', 'Oracle', 'System Administration'], link: 'https://education.oracle.com', note: 'Enterprise Linux certification' },
    { id: 60, name: 'SUSE Certified Administrator', department: 'cse', type: 'paid', rating: 4, skills: ['Linux', 'SUSE', 'System Administration'], link: 'https://www.suse.com', note: 'SUSE enterprise systems' },
    { id: 61, name: 'FreeBSD Certification', department: 'cse', type: 'paid', rating: 4, skills: ['FreeBSD', 'Operating Systems', 'Unix'], link: 'https://www.freebsd.org', note: 'Open-source BSD systems' },
    { id: 62, name: 'Unix System Administrator Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Unix', 'System Administration'], link: 'https://www.unix.org', note: 'Legacy systems expertise' },
    { id: 63, name: 'OpenBSD Security Certification', department: 'cse', type: 'free', rating: 4, skills: ['OpenBSD', 'Security', 'Operating Systems'], link: 'https://www.openbsd.org', note: 'Security-focused BSD systems' },
    { id: 64, name: 'System Programming in C Certification', department: 'cse', type: 'paid', rating: 5, skills: ['C', 'Systems Programming', 'Low-Level'], link: 'https://training.linuxfoundation.org', note: 'Low-level systems expertise' },
    { id: 65, name: 'POSIX Systems Certification', department: 'cse', type: 'paid', rating: 4, skills: ['POSIX', 'Systems', 'Operating Systems'], link: 'https://www.posix.org', note: 'Portable OS standards' },

    // Databases, Data Engineering
    { id: 66, name: 'PostgreSQL Professional Certification', department: 'cse', type: 'paid', rating: 5, skills: ['PostgreSQL', 'Databases', 'SQL'], link: 'https://www.postgresql.org', note: 'Advanced open-source DB' },
    { id: 67, name: 'MySQL Developer Certification', department: 'cse', type: 'paid', rating: 4, skills: ['MySQL', 'Databases', 'SQL'], link: 'https://www.mysql.com', note: 'Oracle MySQL certification' },
    { id: 68, name: 'Cassandra Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Cassandra', 'NoSQL', 'Distributed Databases'], link: 'https://cassandra.apache.org', note: 'Distributed NoSQL expertise' },
    { id: 69, name: 'Redis University Certification', department: 'cse', type: 'free', rating: 4, skills: ['Redis', 'Databases', 'Caching'], link: 'https://university.redis.com', note: 'In-memory data structure DB' },
    { id: 70, name: 'Neo4j Graph Database Certification', department: 'cse', type: 'free', rating: 4, skills: ['Neo4j', 'Graph Databases', 'NoSQL'], link: 'https://graphacademy.neo4j.com', note: 'Graph database expertise' },
    { id: 71, name: 'ElasticSearch Engineer Certification', department: 'cse', type: 'paid', rating: 4, skills: ['ElasticSearch', 'Search Engines', 'Databases'], link: 'https://www.elastic.co', note: 'Full-text search mastery' },
    { id: 72, name: 'Apache Hadoop Certification', department: 'cse', type: 'paid', rating: 5, skills: ['Hadoop', 'Big Data', 'Data Engineering'], link: 'https://hadoop.apache.org', note: 'Big data distributed processing' },
    { id: 73, name: 'Apache Spark Developer Certification', department: 'cse', type: 'paid', rating: 5, skills: ['Spark', 'Big Data', 'Data Engineering'], link: 'https://spark.apache.org', note: 'Fast distributed data processing' },
    { id: 74, name: 'Snowflake SnowPro Core', department: 'cse', type: 'paid', rating: 5, skills: ['Snowflake', 'Cloud Data Warehouse'], link: 'https://www.snowflake.com', note: 'Cloud data warehouse certification' },
    { id: 75, name: 'MongoDB Certified Developer Associate', department: 'cse', type: 'paid', rating: 4, skills: ['MongoDB', 'NoSQL', 'Databases'], link: 'https://university.mongodb.com/certification', note: 'NoSQL document DB expertise' },

    // Web Development (Framework-Level)
    { id: 76, name: 'Next.js Developer Certification', department: 'design', type: 'paid', rating: 4, skills: ['Next.js', 'React', 'Web Development'], link: 'https://nextjs.org', note: 'React framework mastery' },
    { id: 77, name: 'Nuxt.js Developer Certification', department: 'design', type: 'paid', rating: 4, skills: ['Nuxt.js', 'Vue', 'Web Development'], link: 'https://nuxt.com', note: 'Vue framework expertise' },
    { id: 78, name: 'Svelte Developer Certification', department: 'design', type: 'paid', rating: 4, skills: ['Svelte', 'Web Development', 'Frontend'], link: 'https://svelte.dev', note: 'Reactive UI framework' },
    { id: 79, name: 'Django Developer Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Django', 'Python', 'Web Development'], link: 'https://www.djangoproject.com', note: 'Full-stack Python web' },
    { id: 80, name: 'Flask Web Developer Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Flask', 'Python', 'Web Development'], link: 'https://flask.palletsprojects.com', note: 'Lightweight Python framework' },
    { id: 81, name: 'Laravel Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Laravel', 'PHP', 'Web Development'], link: 'https://laravel.com', note: 'Modern PHP web framework' },
    { id: 82, name: 'ASP.NET Core Certification', department: 'cse', type: 'paid', rating: 5, skills: ['ASP.NET', '.NET', 'Web Development'], link: 'https://learn.microsoft.com', note: 'Enterprise .NET framework' },
    { id: 83, name: 'FastAPI Certification', department: 'cse', type: 'paid', rating: 4, skills: ['FastAPI', 'Python', 'APIs'], link: 'https://fastapi.tiangolo.com', note: 'High-performance API framework' },
    { id: 84, name: 'WebAssembly (WASM) Developer Certification', department: 'cse', type: 'paid', rating: 4, skills: ['WebAssembly', 'Low-Level Web', 'Performance'], link: 'https://webassembly.org', note: 'Browser binary format' },
    { id: 85, name: 'Progressive Web App (PWA) Certification', department: 'design', type: 'paid', rating: 4, skills: ['PWA', 'Web Development', 'Mobile'], link: 'https://web.dev', note: 'Offline-capable web apps' },

    // Software Testing, QA, Reliability
    { id: 86, name: 'Selenium Advanced Automation Certification', department: 'cse', type: 'paid', rating: 5, skills: ['Selenium', 'Test Automation', 'QA'], link: 'https://www.selenium.dev', note: 'Browser automation testing' },
    { id: 87, name: 'Cypress.io Testing Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Cypress', 'Test Automation', 'Frontend'], link: 'https://cypress.io', note: 'Modern JavaScript testing' },
    { id: 88, name: 'Playwright Testing Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Playwright', 'Test Automation', 'Frontend'], link: 'https://playwright.dev', note: 'Cross-browser automation' },
    { id: 89, name: 'JMeter Performance Testing Certification', department: 'cse', type: 'paid', rating: 4, skills: ['JMeter', 'Load Testing', 'Performance'], link: 'https://jmeter.apache.org', note: 'Stress and load testing' },
    { id: 90, name: 'Chaos Engineering Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Chaos Engineering', 'Resilience', 'DevOps'], link: 'https://www.gremlin.com', note: 'Fault injection and resilience' },
    { id: 91, name: 'Site Reliability Engineering (SRE) Certification', department: 'it', type: 'paid', rating: 5, skills: ['SRE', 'DevOps', 'Reliability'], link: 'https://sre.google', note: 'Google SRE principles' },
    { id: 92, name: 'LoadRunner Certification', department: 'cse', type: 'paid', rating: 4, skills: ['LoadRunner', 'Performance Testing', 'QA'], link: 'https://www.microfocus.com', note: 'Enterprise load testing' },

    // Computer Networks (Deep/Vendor-Specific)
    { id: 93, name: 'MikroTik Certified Network Associate', department: 'it', type: 'paid', rating: 4, skills: ['MikroTik', 'Networking', 'Routing'], link: 'https://mikrotik.com', note: 'RouterOS expertise' },
    { id: 94, name: 'Ubiquiti Network Certification', department: 'it', type: 'paid', rating: 4, skills: ['Ubiquiti', 'Networking', 'Wireless'], link: 'https://www.ubiquiti.com', note: 'Enterprise wireless networks' },
    { id: 95, name: 'Huawei HCIA Networking', department: 'it', type: 'paid', rating: 4, skills: ['Huawei', 'Networking', 'Enterprise'], link: 'https://www.huawei.com/training', note: 'Chinese enterprise networking' },
    { id: 96, name: 'Huawei HCIP Networking', department: 'it', type: 'paid', rating: 5, skills: ['Huawei', 'Advanced Networking'], link: 'https://www.huawei.com/training', note: 'Advanced Huawei systems' },
    { id: 97, name: 'Extreme Networks Certification', department: 'it', type: 'paid', rating: 4, skills: ['Extreme Networks', 'Networking'], link: 'https://www.extremenetworks.com', note: 'High-performance networks' },
    { id: 98, name: 'Riverbed WAN Optimization Certification', department: 'it', type: 'paid', rating: 4, skills: ['Riverbed', 'WAN', 'Network Optimization'], link: 'https://www.riverbed.com', note: 'Wide-area network optimization' },
    { id: 99, name: 'Alcatel-Lucent Network Certification', department: 'it', type: 'paid', rating: 4, skills: ['Alcatel-Lucent', 'Networking', 'Telecommunications'], link: 'https://www.nokia.com', note: 'Telecom networking' },
    { id: 100, name: 'Open Networking Foundation Certification', department: 'it', type: 'paid', rating: 4, skills: ['SDN', 'OpenFlow', 'Networking'], link: 'https://www.opennetworking.org', note: 'Software-defined networking' },

    // Cybersecurity (Advanced/Hands-On)
    { id: 101, name: 'Blue Team Level 1 (BTL1)', department: 'it', type: 'paid', rating: 5, skills: ['Cybersecurity', 'Defensive Security', 'Blue Team'], link: 'https://www.securityblue.team', note: 'Defensive security fundamentals' },
    { id: 102, name: 'Blue Team Level 2 (BTL2)', department: 'it', type: 'paid', rating: 5, skills: ['Cybersecurity', 'Advanced Defense', 'Blue Team'], link: 'https://www.securityblue.team', note: 'Advanced defensive tactics' },
    { id: 103, name: 'eLearnSecurity eJPT', department: 'it', type: 'paid', rating: 4, skills: ['PenTesting', 'Cybersecurity', 'Hacking'], link: 'https://www.elearnsecurity.com', note: 'Entry-level pentesting' },
    { id: 104, name: 'eLearnSecurity eCPPT', department: 'it', type: 'paid', rating: 4, skills: ['PenTesting', 'Cybersecurity', 'Advanced'], link: 'https://www.elearnsecurity.com', note: 'Certified Ethical Hacker equivalent' },
    { id: 105, name: 'Security Blue Team Certifications', department: 'it', type: 'paid', rating: 5, skills: ['Cybersecurity', 'Blue Team', 'Defense'], link: 'https://www.securityblue.team', note: 'Defensive cybersecurity focus' },
    { id: 106, name: 'Malware Reverse Engineering Certification', department: 'it', type: 'paid', rating: 5, skills: ['Reverse Engineering', 'Malware Analysis', 'Security'], link: 'https://www.sans.org', note: 'Advanced threat analysis' },
    { id: 107, name: 'Digital Forensics Certification', department: 'it', type: 'paid', rating: 5, skills: ['Digital Forensics', 'Incident Response', 'Security'], link: 'https://www.sans.org', note: 'Evidence collection expertise' },
    { id: 108, name: 'SOC Analyst Certification', department: 'it', type: 'paid', rating: 4, skills: ['Cybersecurity', 'SOC', 'Monitoring'], link: 'https://www.eccouncil.org', note: 'Security operations center skills' },

    // Software Architecture & Design
    { id: 109, name: 'TOGAF Certification', department: 'cse', type: 'paid', rating: 5, skills: ['Architecture', 'Enterprise Design'], link: 'https://www.opengroup.org', note: 'Enterprise architecture standard' },
    { id: 110, name: 'Certified Software Architect (CSAI)', department: 'cse', type: 'paid', rating: 4, skills: ['Architecture', 'Software Design'], link: 'https://www.icmaa.org', note: 'Advanced architecture skills' },
    { id: 111, name: 'Microservices Architecture Certification', department: 'cse', type: 'paid', rating: 5, skills: ['Microservices', 'Architecture', 'Distributed Systems'], link: 'https://www.nginx.com', note: 'Modern distributed architecture' },
    { id: 112, name: 'Design Patterns Certification', department: 'design', type: 'paid', rating: 4, skills: ['Design Patterns', 'Software Design'], link: 'https://refactoring.guru', note: 'OOP pattern mastery' },
    { id: 113, name: 'UML Professional Certification', department: 'cse', type: 'paid', rating: 4, skills: ['UML', 'Modeling', 'Software Design'], link: 'https://www.omg.org', note: 'Unified Modeling Language' },

    // Emerging/Trending CSE Areas
    { id: 114, name: 'Blockchain Developer Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Blockchain', 'Web3', 'Cryptocurrency'], link: 'https://www.coursera.org', note: 'Distributed ledger technology' },
    { id: 115, name: 'Web3 Developer Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Web3', 'Blockchain', 'Decentralized'], link: 'https://www.web3js.org', note: 'Decentralized web development' },
    { id: 116, name: 'Solidity Smart Contract Certification', department: 'cse', type: 'paid', rating: 5, skills: ['Solidity', 'Smart Contracts', 'Ethereum'], link: 'https://solidity.readthedocs.io', note: 'Ethereum smart contract programming' },
    { id: 117, name: 'Quantum Computing Fundamentals Certification', department: 'cse', type: 'paid', rating: 5, skills: ['Quantum Computing', 'Physics', 'Advanced CS'], link: 'https://www.ibm.com/quantum', note: 'Next-generation computing' },
    { id: 118, name: 'AR/VR Developer Certification', department: 'design', type: 'paid', rating: 4, skills: ['AR/VR', 'Immersive Tech', 'Graphics'], link: 'https://www.vuforia.com', note: 'Augmented/Virtual reality' },
    { id: 119, name: 'Edge Computing Certification', department: 'it', type: 'paid', rating: 4, skills: ['Edge Computing', 'IoT', 'Cloud'], link: 'https://www.intel.com/edge-ai', note: 'Distributed edge processing' },
    { id: 120, name: 'Digital Twin Engineering Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Digital Twin', 'IoT', 'Engineering'], link: 'https://www.siemens.com', note: 'Virtual-physical system modeling' },
    { id: 121, name: 'Low-Code / No-Code Developer Certification', department: 'business', type: 'paid', rating: 3, skills: ['Low-Code', 'Business Automation'], link: 'https://learn.microsoft.com', note: 'Rapid application development' },
    { id: 122, name: 'Apache Kafka Streaming Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Kafka', 'Streaming', 'Big Data'], link: 'https://kafka.apache.org', note: 'Event streaming platform expertise' },
    { id: 123, name: 'RabbitMQ Advanced Messaging Certification', department: 'cse', type: 'paid', rating: 4, skills: ['RabbitMQ', 'Messaging', 'Distributed Systems'], link: 'https://www.rabbitmq.com', note: 'Message broker mastery' },
    { id: 124, name: 'Apache Airflow Data Pipeline Certification', department: 'cse', type: 'paid', rating: 4, skills: ['Airflow', 'Data Pipelines', 'Orchestration'], link: 'https://airflow.apache.org', note: 'Workflow orchestration expertise' },
    { id: 125, name: 'Kubernetes Advanced Administrator', department: 'it', type: 'paid', rating: 5, skills: ['Kubernetes', 'Container Orchestration', 'DevOps'], link: 'https://www.cncf.io/certification', note: 'Advanced K8s administration' },
    { id: 126, name: 'Terraform Associate Certification', department: 'it', type: 'paid', rating: 4, skills: ['Terraform', 'Infrastructure', 'IaC'], link: 'https://www.hashicorp.com/certification', note: 'Infrastructure as Code expertise' },
    { id: 127, name: 'Vault Associate Certification', department: 'it', type: 'paid', rating: 4, skills: ['Vault', 'Secrets Management', 'Security'], link: 'https://www.hashicorp.com/certification', note: 'HashiCorp Vault expertise' },
    { id: 128, name: 'Consul Associate Certification', department: 'it', type: 'paid', rating: 4, skills: ['Consul', 'Service Mesh', 'Networking'], link: 'https://www.hashicorp.com/certification', note: 'Service mesh and networking' },
    { id: 129, name: 'Puppet Certified Associate', department: 'it', type: 'paid', rating: 4, skills: ['Puppet', 'Configuration Management', 'DevOps'], link: 'https://www.puppet.com', note: 'Infrastructure automation' },
    { id: 130, name: 'Chef Certified Associate', department: 'it', type: 'paid', rating: 4, skills: ['Chef', 'Infrastructure', 'DevOps'], link: 'https://www.chef.io', note: 'Infrastructure as Code platform' },
    { id: 131, name: 'Istio Service Mesh Certification', department: 'it', type: 'paid', rating: 4, skills: ['Istio', 'Kubernetes', 'Service Mesh'], link: 'https://istio.io', note: 'Advanced service mesh' },
    { id: 132, name: 'Prometheus Monitoring Certification', department: 'it', type: 'paid', rating: 4, skills: ['Prometheus', 'Monitoring', 'Observability'], link: 'https://prometheus.io', note: 'Systems monitoring mastery' },
    { id: 133, name: 'Grafana Advanced Dashboard Certification', department: 'it', type: 'paid', rating: 4, skills: ['Grafana', 'Visualization', 'Monitoring'], link: 'https://grafana.com', note: 'Advanced visualization skills' },
    { id: 134, name: 'ELK Stack (Elasticsearch) Certification', department: 'it', type: 'paid', rating: 4, skills: ['ELK', 'Logging', 'Analytics'], link: 'https://www.elastic.co', note: 'Log aggregation and analysis' },
    { id: 135, name: 'SaltStack Configuration Management', department: 'it', type: 'paid', rating: 4, skills: ['SaltStack', 'Configuration', 'DevOps'], link: 'https://saltproject.io', note: 'Remote execution and configuration' },
    { id: 136, name: 'Ansible Automation Specialist', department: 'it', type: 'paid', rating: 4, skills: ['Ansible', 'Automation', 'DevOps'], link: 'https://www.ansible.com', note: 'IT automation platform expertise' },
  ]

  // Department definitions
  const departments = [
    { id: 'all', label: 'All', name: 'All Departments', count: 136 },
    { id: 'cse', label: 'CSE', name: 'Computer Science & Engineering', count: 70 },
    { id: 'it', label: 'IT', name: 'Information Technology', count: 40 },
    { id: 'design', label: 'Design', name: 'UI/UX & Design', count: 8 },
    { id: 'business', label: 'Business', name: 'Business & Management', count: 5 },
  ]

  // Get all unique skills and certificate names
  const allSkills = [...new Set(certificateResources.flatMap(c => c.skills))].sort()
  const allCertificateNames = [...new Set(certificateResources.map(c => c.name))].sort()

  // Quick filter presets
  const quickFilters = [
    { label: 'Free Backend', skill: 'Backend', type: 'free', dept: 'cse' },
    { label: 'Free DSA', skill: 'Algorithms', type: 'free', dept: 'cse' },
    { label: 'Free Cloud', skill: 'Cloud', type: 'free', dept: 'it' },
    { label: 'Paid Security', skill: 'Cybersecurity', type: 'paid', dept: 'it' },
    { label: 'Free AI/ML', skill: 'Machine Learning', type: 'free', dept: 'cse' },
    { label: 'All Free', skill: '', type: 'free', dept: 'all' },
  ]

  const applyQuickFilter = (filter) => {
    if (filter.skill) setSearchTerm(filter.skill)
    setFilterType(filter.type)
    setFilterDepartment(filter.dept)
  }

  // Search suggestions
  const getSearchSuggestions = (query) => {
    if (!query.trim()) return []
    
    const lowerQuery = query.toLowerCase()
    const suggestions = new Set()
    
    allSkills.forEach(skill => {
      if (skill.toLowerCase().includes(lowerQuery)) {
        suggestions.add({ type: 'skill', value: skill })
      }
    })
    
    allCertificateNames.forEach(name => {
      if (name.toLowerCase().includes(lowerQuery)) {
        suggestions.add({ type: 'certificate', value: name })
      }
    })
    
    return Array.from(suggestions).slice(0, 8)
  }

  const handleSearchInput = (value) => {
    setSearchTerm(value)
    const suggestions = getSearchSuggestions(value)
    setSearchSuggestions(suggestions)
    setShowSuggestions(suggestions.length > 0)
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.value)
    setShowSuggestions(false)
  }

  // Filter & sort logic
  const filteredResources = certificateResources.filter((resource) => {
    const matchesDepartment = filterDepartment === 'all' || resource.department === filterDepartment
    const matchesType = filterType === 'all' || resource.type === filterType
    const term = searchTerm.trim().toLowerCase()
    const matchesSearch =
      term.length === 0 ||
      resource.name.toLowerCase().includes(term) ||
      resource.skills.some((skill) => skill.toLowerCase().includes(term))
    return matchesDepartment && matchesType && matchesSearch
  }).sort((a, b) => {
    if (sortBy === 'rating') {
      const ratingA = evaluateCertificateRating(a).rating
      const ratingB = evaluateCertificateRating(b).rating
      return ratingB - ratingA
    } else if (sortBy === 'recent') {
      return b.id - a.id
    } else if (sortBy === 'free-first') {
      if (a.type === 'free' && b.type !== 'free') return -1
      if (a.type !== 'free' && b.type === 'free') return 1
      return 0
    }
    return 0
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold theme-text-primary">Certificates</h1>
        <p className="theme-text-secondary mt-2">Your achievements and completed skills</p>
      </motion.div>

      {/* Earned Certificates Section */}
      {earnedCertificates.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-3">
            <FiAward className="text-indigo-600" size={24} />
            <h2 className="text-2xl font-bold theme-text-primary">My Earned Certificates</h2>
            <Badge variant="primary">{earnedCertificates.length}</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedCertificates.map((cert) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <FiAward className="text-indigo-600" size={32} />
                  </div>
                  <FiCheckCircle className="text-green-600" size={24} />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">{cert.skillName}</h3>
                <p className="text-sm text-gray-600 mb-1">Issued by: <span className="font-semibold">{cert.issuerName}</span></p>
                <p className="text-xs text-gray-500 mb-3">{formatDate(cert.issuedAt)}</p>
                
                <div className="bg-white rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-1">Certificate Number:</p>
                  <p className="text-xs font-mono font-semibold text-indigo-600 break-all">{cert.certificateNumber}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => alert('Download feature coming soon!')}
                  >
                    <FiDownload className="mr-1" /> Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigator.clipboard.writeText(cert.certificateNumber)}
                  >
                    Copy #
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Coupon Redemption Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50">
        <h3 className="text-lg font-bold theme-text-primary mb-4 flex items-center gap-2">
          <FiCheckCircle size={20} /> Redeem Code
        </h3>
        <p className="text-sm text-gray-600 mb-4">Enter an 8-digit code to claim coins. Each user can redeem a code only once.</p>

        <div className="flex gap-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            placeholder="Enter 8-digit code"
            value={couponCode}
            onChange={(e) => {
              const next = (e.target.value || '').replace(/\D/g, '').slice(0, 8)
              setCouponCode(next)
              if (couponResult) setCouponResult(null)
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button
            variant="primary"
            onClick={handleRedeemCoupon}
            disabled={isRedeeming || couponCode.trim().length !== 8}
          >
            {isRedeeming ? 'Checking...' : 'Claim'}
          </Button>
        </div>

        {couponResult?.success ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-white rounded-lg border-2 border-green-500"
          >
            <div className="flex items-start gap-3">
              <FiCheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
              <div className="flex-1">
                <h4 className="font-bold text-green-900 mb-2">✓ Code Redeemed!</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><span className="font-semibold">Coins added:</span> +{couponResult.coinsAwarded}</p>
                  <p><span className="font-semibold">New balance:</span> {couponResult.newBalance}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}

        {couponResult?.success === false ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 rounded-lg border-2 border-red-200"
          >
            <p className="text-red-700 text-sm">❌ {couponResult.error || 'Invalid code. Please try again.'}</p>
          </motion.div>
        ) : null}
      </Card>

      <div className="border-t-2 border-gray-200 my-6"></div>

      {/* Certificate Resources Header */}
      <div>
        <h2 className="text-2xl font-bold theme-text-primary mb-2">Certificate Resources</h2>
        <p className="theme-text-secondary">Explore certification programs to enhance your skills</p>
      </div>

      {/* Department & Filter Section */}
      <Card className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold theme-text-primary">Select Department</p>
            <p className="text-xs theme-text-tertiary">Total: <span className="font-bold text-indigo-600">{certificateResources.length}</span> certificates</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {departments.map((dept) => (
              <Button
                key={dept.id}
                variant={filterDepartment === dept.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilterDepartment(dept.id)}
                className="text-xs flex flex-col items-center gap-1"
              >
                <span>{dept.label}</span>
                <span className="text-xs opacity-75">({dept.count})</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Search with Autocomplete */}
          <div className="relative">
            <Input
              placeholder="Search certificates or skills..."
              value={searchTerm}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => searchTerm && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="theme-input"
            />
            
            {/* Autocomplete Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
              >
                {searchSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="theme-text-primary font-medium text-sm">{suggestion.value}</span>
                      <span className="text-xs theme-text-tertiary">{suggestion.type === 'skill' ? '🏷️ Skill' : '📜 Certificate'}</span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <p className="text-xs font-semibold theme-text-secondary">Quick Filters:</p>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => applyQuickFilter(filter)}
                  className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  {filter.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold theme-text-secondary">Sort:</span>
            <Button 
              variant={sortBy === 'rating' ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setSortBy('rating')}
            >
              ⭐ Rating
            </Button>
            <Button 
              variant={sortBy === 'recent' ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setSortBy('recent')}
            >
              🆕 Recent
            </Button>
            <Button 
              variant={sortBy === 'free-first' ? 'primary' : 'outline'} 
              size="sm" 
              onClick={() => setSortBy('free-first')}
            >
              💰 Free First
            </Button>
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-2">
            <Button variant={filterType === 'all' ? 'primary' : 'outline'} size="sm" onClick={() => setFilterType('all')}>
              All
            </Button>
            <Button variant={filterType === 'free' ? 'primary' : 'outline'} size="sm" onClick={() => setFilterType('free')}>
              Free
            </Button>
            <Button variant={filterType === 'paid' ? 'primary' : 'outline'} size="sm" onClick={() => setFilterType('paid')}>
              Paid
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 py-2 px-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg">
          <div className="text-sm theme-text-secondary">
            Found <span className="font-bold text-indigo-600">{filteredResources.length}</span> of <span className="font-bold">{certificateResources.length}</span> certificates
            {searchTerm && <span className="ml-2">matching <span className="font-semibold">"{searchTerm}"</span></span>}
          </div>
        </div>
      </Card>

      {/* Certificate Resources Grid */}
      <div className="max-h-[70vh] overflow-y-auto rounded-lg pr-3 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
          {filteredResources.map((resource) => (
            <motion.div
              key={resource.id}
              whileHover={{ y: -5, boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)' }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full space-y-4 border-l-4 border-l-indigo-500 hover:border-l-indigo-600 transition-colors duration-300 shadow-md hover:shadow-lg">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {resource.name
                        .split(' ')
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold theme-text-primary line-clamp-2">{resource.name}</h3>
                    </div>
                  </div>
                  <Badge variant={resource.type === 'free' ? 'success' : 'warning'} className="flex-shrink-0">
                    {resource.type === 'free' ? 'FREE' : 'PAID'}
                  </Badge>
                </div>

                {/* Rating */}
                {(() => {
                  const { rating, factors } = evaluateCertificateRating(resource)
                  const isExpanded = expandedRatingId === resource.id
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                           onClick={() => setExpandedRatingId(isExpanded ? null : resource.id)}>
                        <div className="flex items-center gap-1 text-yellow-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className="text-lg">{i < rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs theme-text-tertiary font-medium">{rating}/5</span>
                          <FiInfo size={14} className="text-indigo-500" />
                        </div>
                      </div>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-indigo-50 dark:bg-indigo-900/20 rounded p-2 space-y-1 text-xs"
                        >
                          <p className="font-semibold theme-text-primary mb-2">Rating Criteria:</p>
                          {factors.map((factor, idx) => (
                            <div key={idx} className="theme-text-secondary">{factor}</div>
                          ))}
                          <p className="text-xs theme-text-tertiary mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-800">
                            Based on: Company reputation (40%), Job demand (35%), Quality (15%), Cost (10%)
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )
                })()}

                {/* Description */}
                <p className="text-sm theme-text-secondary leading-relaxed line-clamp-3">{resource.note}</p>

                {/* Skills */}
                <div className="flex flex-wrap gap-2">
                  {resource.skills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="gray" className="text-xs">{skill}</Badge>
                  ))}
                  {resource.skills.length > 4 && (
                    <span className="text-xs theme-text-tertiary px-2 py-1">+{resource.skills.length - 4} more</span>
                  )}
                </div>

                {/* Button */}
                <a
                  href={resource.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors duration-300"
                >
                  Visit Website <FiExternalLink size={16} />
                </a>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Certificates
