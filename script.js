let currentNum1 = 0;
let currentNum2 = 0;
let correctAnswer = 0;

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

    // Clear input and feedback
    document.getElementById('answerInput').value = '';
    document.getElementById('feedback').textContent = '';
    document.getElementById('answerInput').focus();
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
    const userAnswer = parseInt(document.getElementById('answerInput').value);
    const feedback = document.getElementById('feedback');

    if (isNaN(userAnswer)) {
        return; // Don't check if no answer entered
    }

    if (userAnswer === correctAnswer) {
        // Correct answer
        feedback.textContent = '✓';
        feedback.className = 'feedback correct';
        document.getElementById('answerInput').disabled = true;

        // Wait 2 seconds then generate new question
        setTimeout(() => {
            document.getElementById('answerInput').disabled = false;
            generateQuestion();
        }, 2000);
    } else {
        // Wrong answer
        feedback.textContent = '✗';
        feedback.className = 'feedback incorrect';
        document.getElementById('answerInput').value = '';
        document.getElementById('answerInput').focus();
    }
}

// Handle Enter key press
document.getElementById('answerInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

// Start the game
generateQuestion();
