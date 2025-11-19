let currentNum1 = 0
let currentNum2 = 0
let correctAnswer = 0
let currentOperation = 'multiplication' // Track current operation type
let recognition = null
let isListening = false
let isSpeaking = false // Track if we're currently asking a question
let selectedVoice = null
let waitingForAnswer = false // Track if we're expecting an answer
let selectedTables = [2, 3, 4, 5, 10] // Default selected tables
let enabledModes = ['multiplication', 'division'] // Array of enabled modes: can contain 'multiplication' and/or 'division'
let timerInterval = null
let timerStartTime = null
const GAME_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

// Convert spoken words to numbers
function wordsToNumber(text) {
  const numberWords = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
  }

  text = text.toLowerCase().trim()

  // Direct match
  if (numberWords[text] !== undefined) {
    return numberWords[text]
  }

  // Handle compound numbers like "twenty four" or "twenty-four"
  const words = text.replace(/-/g, ' ').split(/\s+/)
  let total = 0
  let current = 0

  for (const word of words) {
    const num = numberWords[word]
    if (num !== undefined) {
      if (num === 100) {
        current = current === 0 ? 100 : current * 100
      } else if (num >= 20) {
        current += num
      } else {
        current += num
      }
    }
  }

  total += current
  return total > 0 ? total : null
}

// Load and select the best available voice
function loadVoices() {
  const voices = window.speechSynthesis.getVoices()

  if (voices.length === 0) {
    console.log('No voices loaded yet')
    return
  }

  console.log(
    'Available voices:',
    voices.map((v) => `${v.name} (${v.lang})`),
  )

  // Try to find a good UK English voice first
  const preferredVoices = [
    'Google UK English Female',
    'Google UK English Male',
    'Daniel',
    'Serena',
    'Kate',
    'Google US English',
    'Samantha',
    'Karen',
    'Microsoft Zira',
    'Microsoft David',
    'Alex',
  ]

  for (const preferred of preferredVoices) {
    const voice = voices.find((v) => v.name.includes(preferred))
    if (voice) {
      console.log('Selected voice:', voice.name)
      selectedVoice = voice
      return
    }
  }

  // Fallback: find any English voice that's not "Google" default
  const englishVoice = voices.find((v) => v.lang.startsWith('en') && !v.name.includes('eSpeak') && v.localService)

  if (englishVoice) {
    console.log('Selected fallback voice:', englishVoice.name)
    selectedVoice = englishVoice
    return
  }

  // Last resort: just pick the first English voice
  const anyEnglish = voices.find((v) => v.lang.startsWith('en'))
  if (anyEnglish) {
    console.log('Selected any English voice:', anyEnglish.name)
    selectedVoice = anyEnglish
  } else {
    console.log('Using default voice')
    selectedVoice = null
  }
}

// Initialize voices
if ('speechSynthesis' in window) {
  // Load voices immediately
  loadVoices()

  // Also set up listener for when voices load (Chrome needs this)
  window.speechSynthesis.onvoiceschanged = () => {
    console.log('Voices changed event fired')
    loadVoices()
  }
}

// Speak text using Web Speech API
function speak(text, onComplete) {
  console.log('Speaking:', text)

  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    isSpeaking = true

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = selectedVoice
    utterance.rate = 1.0 // Normal speed
    utterance.pitch = 1.1 // Slightly higher pitch for friendliness
    utterance.volume = 1.0

    // Call callback when speech ends
    utterance.onend = () => {
      console.log('Speech finished')
      isSpeaking = false
      if (onComplete) onComplete()
    }

    utterance.onerror = (event) => {
      console.log('Speech error:', event)
      isSpeaking = false
      if (onComplete) onComplete()
    }

    console.log('Starting speech synthesis')
    window.speechSynthesis.speak(utterance)
  } else {
    console.log('Speech synthesis not supported')
    if (onComplete) {
      onComplete()
    }
  }
}

// Generate a new question
function generateQuestion() {
  // Pick a random operation from enabled modes
  currentOperation = enabledModes[Math.floor(Math.random() * enabledModes.length)]

  // Pick a random number from selected tables
  const table = selectedTables[Math.floor(Math.random() * selectedTables.length)]
  // Pick any number from 1-10
  const multiplier = Math.floor(Math.random() * 10) + 1

  if (currentOperation === 'multiplication') {
    currentNum1 = table
    currentNum2 = multiplier
    correctAnswer = currentNum1 * currentNum2
  } else {
    // Division: randomize whether table is the divisor or the quotient
    const tableIsDivisor = Math.random() < 0.5

    currentNum1 = table * multiplier // The dividend is always table × multiplier

    if (tableIsDivisor) {
      // (table × multiplier) ÷ table = multiplier
      currentNum2 = table // The divisor
      correctAnswer = multiplier // The quotient
    } else {
      // (table × multiplier) ÷ multiplier = table
      currentNum2 = multiplier // The divisor
      correctAnswer = table // The quotient
    }
  }

  // Update the display
  document.getElementById('topNumber').textContent = currentNum1
  document.getElementById('rightNumber').textContent = currentNum2

  // Update the operation symbol
  const symbolElement = document.querySelector('.left-symbol')
  const topNumberElement = document.getElementById('topNumber')
  const answerSectionElement = document.querySelector('.answer-section')

  if (currentOperation === 'division') {
    symbolElement.textContent = '÷'
    topNumberElement.classList.add('division')
    answerSectionElement.classList.add('division')
  } else {
    symbolElement.textContent = '×'
    topNumberElement.classList.remove('division')
    answerSectionElement.classList.remove('division')
  }

  // Generate the blocks grid
  // For division: show the dividend arranged as (quotient columns × divisor rows)
  if (currentOperation === 'division') {
    generateBlocks(correctAnswer, currentNum2, 'division') // answer columns × divisor rows
  } else {
    generateBlocks(currentNum1, currentNum2, 'multiplication')
  }

  // Clear display and feedback
  document.getElementById('answerDisplay').textContent = ''
  document.getElementById('feedback').textContent = ''

  // Ask the question out loud
  const questionText =
    currentOperation === 'division'
      ? `${currentNum1} divided by ${currentNum2} is`
      : `${currentNum1} times ${currentNum2} is`

  setTimeout(() => {
    speak(questionText, () => {
      // Ready to accept answers now that recognition has restarted
      waitingForAnswer = true
      console.log('Ready for answer')
    })
  }, 100)
}

// Generate the visual blocks grid
function generateBlocks(cols, rows, operation = 'multiplication') {
  const grid = document.getElementById('blocksGrid')
  grid.innerHTML = ''

  // Set CSS grid properties
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`
  grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`

  // Create individual blocks
  for (let i = 0; i < cols * rows; i++) {
    const block = document.createElement('div')
    block.className = 'block'

    const row = Math.floor(i / cols)
    const col = i % cols

    if (operation === 'division') {
      // For division: bottom row is pink
      if (row === rows - 1) {
        block.classList.add('pink')
      }

      // Right column is blue
      if (col === cols - 1) {
        block.classList.add('blue')
      }

      // Bottom-right corner gets both colors (diagonal split flipped)
      if (row === rows - 1 && col === cols - 1) {
        block.classList.add('diagonal-split-flipped')
      }
    } else {
      // For multiplication: top row is pink
      if (row === 0) {
        block.classList.add('pink')
      }

      // Right column is blue
      if (col === cols - 1) {
        block.classList.add('blue')
      }

      // Top-right corner gets both colors (diagonal split)
      if (row === 0 && col === cols - 1) {
        block.classList.add('diagonal-split')
      }
    }

    grid.appendChild(block)
  }
}

// Check the answer
function checkAnswer() {
  const userAnswer = parseInt(document.getElementById('answerDisplay').textContent)
  const feedback = document.getElementById('feedback')

  if (isNaN(userAnswer)) {
    return // Don't check if no answer entered
  }

  // Not waiting for answer anymore
  waitingForAnswer = false

  if (userAnswer === correctAnswer) {
    // Correct answer
    feedback.textContent = '✓'
    feedback.className = 'feedback correct'

    // Wait 1 second then generate new question
    setTimeout(() => {
      generateQuestion()
    }, 1000)
  } else {
    // Wrong answer
    feedback.textContent = '✗'
    feedback.className = 'feedback incorrect'

    // Clear the display and feedback after a delay so user can see what they guessed
    setTimeout(() => {
      document.getElementById('answerDisplay').textContent = ''
      feedback.textContent = ''
      feedback.className = 'feedback'

      // Ready for next attempt
      waitingForAnswer = true
    }, 1500)
  }
}

// No keyboard input needed anymore - voice only!

// Initialize Speech Recognition
function initSpeechRecognition() {
  // Check for browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    console.log('Speech recognition not supported in this browser')
    return
  }

  recognition = new SpeechRecognition()
  recognition.lang = 'en-US'
  recognition.continuous = true // Keep running continuously
  recognition.interimResults = true // Get results as they come in
  recognition.maxAlternatives = 1

  recognition.onstart = () => {
    isListening = true
    document.body.classList.add('listening')
    console.log('Recognition started')
  }

  recognition.onend = () => {
    isListening = false
    document.body.classList.remove('listening')
    console.log('Recognition ended, restarting...')

    // Always restart if recognition stops unexpectedly
    setTimeout(() => {
      if (recognition && !isListening) {
        try {
          recognition.start()
        } catch (e) {
          console.log('Could not restart recognition:', e.message)
        }
      }
    }, 100)
  }

  recognition.onresult = (event) => {
    // Get the latest result
    const result = event.results[event.results.length - 1]

    // Only process final results
    if (!result.isFinal) {
      return
    }

    let transcript = result[0].transcript.trim().toLowerCase()
    console.log('Heard:', transcript)

    // Ignore if not waiting for an answer
    if (!waitingForAnswer) {
      console.log('Ignoring - not waiting for answer')
      return
    }

    // Discard everything up to and including "is" (as a word)
    const parts = transcript.split(/\bis\b/)
    transcript = parts[parts.length - 1].trim()

    if (!transcript) {
      console.log('Ignoring - nothing after splitting on "is"')
      return
    }

    if (parts.length > 1) {
      console.log('After trimming "is":', transcript)
    }

    // Fix common mishearings (only complete word matches)
    const corrections = {
      sex: 'six',
      too: 'two',
      to: 'two',
      for: 'four',
      fore: 'four',
      ate: 'eight',
      won: 'one',
      tin: 'ten',
    }

    const original = transcript
    for (const [wrong, right] of Object.entries(corrections)) {
      transcript = transcript.replace(new RegExp(`\\b${wrong}\\b`, 'g'), right)
    }

    if (transcript !== original) {
      console.log('Corrected from:', original, 'to:', transcript)
    }

    console.log('Processing:', transcript)

    // Try to extract number from speech (digits first)
    let number = null
    const digitMatch = transcript.match(/\d+/)
    if (digitMatch) {
      number = digitMatch[0]
    } else {
      // Split into words and find all numbers
      const words = transcript.split(/\s+/)
      const numbers = []
      for (const word of words) {
        const num = wordsToNumber(word)
        if (num !== null) {
          numbers.push(num)
        }
      }

      // If we found any numbers, use the last one
      if (numbers.length > 0) {
        number = numbers[numbers.length - 1]
        if (numbers.length > 1) {
          console.log('Found multiple numbers, using last:', number)
        }
      }
    }

    if (number !== null) {
      document.getElementById('answerDisplay').textContent = number
      checkAnswer()
    } else {
      console.log('No number detected, ignoring:', transcript)
    }
  }

  recognition.onerror = (event) => {
    console.log('Speech recognition error:', event.error)

    // Don't worry about most errors - onend will restart
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      console.error('Microphone access denied')
      isListening = false
      document.body.classList.remove('listening')
    }
  }

  // Don't start recognition immediately - wait for game to start
}

// Start recognition when ready
function startRecognition() {
  if (recognition && !isListening) {
    try {
      recognition.start()
      console.log('Starting continuous recognition')
    } catch (e) {
      console.log('Could not start recognition:', e.message)
    }
  }
}

// Stop recognition completely
function stopRecognition() {
  if (recognition && isListening) {
    // Prevent auto-restart by temporarily removing the onend handler
    const originalOnEnd = recognition.onend
    recognition.onend = () => {
      isListening = false
      document.body.classList.remove('listening')
      console.log('Recognition stopped')
    }

    recognition.stop()

    // Restore the handler after a delay
    setTimeout(() => {
      if (recognition) {
        recognition.onend = originalOnEnd
      }
    }, 500)
  }
}

// Initialize speech recognition first
initSpeechRecognition()

// Timer functions
function startTimer() {
  const timerBar = document.getElementById('timerBar')
  timerBar.classList.add('active')
  timerBar.style.width = '100%'

  timerStartTime = Date.now()

  // Update timer every 500ms for smooth animation
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - timerStartTime
    const remaining = Math.max(0, GAME_DURATION - elapsed)
    const percentage = (remaining / GAME_DURATION) * 100

    timerBar.style.width = percentage + '%'

    // Time's up!
    if (remaining === 0) {
      stopTimer()
      endGame()
    }
  }, 500)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function endGame() {
  // Stop speech recognition
  stopRecognition()

  // Stop any ongoing speech
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }

  // Show completion overlay
  document.getElementById('completeOverlay').style.display = 'flex'
}

function resetGame() {
  // Stop timer
  stopTimer()

  // Hide timer bar
  const timerBar = document.getElementById('timerBar')
  timerBar.classList.remove('active')
  timerBar.style.width = '100%'

  // Hide game container
  document.getElementById('gameContainer').style.display = 'none'

  // Hide complete overlay
  document.getElementById('completeOverlay').style.display = 'none'

  // Show start overlay
  document.getElementById('startOverlay').style.display = 'flex'

  // Stop speech recognition
  stopRecognition()

  // Stop any ongoing speech
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }

  // Reset flags
  waitingForAnswer = false
  isSpeaking = false

  // Reset display
  document.getElementById('answerDisplay').textContent = ''
  document.getElementById('feedback').textContent = ''
}

// Handle mode selection
document.querySelectorAll('.mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode

    if (btn.classList.contains('active')) {
      // Deselect - but don't allow deselecting all
      if (enabledModes.length > 1) {
        btn.classList.remove('active')
        enabledModes = enabledModes.filter((m) => m !== mode)
      }
    } else {
      // Select
      btn.classList.add('active')
      enabledModes.push(mode)
    }

    console.log('Enabled modes:', enabledModes)
  })
})

// Handle table selection
document.querySelectorAll('.table-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const table = parseInt(btn.dataset.table)

    if (btn.classList.contains('active')) {
      // Deselect - but don't allow deselecting all
      if (selectedTables.length > 1) {
        btn.classList.remove('active')
        selectedTables = selectedTables.filter((t) => t !== table)
      }
    } else {
      // Select
      btn.classList.add('active')
      selectedTables.push(table)
      selectedTables.sort((a, b) => a - b)
    }

    console.log('Selected tables:', selectedTables)
  })
})

// Handle start button click
document.getElementById('startButton').addEventListener('click', () => {
  // Hide start overlay
  document.getElementById('startOverlay').style.display = 'none'

  // Start speech recognition
  startRecognition()

  // Start the game first, then show container
  generateQuestion()

  // Show game container after question is generated
  setTimeout(() => {
    document.getElementById('gameContainer').style.display = 'grid'
    // Start the timer
    startTimer()
  }, 100)
})

// Handle restart button click
document.getElementById('restartButton').addEventListener('click', () => {
  resetGame()
})
