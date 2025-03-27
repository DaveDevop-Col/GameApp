// Importar funciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getDatabase, ref, push, onValue, query, limitToLast, orderByChild } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";

// Configuración de Firebase (usando Realtime Database)
const firebaseConfig = {
    apiKey: "AIzaSyACbQuylWwdjAllmfN08Z0D6ws5vGiy-n0",
    authDomain: "gameapp-44523.firebaseapp.com",
    databaseURL: "https://gameapp-44523-default-rtdb.firebaseio.com",
    projectId: "gameapp-44523",
    storageBucket: "gameapp-44523.appspot.com",
    messagingSenderId: "232048208786",
    appId: "1:232048208786:web:c433516fd6f712091baf4b"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Variables del juego
const gameState = {
    score: 0,
    timeLeft: 10,
    timer: null,
    currentOperation: null
};

// Elementos DOM
const elements = {
    gameScreen: document.getElementById('game-screen'),
    gameOver: document.getElementById('game-over'),
    num1: document.getElementById('num1'),
    operator: document.getElementById('operator'),
    num2: document.getElementById('num2'),
    answer: document.getElementById('answer'),
    checkBtn: document.getElementById('check'),
    scoreDisplay: document.getElementById('score'),
    timerDisplay: document.getElementById('timer'),
    feedback: document.getElementById('feedback'),
    finalScore: document.getElementById('final-score'),
    nameInput: document.getElementById('name'),
    nicknameInput: document.getElementById('nickname'),
    ageInput: document.getElementById('age'),
    cityInput: document.getElementById('city'),
    schoolInput: document.getElementById('school'),
    saveBtn: document.getElementById('save'),
    scoresList: document.getElementById('scores')
};

// Operaciones disponibles
const operations = [
    { symbol: '+', name: 'suma', apply: (a, b) => a + b },
    { symbol: '-', name: 'resta', apply: (a, b) => a - b },
    { symbol: '×', name: 'multiplicación', apply: (a, b) => a * b }
];

// Iniciar juego
function initGame() {
    gameState.score = 0;
    gameState.timeLeft = 10;
    updateScore();
    generateOperation();
    startTimer();
    loadScores();
    
    elements.gameScreen.classList.remove('hidden');
    elements.gameOver.classList.add('hidden');
    elements.answer.focus();
}

// Generar operación matemática
function generateOperation() {
    clearInterval(gameState.timer);
    gameState.timeLeft = 10;
    updateTimerDisplay();
    
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2;
    
    // Números adecuados para primaria
    switch(operation.symbol) {
        case '+':
            num1 = Math.floor(Math.random() * 10) + 1;
            num2 = Math.floor(Math.random() * 10) + 1;
            break;
        case '-':
            num1 = Math.floor(Math.random() * 10) + 5;
            num2 = Math.floor(Math.random() * num1) + 1;
            break;
        case '×':
            num1 = Math.floor(Math.random() * 5) + 1;
            num2 = Math.floor(Math.random() * 5) + 1;
            break;
    }
    
    gameState.currentOperation = {
        num1,
        num2,
        operator: operation.symbol,
        result: operation.apply(num1, num2)
    };
    
    displayOperation();
}

function displayOperation() {
    elements.num1.textContent = gameState.currentOperation.num1;
    elements.operator.textContent = gameState.currentOperation.operator;
    elements.num2.textContent = gameState.currentOperation.num2;
    elements.answer.value = '';
    hideFeedback();
    startTimer();
}

// Temporizador de 10 segundos
function startTimer() {
    clearInterval(gameState.timer);
    gameState.timeLeft = 10;
    updateTimerDisplay();
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();
        
        if (gameState.timeLeft <= 0) {
            endGame();
        } else if (gameState.timeLeft <= 3) {
            elements.timerDisplay.classList.add('timer-warning');
        }
    }, 1000);
}

function updateTimerDisplay() {
    elements.timerDisplay.textContent = gameState.timeLeft;
    
    if (gameState.timeLeft > 3) {
        elements.timerDisplay.classList.remove('timer-warning');
    }
}

// Mostrar feedback
function showFeedback(message, isCorrect) {
    elements.feedback.textContent = message;
    elements.feedback.className = isCorrect ? 'feedback correct' : 'feedback incorrect';
    elements.feedback.classList.remove('hidden');
}

function hideFeedback() {
    elements.feedback.classList.add('hidden');
}

// Verificar respuesta
function checkAnswer() {
    const userAnswer = parseInt(elements.answer.value);
    
    if (isNaN(userAnswer)) {
        showFeedback("Ingresa un número", false);
        return;
    }
    
    if (userAnswer === gameState.currentOperation.result) {
        // Respuesta correcta
        gameState.score++;
        updateScore();
        showFeedback("¡Correcto! +1 punto", true);
        
        // Nueva operación después de 1 segundo
        setTimeout(() => {
            generateOperation();
        }, 1000);
    } else {
        // Respuesta incorrecta
        showFeedback(`Incorrecto. Respuesta: ${gameState.currentOperation.result}`, false);
        setTimeout(() => {
            endGame();
        }, 1500);
    }
}

function updateScore() {
    elements.scoreDisplay.textContent = gameState.score;
}

function endGame() {
    clearInterval(gameState.timer);
    elements.finalScore.textContent = gameState.score;
    elements.gameScreen.classList.add('hidden');
    elements.gameOver.classList.remove('hidden');
}

// Guardar datos del jugador - FUNCIÓN ACTUALIZADA
async function savePlayerData() {
    const name = elements.nameInput.value.trim();
    const nickname = elements.nicknameInput.value.trim();
    const age = elements.ageInput.value;
    const city = elements.cityInput.value.trim();
    const school = elements.schoolInput.value.trim();
    
    // Validación
    if (!name || !nickname || !age || !city || !school) {
        showFeedback("¡Completa todos los campos!", false);
        return false;
    }

    const playerData = {
        name,
        nickname,
        age: parseInt(age),
        city,
        school,
        score: gameState.score,
        date: new Date().toISOString()
    };
    
    try {
        // Guardar en Firebase Realtime Database
        await push(ref(database, 'scores'), playerData);
        
        // Mostrar mensaje de éxito
        showFeedback("¡Datos guardados correctamente!", true);
        
        // Reiniciar el juego después de 1 segundo
        setTimeout(() => {
            resetGame();
        }, 1000);
        
        return true;
    } catch (error) {
        console.error("Error al guardar:", error);
        showFeedback("Error al guardar los datos", false);
        return false;
    }
}

// Función para reiniciar completamente el juego
function resetGame() {
    // Reiniciar estado del juego
    gameState.score = 0;
    gameState.timeLeft = 10;
    
    // Limpiar formulario
    resetForm();
    
    // Actualizar UI
    updateScore();
    updateTimerDisplay();
    hideFeedback();
    
    // Mostrar pantalla de juego y ocultar formulario
    elements.gameScreen.classList.remove('hidden');
    elements.gameOver.classList.add('hidden');
    
    // Generar nueva operación y enfocar input
    generateOperation();
}

function resetForm() {
    elements.nameInput.value = "";
    elements.nicknameInput.value = "";
    elements.ageInput.value = "";
    elements.cityInput.value = "";
    elements.schoolInput.value = "";
}

// Cargar puntuaciones desde Firebase
function loadScores() {
    const scoresRef = ref(database, 'scores');
    const topScoresQuery = query(scoresRef, orderByChild('score'), limitToLast(10));
    
    onValue(topScoresQuery, (snapshot) => {
        const scores = [];
        snapshot.forEach(childSnapshot => {
            scores.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        // Ordenar de mayor a menor puntuación
        scores.sort((a, b) => b.score - a.score);
        
        // Mostrar en la lista
        elements.scoresList.innerHTML = '';
        scores.forEach((score, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${index + 1}. ${score.nickname}</span>
                <span>${score.score} pts (${score.city})</span>
            `;
            elements.scoresList.appendChild(li);
        });
    }, (error) => {
        console.error("Error al cargar puntuaciones:", error);
    });
}

// Event listeners
elements.checkBtn.addEventListener('click', checkAnswer);
elements.answer.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

// Event listener del botón Guardar - ACTUALIZADO
elements.saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await savePlayerData();
});

// Iniciar el juego
initGame();