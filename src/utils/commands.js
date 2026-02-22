import React from 'react'
import { toast } from 'react-toastify'
import { getDatabase, ref, set } from 'firebase/database'
import { useAuthStore } from '../store'

// Programming jokes
const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem! 💡",
  "Why do Java developers always have a hard time seeing the forest for the trees? Because they're so focused on the objects! 🌳",
  "Why do programmers always get Christmas and Halloween mixed up? Because DEC 25 = OCT 31! 🎃",
  "Why did the programmer quit his job? Because he didn't get arrays! 📊",
  "How do you know if there's a programmer at your door? They can't find the key! 🔑",
  "Why do programmers prefer to use Linux? Because it's GNU! 🐧",
  "A programmer is told to go to the store and buy a loaf of bread, and if they have eggs, buy a dozen. He comes home with 13 loaves of bread. 🍞",
  "Why did the dev go broke? Because he used up all his cache! 💸",
  "How many programmers does it take to change a light bulb? None, that's a DevOps problem! 🔧",
]

// Online Games Database
const onlineGames = [
  { name: 'Chess.com', emoji: '♟️', url: 'https://www.chess.com' },
  { name: 'Lichess', emoji: '♟️', url: 'https://lichess.org' },
  { name: 'Pokemon Showdown', emoji: '🔴', url: 'https://pokemonshowdown.com' },
  { name: 'Match Madness', emoji: '🃏', url: 'https://www.matchmadness.com' },
  { name: 'Duolingo Games', emoji: '🦉', url: 'https://www.duolingo.com/play' },
  { name: 'Sudoku.com', emoji: '🔢', url: 'https://sudoku.com' },
  { name: 'Wordle', emoji: '📝', url: 'https://www.nytimes.com/games/wordle' },
  { name: 'Cookie Clicker', emoji: '🍪', url: 'https://cookieclicker.com' },
  { name: 'Agar.io', emoji: '⭕', url: 'https://agar.io' },
  { name: 'Slither.io', emoji: '🐍', url: 'https://slither.io' },
  { name: 'Tetris', emoji: '⬛', url: 'https://tetris.com' },
  { name: 'Smash Karts', emoji: '🏎️', url: 'https://smashkarts.io' },
  { name: 'Among Us', emoji: '👾', url: 'https://www.innersloth.com/games/among-us' },
  { name: 'Dino Game', emoji: '🦖', url: 'chrome://dino' },
  { name: 'Poptropica', emoji: '🏝️', url: 'https://www.poptropica.com' },
  { name: 'Roblox', emoji: '🎮', url: 'https://www.roblox.com' },
]

// Birthday Wishes Messages
const birthdayWishes = [
  '🎉 Happy Birthday! 🎂 Time to celebrate your special day with joy and happiness!',
  '🎊 Wishing you a fantastic birthday filled with love, laughter, and amazing moments!',
  '🎈 Happy Birthday! 🌟 May this year bring you endless success and wonderful adventures!',
  '🎁 Another year older, another year wiser! Happy Birthday! 🥳 Enjoy every moment!',
  '🌺 Happy Birthday! 💝 May your day be as special as you are!',
  '🎵 It\'s your special day! 🎸 Let\'s celebrate with joy and great memories!',
  '✨ Happy Birthday Superstar! 🌟 Shine bright and enjoy your day to the fullest!',
  '🚀 Happy Birthday! 🎯 Here\'s to another year of amazing achievements!',
  '💫 Wishing you a magical birthday surrounded by love and happiness! 🎊',
  '🌈 Happy Birthday! 🦄 May all your dreams come true this year!',
]

const createMatrixEffect = () => {
  const canvas = document.createElement('canvas')
  canvas.id = 'matrix-effect'
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    pointer-events: none;
  `
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const fontSize = 20
  const columns = canvas.width / fontSize
  const drops = Array(Math.floor(columns)).fill(0)

  const draw = () => {
    ctx.fillStyle = 'rgba(10, 15, 28, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#00f0ff'
    ctx.font = `${fontSize}px monospace`
    ctx.textShadow = '0 0 10px rgba(0, 240, 255, 0.8)'

    for (let i = 0; i < drops.length; i++) {
      const text = Math.random() > 0.5 ? '1' : '0'
      ctx.fillText(text, i * fontSize, drops[i] * fontSize)

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0
      }
      drops[i]++
    }
  }

  let animationId
  const animate = () => {
    draw()
    animationId = requestAnimationFrame(animate)
  }

  animate()

  setTimeout(() => {
    cancelAnimationFrame(animationId)
    canvas.remove()
  }, 5000)
}

const createHackEffect = () => {
  const logs = [
    '[INIT] System access detected...',
    '[SCAN] Firewall: bypassed ✓',
    '[DECRYPT] Security layers: 7/7 cracked',
    '[EXTRACT] Database: connected',
    '[UPLOAD] Elite Mode: activated ✓',
    '[SYSTEM] You are now in control 🎯',
  ]

  const terminal = document.createElement('div')
  terminal.id = 'hack-effect'
  terminal.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    background: rgba(10, 15, 28, 0.95);
    border: 2px solid #00f0ff;
    border-radius: 8px;
    padding: 16px;
    min-width: 300px;
    font-family: 'Courier New', monospace;
    color: #00f0ff;
    text-shadow: 0 0 10px rgba(0, 240, 255, 0.6);
    box-shadow: 0 0 30px rgba(0, 240, 255, 0.2);
    max-height: 300px;
    overflow: auto;
  `

  logs.forEach((log, idx) => {
    setTimeout(() => {
      const line = document.createElement('div')
      line.textContent = log
      line.style.marginBottom = '8px'
      terminal.appendChild(line)
      terminal.scrollTop = terminal.scrollHeight
    }, idx * 200)
  })

  document.body.appendChild(terminal)

  setTimeout(() => {
    terminal.remove()
  }, logs.length * 200 + 2000)
}

const createCelebrationEffect = () => {
  const celebrations = ['🎉', '💰', '✨', '🎊', '⭐', '🌟', '💎', '🏆']

  for (let i = 0; i < 50; i++) {
    const emoji = celebrations[Math.floor(Math.random() * celebrations.length)]
    const elem = document.createElement('div')
    elem.textContent = emoji
    elem.style.cssText = `
      position: fixed;
      left: ${Math.random() * window.innerWidth}px;
      top: -50px;
      z-index: 9999;
      font-size: ${20 + Math.random() * 30}px;
      pointer-events: none;
      animation: fall ${3 + Math.random() * 2}s linear forwards;
      opacity: 1;
    `
    document.body.appendChild(elem)

    setTimeout(() => elem.remove(), 5000)
  }

  if (!document.querySelector('style#fall-animation')) {
    const style = document.createElement('style')
    style.id = 'fall-animation'
    style.textContent = `
      @keyframes fall {
        to {
          transform: translateY(${window.innerHeight + 100}px) rotate(360deg);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
  }
}

const createGlowEffect = () => {
  const style = document.createElement('style')
  style.id = 'extra-glow'
  style.textContent = `
    .theme-elite * {
      text-shadow: 0 0 20px rgba(255, 200, 0, 0.8), 0 0 40px rgba(0, 240, 255, 0.6) !important;
    }
  `
  document.head.appendChild(style)

  toast.success('🌟 MAXIMUM GLOW ACTIVATED!', {
    position: 'bottom-right',
    autoClose: 2000,
  })
}

const removeExtraGlow = () => {
  const glow = document.querySelector('#extra-glow')
  if (glow) glow.remove()
  toast.info('Glow reset to normal', { position: 'bottom-right', autoClose: 1500 })
}

const createPenguinAnimation = () => {
  // Create penguin animation container
  const container = document.createElement('div')
  container.id = 'penguin-animation'
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    z-index: 9998;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.95);
  `

  // Create video element - perfect square
  const video = document.createElement('video')
  video.src = '/penguin.mp4'
  video.style.cssText = `
    width: 600px;
    height: 600px;
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 20px;
  `
  video.controls = false
  video.autoplay = true
  video.muted = false
  video.loop = true

  container.appendChild(video)
  document.body.appendChild(container)

  // Create and play audio with 2:30-2:45 second clip
  const audio = new Audio('/papaoutai.mp3')
  audio.currentTime = 150 // Start at 2:30 (150 seconds)
  audio.play().catch(e => console.log('Audio play error:', e))

  // Stop audio at 8 seconds
  setTimeout(() => {
    audio.pause()
  }, 8000)

  // Remove after 8 seconds
  setTimeout(() => {
    container.remove()
    audio.pause()
  }, 8000)
}

export const executeCommand = (command, onClose) => {
  const input = command.trim().toLowerCase()

  // Fun Commands
  if (input === 'matrix') {
    createMatrixEffect()
    toast.success('🤖 Matrix effect activated!', { position: 'top-center' })
    onClose()
  } else if (input === 'hack') {
    createHackEffect()
    toast.info('🔓 Hacking sequence initiated...', { position: 'top-center' })
    onClose()
  } else if (input === 'celebrate') {
    createCelebrationEffect()
    toast.success('🎉 CELEBRATION TIME!', { position: 'top-center' })
    onClose()
  } else if (input === 'penguin') {
    createPenguinAnimation()
    toast.success('🐧 Penguin is walking on ice!', { position: 'top-center', autoClose: 3000 })
    onClose()
  } else if (input === 'joke') {
    const joke = jokes[Math.floor(Math.random() * jokes.length)]
    toast.info(joke, { position: 'top-center', autoClose: 5000 })
    onClose()
  } else if (input === 'glow') {
    createGlowEffect()
    onClose()
  } else if (input === 'reset') {
    removeExtraGlow()
    const matrices = document.querySelectorAll('#matrix-effect, #hack-effect')
    matrices.forEach((el) => el.remove())
    toast.info('💫 Effects reset', { position: 'bottom-right', autoClose: 1500 })
    onClose()
  }
  // Utility Commands
  else if (input.startsWith('google ')) {
    const query = input.replace('google ', '')
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank')
    toast.success('🔍 Opening Google...', { position: 'bottom-right', autoClose: 1500 })
    onClose()
  } else if (input.startsWith('calc ')) {
    try {
      const expression = input.replace('calc ', '')
      const result = Function('"use strict"; return (' + expression + ')')()
      toast.success(`📊 Result: ${result}`, { position: 'bottom-right', autoClose: 3000 })
      onClose()
    } catch (e) {
      toast.error('❌ Invalid expression', { position: 'bottom-right' })
    }
  } else if (input.startsWith('timer ')) {
    const minutes = parseInt(input.replace('timer ', ''))
    if (isNaN(minutes)) {
      toast.error('⏱️ Please enter valid minutes', { position: 'bottom-right' })
      return
    }
    const ms = minutes * 60 * 1000
    toast.info(`⏱️ Timer started for ${minutes} minute(s)`, { position: 'bottom-right' })
    setTimeout(() => {
      toast.warning('⏰ Timer finished!', { position: 'top-center', autoClose: 3000 })
      createCelebrationEffect()
    }, ms)
    onClose()
  } else if (input === 'note') {
    const note = prompt('📝 Quick Note:')
    if (note) {
      // Save to Firebase instead of localStorage
      const { user } = useAuthStore.getState()
      if (user) {
        const db = getDatabase()
        const noteRef = ref(db, `users/${user.uid || user.id}/notes/${Date.now()}`)
        set(noteRef, { content: note, timestamp: Date.now() })
      }
      toast.success('💾 Note saved!', { position: 'bottom-right', autoClose: 1500 })
    }
    onClose()
  } else if (input === 'clear cache') {
    toast.success('🗑️ Cache cleared!', { position: 'bottom-right', autoClose: 1500 })
    onClose()
  } else if (input === 'whoami') {
    const { user } = useAuthStore.getState()
    toast.info(`👤 You are: ${user?.name || 'Anonymous'} (${user?.email || 'no email'})`, {
      position: 'bottom-right',
      autoClose: 3000,
    })
    onClose()
  } else if (input === 'coins') {
    const { user } = useAuthStore.getState()
    toast.success(`💰 Balance: ${user?.coins || 0} coins`, {
      position: 'bottom-right',
      autoClose: 2000,
    })
    onClose()
  } else if (input === 'shortcuts') {
    toast.info(
      '⌨️ Ctrl+K: Command Palette | Esc: Close Palette',
      {
        position: 'top-center',
        autoClose: 3000,
      }
    )
    onClose()
  }
  // HELP/DEVELOPER COMMANDS
  else if (input === 'kdeveloper' || input === 'cheats' || input === 'help') {
    const cheatsList = `
🎮 ELITE MODE CHEATS & COMMANDS 🎮

🎬 FUN EFFECTS:
  • matrix - Falling code animation
  • hack - Fake hacking logs
  • celebrate - Coins and emoji rain
  • joke - Random programming joke
  • glow - Extra neon glow effects
  • reset - Remove all effects

🕹️ GAMES (16 TOTAL):
  • games - List all games
  • game [name] - Open game
  • play chess - Chess.com
  • play pokemon - Pokemon Showdown
  • play smash karts - Smash Karts racing
  • match card - Memory game
  Games: Chess, Lichess, Pokemon, Matching, Duolingo, 
  Sudoku, Wordle, Cookie Clicker, Agar.io, Slither.io,
  Tetris, Smash Karts, Among Us, Dino Game, Poptropica, Roblox

🎂 BIRTHDAY WISHES:
  • birthday [name] - Birthday celebration
  • bday [name] - Birthday wishes

🔧 UTILITIES:
  • google [query] - Search Google
  • calc [expression] - Calculator (e.g., calc 2+2)
  • timer [minutes] - Countdown timer
  • note - Quick sticky note
  • whoami - Show user info
  • coins - Show coin balance
  • clear cache - Clear storage
  • shortcuts - Keyboard shortcuts

✨ EASTER EGG:
  • hello elite - Secret greeting
    `
    toast.info(cheatsList, {
      position: 'top-center',
      autoClose: 10000,
    })
    onClose()
  }
  // GAME COMMANDS - Check specific games FIRST
  else if (input === 'play chess') {
    window.open('https://www.chess.com', '_blank')
    toast.success('♟️ Opening Chess.com...', { position: 'bottom-right', autoClose: 2000 })
    onClose()
  } else if (input === 'play pokemon' || input === 'play pokémon') {
    window.open('https://pokemonshowdown.com', '_blank')
    toast.success('🔴 Opening Pokemon Showdown...', { position: 'bottom-right', autoClose: 2000 })
    onClose()
  } else if (input === 'play smash karts') {
    window.open('https://smashkarts.io', '_blank')
    toast.success('🏎️ Opening Smash Karts...', { position: 'bottom-right', autoClose: 2000 })
    onClose()
  } else if (input === 'match card' || input === 'play matching' || input === 'memory game') {
    window.open('https://www.matchmadness.com', '_blank')
    toast.success('🃏 Opening Matching Game...', { position: 'bottom-right', autoClose: 2000 })
    onClose()
  } else if (input === 'games' || input === 'gamelist') {
    let gamesList = '🎮 ONLINE GAMES (16 Total):\n\n'
    onlineGames.forEach((game, idx) => {
      gamesList += `${idx + 1}. ${game.emoji} ${game.name}\n`
    })
    gamesList += '\nUse: "game [name]" or "play [name]"'
    toast.info(gamesList, {
      position: 'top-center',
      autoClose: 5000,
    })
    onClose()
  } else if (input.startsWith('game ') || input.startsWith('play ')) {
    const gameName = input.replace(/^(game|play) /, '').toLowerCase()
    const game = onlineGames.find((g) => g.name.toLowerCase().includes(gameName))
    
    if (game) {
      window.open(game.url, '_blank')
      toast.success(`🎮 Opening ${game.name}...`, { position: 'bottom-right', autoClose: 2000 })
    } else {
      toast.error(`❌ Game not found! Try: "games" to see all games`, { position: 'bottom-right' })
    }
    onClose()
  }
  // BIRTHDAY WISHES
  else if (input.startsWith('bday ') || input.startsWith('birthday ')) {
    const name = input.replace(/^(bday|birthday) /, '').trim()
    const wish = birthdayWishes[Math.floor(Math.random() * birthdayWishes.length)]
    toast.success(`${wish}\n\n👋 Happy Birthday, ${name || 'friend'}!`, { 
      position: 'top-center', 
      autoClose: 4000 
    })
    createCelebrationEffect()
    onClose()
  } else if (input === 'hello elite') {
    toast.success('👋 Welcome to Elite Mode, Master! 🎯', { position: 'top-center', autoClose: 2000 })
    createCelebrationEffect()
    onClose()
  } else {
    toast.error(`❓ Unknown command: ${input}`, { position: 'bottom-right', autoClose: 2000 })
  }
}
