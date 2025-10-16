let currentNum1 = 0;
let currentNum2 = 0;
let correctAnswer = 0;
let recognition = null;
let isListening = false;

// Convert spoken words to numbers
function wordsToNumber(text) {
    const numberWords = {
        'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
        'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
        'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
        'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
        'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
        'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
        'eighty': 80, 'ninety': 90, 'hundred': 100
    };

    text = text.toLowerCase().trim();

    // Direct match
    if (numberWords[text] !== undefined) {
        return numberWords[text];
    }

    // Handle compound numbers like "twenty four" or "twenty-four"
    const words = text.replace(/-/g, ' ').split(/\s+/);
    let total = 0;
    let current = 0;

    for (const word of words) {
        const num = numberWords[word];
        if (num !== undefined) {
            if (num === 100) {
                current = current === 0 ? 100 : current * 100;
            } else if (num >= 20) {
                current += num;
            } else {
                current += num;
            }
        }
    }

    total += current;
    return total > 0 ? total : null;
}

// Generate a new question
function generateQuestion() {
    currentNum1 = Math.floor(Math.random() * 10) + 1; // 1-10
    currentNum2 = Math.floor(Math.random() * 10) + 1; // 1-10
    correctAnswer = currentNum1 * currentNum2;

    // Update the display
    document.getElementById('topNumber').textContent = currentNum1;
    document.getElementById('rightNumber').textContent = currentNum2;

    // Generate the blocks grid
    generateBlocks(currentNum1, currentNum2);

    // Clear display and feedback
    document.getElementById('answerDisplay').textContent = '';
    document.getElementById('feedback').textContent = '';
}

// Generate the visual blocks grid
function generateBlocks(cols, rows) {
    const grid = document.getElementById('blocksGrid');
    grid.innerHTML = '';

    // Set CSS grid properties
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Create individual blocks
    for (let i = 0; i < cols * rows; i++) {
        const block = document.createElement('div');
        block.className = 'block';

        const row = Math.floor(i / cols);
        const col = i % cols;

        // Top row is pink
        if (row === 0) {
            block.classList.add('pink');
        }

        // Right column is blue
        if (col === cols - 1) {
            block.classList.add('blue');
        }

        // Top-right corner gets both colors (diagonal split)
        if (row === 0 && col === cols - 1) {
            block.classList.add('diagonal-split');
        }

        grid.appendChild(block);
    }
}

// Check the answer
function checkAnswer() {
    const userAnswer = parseInt(document.getElementById('answerDisplay').textContent);
    const feedback = document.getElementById('feedback');

    if (isNaN(userAnswer)) {
        return; // Don't check if no answer entered
    }

    if (userAnswer === correctAnswer) {
        // Correct answer
        feedback.textContent = '✓';
        feedback.className = 'feedback correct';

        // Stop recognition temporarily
        if (recognition) {
            recognition.stop();
        }

        // Wait 2 seconds then generate new question
        setTimeout(() => {
            generateQuestion();

            // Restart recognition
            if (recognition) {
                try {
                    recognition.start();
                } catch (e) {
                    console.log('Recognition already started');
                }
            }
        }, 2000);
    } else {
        // Wrong answer
        feedback.textContent = '✗';
        feedback.className = 'feedback incorrect';

        // Clear the display and feedback after a delay so user can see what they guessed
        setTimeout(() => {
            document.getElementById('answerDisplay').textContent = '';
            feedback.textContent = '';
            feedback.className = 'feedback';
        }, 1500);
    }
}

// No keyboard input needed anymore - voice only!

// Initialize Speech Recognition
function initSpeechRecognition() {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.log('Speech recognition not supported in this browser');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        isListening = true;
        document.body.classList.add('listening');
    };

    recognition.onend = () => {
        isListening = false;
        document.body.classList.remove('listening');

        // Auto-restart recognition
        setTimeout(() => {
            if (recognition) {
                try {
                    recognition.start();
                } catch (e) {
                    // Recognition already started, ignore
                }
            }
        }, 100);
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        console.log('Heard:', transcript);

        // Try to extract number from speech (digits first)
        let number = null;
        const digitMatch = transcript.match(/\d+/);
        if (digitMatch) {
            number = digitMatch[0];
        } else {
            // Try to convert words to numbers
            number = wordsToNumber(transcript);
        }

        if (number !== null) {
            document.getElementById('answerDisplay').textContent = number;
            checkAnswer();
        }
    };

    recognition.onerror = (event) => {
        console.log('Speech recognition error:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
            isListening = false;
            document.body.classList.remove('listening');
        }
    };

    // Start recognition
    try {
        recognition.start();
    } catch (e) {
        console.log('Could not start recognition:', e);
    }
}

// Start the game
generateQuestion();

// Initialize speech recognition after a short delay
setTimeout(() => {
    initSpeechRecognition();
}, 500);
