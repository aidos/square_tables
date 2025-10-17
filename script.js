let currentNum1 = 0;
let currentNum2 = 0;
let correctAnswer = 0;
let recognition = null;
let isListening = false;
let shouldBeListening = false; // Track if we want recognition to be active
let selectedVoice = null;
let consecutiveRestarts = 0; // Track restart loop
let selectedTables = [2, 3, 4, 5, 10]; // Default selected tables

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

// Load and select the best available voice
function loadVoices() {
    const voices = window.speechSynthesis.getVoices();

    if (voices.length === 0) {
        console.log('No voices loaded yet');
        return;
    }

    console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));

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
        'Alex'
    ];

    for (const preferred of preferredVoices) {
        const voice = voices.find(v => v.name.includes(preferred));
        if (voice) {
            console.log('Selected voice:', voice.name);
            selectedVoice = voice;
            return;
        }
    }

    // Fallback: find any English voice that's not "Google" default
    const englishVoice = voices.find(v =>
        v.lang.startsWith('en') &&
        !v.name.includes('eSpeak') &&
        v.localService
    );

    if (englishVoice) {
        console.log('Selected fallback voice:', englishVoice.name);
        selectedVoice = englishVoice;
        return;
    }

    // Last resort: just pick the first English voice
    const anyEnglish = voices.find(v => v.lang.startsWith('en'));
    if (anyEnglish) {
        console.log('Selected any English voice:', anyEnglish.name);
        selectedVoice = anyEnglish;
    } else {
        console.log('Using default voice');
        selectedVoice = null;
    }
}

// Initialize voices
if ('speechSynthesis' in window) {
    // Load voices immediately
    loadVoices();

    // Also set up listener for when voices load (Chrome needs this)
    window.speechSynthesis.onvoiceschanged = () => {
        console.log('Voices changed event fired');
        loadVoices();
    };
}

// Speak text using Web Speech API
function speak(text, onComplete) {
    console.log('Speaking:', text);

    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = selectedVoice;
        utterance.rate = 1.0; // Normal speed
        utterance.pitch = 1.1; // Slightly higher pitch for friendliness
        utterance.volume = 1.0;

        // Call callback when speech ends
        if (onComplete) {
            utterance.onend = () => {
                console.log('Speech finished');
                onComplete();
            };
        }

        utterance.onerror = (event) => {
            console.log('Speech error:', event);
            if (onComplete) onComplete();
        };

        console.log('Starting speech synthesis');
        window.speechSynthesis.speak(utterance);
    } else {
        console.log('Speech synthesis not supported');
        if (onComplete) {
            onComplete();
        }
    }
}

// Generate a new question
function generateQuestion() {
    // Pick a random number from selected tables
    currentNum1 = selectedTables[Math.floor(Math.random() * selectedTables.length)];
    // Multiply by any number from 1-10
    currentNum2 = Math.floor(Math.random() * 10) + 1;
    correctAnswer = currentNum1 * currentNum2;

    // Update the display
    document.getElementById('topNumber').textContent = currentNum1;
    document.getElementById('rightNumber').textContent = currentNum2;

    // Generate the blocks grid
    generateBlocks(currentNum1, currentNum2);

    // Clear display and feedback
    document.getElementById('answerDisplay').textContent = '';
    document.getElementById('feedback').textContent = '';

    // Stop recognition while speaking the question
    shouldBeListening = false;
    if (recognition) {
        recognition.stop();
    }

    // Ask the question out loud, then start recognition when done
    setTimeout(() => {
        speak(`${currentNum1} times ${currentNum2} is`, () => {
            // Start recognition immediately after speech finishes
            shouldBeListening = true;
            if (recognition && !isListening) {
                try {
                    recognition.start();
                } catch (e) {
                    console.log('Recognition already started:', e.message);
                }
            }
        });
    }, 100);
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

        // Wait 1 second then generate new question
        setTimeout(() => {
            generateQuestion();
        }, 1000);
    } else {
        // Wrong answer
        feedback.textContent = '✗';
        feedback.className = 'feedback incorrect';

        // Clear the display and feedback after a delay so user can see what they guessed
        setTimeout(() => {
            document.getElementById('answerDisplay').textContent = '';
            feedback.textContent = '';
            feedback.className = 'feedback';

            // Restart recognition for next attempt
            shouldBeListening = true;
            if (recognition && !isListening) {
                try {
                    recognition.start();
                } catch (e) {
                    console.log('Recognition already started:', e.message);
                }
            }
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
        console.log('Recognition started');
        consecutiveRestarts = 0; // Reset counter on successful start
    };

    recognition.onend = () => {
        isListening = false;
        document.body.classList.remove('listening');
        console.log('Recognition ended, shouldBeListening:', shouldBeListening);

        // Restart if we should be listening
        if (shouldBeListening) {
            consecutiveRestarts++;

            // If we're restarting too quickly, add a longer delay
            const delay = consecutiveRestarts > 3 ? 500 : 100;

            if (consecutiveRestarts > 5) {
                console.warn('Too many rapid restarts, pausing recognition');
                consecutiveRestarts = 0;
                // Wait longer before trying again
                setTimeout(() => {
                    if (recognition && shouldBeListening && !isListening) {
                        try {
                            console.log('Resuming recognition after pause');
                            recognition.start();
                        } catch (e) {
                            console.log('Could not restart recognition:', e.message);
                        }
                    }
                }, 2000);
                return;
            }

            setTimeout(() => {
                if (recognition && shouldBeListening && !isListening) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log('Could not restart recognition:', e.message);
                    }
                }
            }, delay);
        } else {
            consecutiveRestarts = 0;
        }
    };

    recognition.onresult = (event) => {
        let transcript = event.results[0][0].transcript.trim().toLowerCase();
        console.log('Heard:', transcript);

        // Fix common mishearings (only complete word matches)
        const corrections = {
            'sex': 'six',
            'too': 'two',
            'to': 'two',
            'for': 'four',
            'fore': 'four',
            'ate': 'eight',
            'won': 'one',
            'tin': 'ten'
        };

        const original = transcript;
        for (const [wrong, right] of Object.entries(corrections)) {
            transcript = transcript.replace(new RegExp(`\\b${wrong}\\b`, 'g'), right);
        }

        if (transcript !== original) {
            console.log('Corrected from:', original, 'to:', transcript);
        }

        console.log('Processing:', transcript);

        // Try to extract number from speech (digits first)
        let number = null;
        const digitMatch = transcript.match(/\d+/);
        if (digitMatch) {
            number = digitMatch[0];
        } else {
            // Split into words and find all numbers
            const words = transcript.split(/\s+/);
            const numbers = [];
            for (const word of words) {
                const num = wordsToNumber(word);
                if (num !== null) {
                    numbers.push(num);
                }
            }

            // If we found any numbers, use the last one
            if (numbers.length > 0) {
                number = numbers[numbers.length - 1];
                if (numbers.length > 1) {
                    console.log('Found multiple numbers, using last:', number);
                }
            }
        }

        if (number !== null) {
            document.getElementById('answerDisplay').textContent = number;

            // Stop recognition before checking answer
            shouldBeListening = false;
            consecutiveRestarts = 0; // Reset on successful number detection
            if (recognition) {
                recognition.stop();
            }

            checkAnswer();
        } else {
            console.log('No number detected, ignoring:', transcript);
            consecutiveRestarts = 0; // Reset on any successful recognition (even non-numbers)
            // Just ignore non-numbers, recognition will continue automatically
        }
    };

    recognition.onerror = (event) => {
        console.log('Speech recognition error:', event.error);

        // Errors like 'no-speech' and 'audio-capture' will trigger onend, which will handle restart
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
            isListening = false;
            document.body.classList.remove('listening');
        }
    };

    // Don't start recognition immediately - wait for first question to be asked
}

// Initialize speech recognition first
initSpeechRecognition();

// Handle table selection
document.querySelectorAll('.table-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const table = parseInt(btn.dataset.table);

        if (btn.classList.contains('active')) {
            // Deselect - but don't allow deselecting all
            if (selectedTables.length > 1) {
                btn.classList.remove('active');
                selectedTables = selectedTables.filter(t => t !== table);
            }
        } else {
            // Select
            btn.classList.add('active');
            selectedTables.push(table);
            selectedTables.sort((a, b) => a - b);
        }

        console.log('Selected tables:', selectedTables);
    });
});

// Handle start button click
document.getElementById('startButton').addEventListener('click', () => {
    // Hide start overlay
    document.getElementById('startOverlay').style.display = 'none';

    // Start the game first, then show container
    generateQuestion();

    // Show game container after question is generated
    setTimeout(() => {
        document.getElementById('gameContainer').style.display = 'grid';
    }, 100);
});
