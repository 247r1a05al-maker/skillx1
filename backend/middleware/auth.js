import jwt from 'jsonwebtoken'

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    req.userId = decoded.userId
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    })
  }
}

export const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token

  if (!token) {
    return next(new Error('No token provided'))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    socket.userId = decoded.userId
    socket.user = decoded
    next()
  } catch (error) {
    next(new Error('Invalid token'))
  }
}
