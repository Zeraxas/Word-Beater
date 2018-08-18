const digits = ['zero', 'one', "two", 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

////////////////////////
// DOM
////////////////////////

export const elements = {};
export const names = {
    modal:'end-modal'
};

export const cacheDOM = () => {
    elements.msgDisplay = document.getElementById('msg-display');
    elements.wordInput = document.getElementById('word-input');
    elements.currentWord = document.getElementById('current-word');
    elements.scoreDisplay = document.getElementById('score');
    elements.timeDisplay = document.querySelector('.digits');
    elements.secFirst = document.getElementById('sec-1');
    elements.secSecond = document.getElementById('sec-2');
    elements.mcFirst = document.getElementById('mc-1');
    elements.mcSecond = document.getElementById('mc-2');
    elements.bestDisplay = document.getElementById('best-score');
    elements.modalAnswers = document.getElementById('answers-best-display');
    elements.modalScore = document.getElementById('best-score-display');
    elements.infoMessage = document.getElementById('info-msg');
    elements.btnSendName = document.getElementById('send-name');
    elements.nameInput = document.getElementById('name-input');
    elements.modalBody = document.querySelector('.modal-body');
};


////////////////////////
// RENDER LOGIC
////////////////////////

const renderDigit = (el,digit) => {
    const cls = digits[digit];

    // If current digit already has class for new digit - do NOT re-render
    if (!elements[el].classList.contains(cls)) {
        elements[el].classList = '';
        elements[el].classList.add(cls);
    }
}

const updateModalHTML = (ans, score, best) => {
    // Show answers and score for this game
    elements.modalAnswers.textContent = ans;
    elements.modalScore.textContent = score;

    // Genera a message to tell user about this game
    elements.infoMessage.textContent = generateMessage(score, best);
}

const hideNameInput = (name, visited) => {
    // If user already used this app and save his nickname
    // then hide name input
    if (name && visited){
        elements.modalBody.style.display = 'none';
    }
} 


const generateMessage = (score, best) => {
    let msg;

    if (score > best.score) {
        msg = `Amaizing! This is your new record.`;
    } else {
        msg = `Great game. Try again to beat your record: ${best.answers} answers, with ${best.score} points.`
    }

    return msg;
}

const renderOldUserMsg = (name) => {
    const newName = name ? " " + name : 'again';
    const html = `<p class="lead">Hello <strong class="text-success">${newName}!</strong> Going to beat your old record today?</p>`;
    
    elements.msgDisplay.insertAdjacentHTML('afterbegin', html);
}

const renderNewUserMsg = () => {
    const html = `
    <p class="lead">Type The Given Word Within
        <span class="text-success" id="seconds">5</span> Seconds:
        <span class="addition">At the beginning...</span>
    </p>
    `;

    elements.msgDisplay.insertAdjacentHTML('afterbegin', html);
}

export const setFocus = () => elements.wordInput.focus();
export const renderWord = (word) => elements.currentWord.textContent = word;
export const renderDefaultWord = () => elements.currentWord.textContent = 'Be ready...';
export const getInput = () => elements.wordInput.value;
export const clearInput = () => elements.wordInput.value = '';

export const renderTime = (time) => {
    // Render every digit separately
    renderDigit('secFirst', time.sec1);
    renderDigit('secSecond', time.sec2);
    renderDigit('mcFirst', time.mc1);
    renderDigit('mcSecond', time.mc2);
}

export const renderScore = (score) => elements.scoreDisplay.textContent = score;
export const renderBestScore = (score) => elements.bestDisplay.textContent = score;
export const renderModal = (answers, score, best, name, visited) => {
    updateModalHTML(answers, score, best);
    hideNameInput(name, visited);
    $(`#${names.modal}`).modal();
}

export const closeModal = () => $(`#${names.modal}`).modal('hide');

export const getName = () => elements.nameInput.value;

export const renderGreeting = (name, visited) => {
    if (visited) {
        renderOldUserMsg(name);
        return;
    }
    
    renderNewUserMsg();
}

export const renderDisplayMsg = (name) => {
    const newName = name ? " " + name : '';
    const html = `<p class="lead">Nice try<span class="text-success">${ newName}!</span> I'm sure you can do even better!</p>`;

    elements.msgDisplay.innerHTML = '';
    elements.msgDisplay.insertAdjacentHTML('afterbegin', html);
}
