import words from 'an-array-of-english-words';
import * as gameView from './gameView.js';


////////////////////////
// GAME STATE
////////////////////////
const state = {
    modalIsActive: false
};

const wordsLists = new Map();

const levels = {
    'default': [3, 6],
    '5': [4, 8],
    '10': [5, 10],
    '15': [6, 12],
    '20': [7, 12],
    '25': [8, 12],
    '30': [9, 12]
}

const setDefaultState = () => {
    state.isPlaying = false;
    state.curScore = 0;
    state.curAnswers = 0;
    state.countDownTime = 0;
    state.difficulty = {
        time: 300, //Default time given for writing answer
        timeLimit: 60, // Minimum possible time
        timeDecreaseStep: 5, // Value that is substracted from time with each correct answer
        range: levels['default']
    };

    setDefaultBestScore();
}

const setDefaultBestScore = () => {
    // Check if there is data for bestScore
    const bS = state.storage.getItem('bestScore');
    
    state.bestScore = bS ? JSON.parse(bS) : {score: 0, answers: 0};
}

////////////////////////
// LISTENERSS LOGIC
////////////////////////

const setListeners = () => {
    window.addEventListener('keypress', keyPressHandler);
    gameView.elements.btnSendName.addEventListener('click', sendNameHandler);
};

// Listen for modal mindow hide event
$(`#${gameView.names.modal}`).on('hidden.bs.modal', function () {
    state.modalIsActive = false;
});

const keyPressHandler = (e) => {
    if (e.key === 'Enter' && e.shiftKey){
        // check if game already playing
        // init game start
        
        if (!state.isPlaying && !state.modalIsActive) start();

    } else if (e.key === 'Enter' && state.isPlaying && !e.shiftKey) {
        enterHandler();
    } else if (e.key === 'Enter' && state.modalIsActive && state.storage.userName) {
        // close Modal
        hideModal();
    }
}
//  hsl(354.3, 70.5%, 53.5%)
const enterHandler = () => {
    // Get word from input
    const input = gameView.getInput();
    gameView.clearInput();
    const isMatch = compare(input);

    // compare cur word and input
    if (isMatch) {
        // add score count
        updateScore();
        // reset time 
        updateAnswers();
        // determine new dificulty
        difficultyUpdate();
        // generate new lvl
        generateLvl();
    } else {
        //Game over sequence
        clearCountDown();
        gameOver();
    }
}

const sendNameHandler = (e) => {
    const name = gameView.getName();
    
    if (name) {
        state.storage.setItem('userName', name);
        // Re-render msg in case if user enter his nicknage
        gameView.renderDisplayMsg(state.storage.getItem('userName'));

        // close Modal
        hideModal();
    } else {
        // show error
    }
}

////////////////////////
// GAME LOGIC
////////////////////////

const start = () => {
    state.isPlaying = true;
    getWord(state.difficulty);
    // show 3-2-1-GO count

    // render word/time/score 
    gameView.clearInput();
    gameView.renderWord(state.word);
    gameView.renderTime(formatTime(state.difficulty.time));
    gameView.setFocus();

    //activate countdown
    activeteCoundDown();
}

// SCORE
const updateScore = () => {
    //Get score from UI and format it
    const score = formatScore(getRemainingTime());
    
    //Calculate new score
    state.curScore = calcScore(state.curScore, score);

    // Render new score
    gameView.renderScore(state.curScore);
}

const updateBestScore = () => {
    
    if (state.curScore > state.bestScore.score) {
        state.bestScore.score = state.curScore;
        state.bestScore.answers = state.curAnswers;
        //update local storage best score
        updateStorageBestScore();
    }
}

const calcScore = (cur, score) => {
    // We have to use toFixed to remove problem with
    // floating poing number precision
    // For instance: 0.1 * 0.2 = 0.020000000000000004
    const newScore = +(cur + score).toFixed(10);
    
    return newScore;
}

const formatScore = (score) => {
    //Split score on seconds and ms;
    //Recieved Format 4:20
    let [seconds, mc] = score.split(":");

    //Convert seconds to Int and mc to Float
    seconds = parseInt(seconds, 10);
    mc = parseFloat(`0.${mc}`);

    return seconds + mc;
}

const updateAnswers = () => state.curAnswers++;

// DIFFICULTY
const difficultyUpdate = () => {
    // reduce max time for round. No less then Limit
    timeUpdate();

    // Determine new range of avaliable words lists
    // by current amount of correct answers
    rangeUpdate();
}

const timeUpdate = () => {
    if (state.difficulty.time > state.difficulty.timeLimit) {
        state.difficulty.time -= state.difficulty.timeDecreaseStep;
    }
}

const rangeUpdate = () => {
    const range = levels[`${state.curAnswers}`];
    
    if (state.curAnswers > 3 && range) {
        state.difficulty.range = range;
    }
}

// LEVEL
const generateLvl = () => {
    clearCountDown();
    getWord(state.difficulty);
    
    // render new word and time
    gameView.renderWord(state.word);
    gameView.renderTime(formatTime(state.difficulty.time));

    activeteCoundDown();
}

//GAME OVER
const gameOver = () => {
    // display Modal
    gameView.renderModal(state.curAnswers, 
                         state.curScore, 
                         state.bestScore, 
                         state.storage.getItem('userName'),
                         state.storage.getItem('visited'));
    
    // Set modal state as active
    state.modalIsActive = true;
    
    // Upgrade best score
    updateBestScore();
    gameView.renderBestScore(state.bestScore.score);

    // Reset
    setDefaultState();
    gameView.clearInput();

    // render default
    gameView.renderDisplayMsg(state.storage.getItem('userName'));
    gameView.renderTime(formatTime(state.difficulty.time));
    gameView.renderScore(state.curScore);
    gameView.renderDefaultWord();
}

////////////////////////
// WORDS GENERATION
////////////////////////

//LIST CREATION
const createList = (name, len) => {
    const arr = words.filter(el => el.length === len);

    wordsLists.set(name, arr);
}

// Generating lists of words based on their length
// in range 3..12 - should be 12 lists as a result
const generateLists = () => {
    for (let i = 3; i <= 12; i++) {
        createList(i, i);
    }
}

//WORD CREATION
const getWord = (difficulty) => {
    // Get random list within limits of given range
    // determined by difficulty lvl; range - [start, end]
    const list = getWordsList(difficulty.range[0], difficulty.range[1]);
    const newWord = getRandomWord(list);
    
    state.word = newWord;
}

const compare = (res) => state.word === res;

// Get random words list based on difficulty range
const getWordsList = (start, end) => {
    const n = getRandom(start, end);

    return wordsLists.get(n);
}

const getRandomWord = (list) => {
    const n = getRandom(0, list.length);

    return list[n];
}

// Generate rundom number within given range
const getRandom = (min, max) => Math.floor(min + Math.random() * (max + 1 - min));


////////////////////////
// COUNT DOWN LOGIC
////////////////////////

const activeteCoundDown = () => {
    let time = state.difficulty.time;
    state.countDown = setInterval(() => {
        time--;
        state.countDownTime = beutifyTime(time);

        //if possible to continue counting down, - render new time
        gameView.renderTime(formatTime(time));

        // check
        countDownChecker(time);
        
    }, 1000/60); // sixty times in a seconds 
}

const countDownChecker = (time) => {
    if (time <= 0) {
        clearCountDown(state.countDown);
        gameOver();
    }
}

const clearCountDown = () => clearInterval(state.countDown) ;

const formatTime = (time) => {
    // Get time in seconds. Split it on full seconds and ramaining mc
    // Conver both numbers to String and pad from start with 0 

    const sec = formatSeconds(time);
    const mc = formatMC(time);

    const newTime = {
        sec1: sec[0],
        sec2: sec[1],
        mc1: mc[0],
        mc2: mc[1]
    }
    return newTime;
}

const formatSeconds = (time) => {
    // If time less then 1 sec, set seconds to 0
    return ((time >= 60 ? parseInt(time / 60) : 0).toString()).padStart(2, '0');
}

const formatMC = (time) => {
    return ((time % 60).toString()).padStart(2, '0');
}

const beutifyTime= (time) => {
    const sec = formatSeconds(time);
    const mc = formatMC(time);

    return `${sec}:${mc}`
}

const getRemainingTime = () => state.countDownTime;

////////////////////////
// MODAL LOGIC
////////////////////////

const hideModal = () => {
    gameView.closeModal();
    state.modalIsActive = false;
}

////////////////////////
// LOCAL STORAGE LOGIC
////////////////////////

const initStorage = () => {
    state.storage = window.localStorage;
}

// Remember user
const setVisited = () => state.storage.setItem('visited', true);

const updateStorageBestScore = () => {
    state.storage.setItem('bestScore', JSON.stringify(state.bestScore));
}

////////////////////////
// INITIALIZATION
////////////////////////

const init = () => {
    gameView.cacheDOM();
    // init local storage
    initStorage();
    // set default state values
    setDefaultState();
    // Generate lists of words
    generateLists();
    // set listeners
    setListeners();
    // render View
    gameView.renderTime(formatTime(state.difficulty.time));
    gameView.renderBestScore(state.bestScore.score);
    gameView.renderDefaultWord();
    gameView.renderGreeting(state.storage.getItem('userName'), state.storage.getItem('visited'));
    
    // Remember user
    setVisited();
    // Set class 'loaded' for removing page loader
    // Time is hard coded
    setTimeout(()=>{
        document.body.classList.add('loaded');
    }, 500)
}




// Game initialization on app load
document.addEventListener("DOMContentLoaded", init);