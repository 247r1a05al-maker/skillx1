import jwt from 'jsonwebtoken'

export const generateToken = (userId, email, name) => {
  return jwt.sign(
    {
      userId,
      email,
      name,
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  )
}

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePassword = (password) => {
  return password.length >= 6
}

export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400
  }
}

export class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = []) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
  }
}
