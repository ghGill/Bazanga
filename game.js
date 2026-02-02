import { BoardManager } from "./board_manager.js";

const LEVELS_ROWS = 4;
const LEVELS_COLS = 8;

let scrOrientation = null;
let bgMusic = null;
let clickEffect=null;
let completeEffect=null;
let failedEffect=null;
let volumeStatus = true;

let lastCompleteLevel = 0;

let screens = ["open", "levels", "board", "help", "failed", "complete"];

let boardManager = new BoardManager({playSound: playSound});

function getOrientation() {
  return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}

window.addEventListener("resize", () => {
    scrOrientation = getOrientation();
    updateByOrientation();
});

function updateByOrientation() {
    if (scrOrientation == "portrait") {
        document.getElementById("rotate-msg").style.display = "block";
        document.getElementById("game").style.display = "none";
    }
    else {
        document.getElementById("rotate-msg").style.display = "none";
        document.getElementById("game").style.display = "block";
    }
}

function hideLoading() {
    document.getElementById("loading").style.visibility = "hidden";
}

export function init() {
    scrOrientation = getOrientation();
    updateByOrientation();

    bgMusic = new Audio("./assets/bg_music.mp3");
    bgMusic.loop = true;
    clickEffect = new Audio("./assets/click.mp3");
    failedEffect = new Audio("./assets/failed.mp3");
    completeEffect = new Audio("./assets/complete.mp3");

    displayScreen("open");
    CreateLevelsItems();

    setTimeout(() => {
        hideLoading();
    }, 1000);
}

function displayScreen(id, over=false) {
    screens.forEach(scrId => {
        const scrVisibility = document.getElementById(scrId).style.visibility;
        document.getElementById(scrId).style.visibility = (scrId == id ? "visible" : over ? scrVisibility : "hidden");
    });
}

function hideScreen(id) {
    document.getElementById(id).style.visibility = "hidden";
}

function playSound(snd) {
    if (!volumeStatus)
        return;

    snd.play();
}

function stopSound(snd) {
    snd.pause();
}

function loadLastCompleteLevel() {
    lastCompleteLevel = localStorage.getItem("lcl");
    if (lastCompleteLevel == null)
        lastCompleteLevel = 1;

    return lastCompleteLevel;
}

function saveLastCompleteLevel(lvl) {
    console.log(lvl, lastCompleteLevel);
    lastCompleteLevel = Math.max(lastCompleteLevel, lvl);
    console.log(lvl, lastCompleteLevel);
    
    localStorage.setItem("lcl", lastCompleteLevel)
}

export function start() {
    playSound(clickEffect);
    playSound(bgMusic);
    displayScreen("levels");
}

function CreateLevelsItems() {
    const lastCompleteLevel = parseInt(loadLastCompleteLevel());

    const itemsElemnt = document.getElementById("items");

    for (let r=0; r<LEVELS_ROWS; r++) {
        let levelsRow = document.createElement("div");
        levelsRow.classList.add("items-row");

        for (let c=1; c<=LEVELS_COLS; c++) {
            const index = (r * LEVELS_COLS) + c;
            const disabled = (index > lastCompleteLevel);
            let item = newLevelItem(index, disabled);
            levelsRow.appendChild(item);
        }

        itemsElemnt.appendChild(levelsRow);
    }
}

function newLevelItem(n, disabled) {
    let e = document.createElement("div");

    let num = document.createElement("div");
    num.id = `num-${n}`;
    num.innerHTML = n;
    num.classList.add("level-num");

    e.classList.add("level-item");
    e.id = `item-${n}`;
    e.dataset.value = n;
    e.appendChild(num);

    if (disabled) {
        num.onclick = null;
        e.classList.add('disabled');
    }
    else {
        num.onclick = (e) => { levelSelected(n); };
    }

    return e;
}

function enableLevelItem(n) {
    const itemElemnt = document.getElementById(`item-${n}`);
    itemElemnt.classList.remove('disabled');

    const numElemnt = document.getElementById(`num-${n}`);
    numElemnt.onclick = (e) => { levelSelected(n); };
}

function levelSelected(lvl) {
    playSound(clickEffect);
    boardManager.playLevelBoard(lvl-1, levelResult);
    displayScreen("board");
}

function levelResult(result) {
    if (result) {
        playSound(completeEffect);
        displayScreen("complete", true);
    }
    else {
        playSound(failedEffect);
        displayScreen("failed", true);
    }
}

export function changeSoundStatus() {
    playSound(clickEffect);

    volumeStatus = !volumeStatus;

    const elm = document.getElementById("sound");

    if (volumeStatus) {
        elm.innerHTML = '<i class="fas fa-volume-high"></i>';
        playSound(bgMusic);
    }
    else {
        elm.innerHTML = '<i class="fas fa-volume-xmark"></i>';
        stopSound(bgMusic);
    }
}

export function backToLevelsMenu() {
    playSound(clickEffect);
    displayScreen("levels");
}

export function showHelp() {
    playSound(clickEffect);
    displayScreen("help", true);
}

export function closeHelp() {
    playSound(clickEffect);
    hideScreen("help");
}

export function restartLevel() {
    playSound(clickEffect);
    boardManager.restart();
    displayScreen("board");
}

export function playNextLevel() {
    playSound(clickEffect);
    const lvl = boardManager.getNextLevel();
    saveLastCompleteLevel(lvl + 1);
    enableLevelItem(lvl + 1);
    levelSelected(lvl + 1);
}

export function showSolution() {
    disablePanelButtons();
    playSound(clickEffect);
    boardManager.restart();
    displayScreen("board");
    boardManager.showSolution(enablePanelButtons);
}

function disablePanelButtons() {
    document.getElementById("disable-panel-buttons").style.visibility = "visible";
}

function enablePanelButtons() {
    document.getElementById("disable-panel-buttons").style.visibility = "hidden";
}

window.init = init;
window.start = start;
window.changeSoundStatus = changeSoundStatus;
window.backToLevelsMenu = backToLevelsMenu;
window.showHelp = showHelp;
window.closeHelp = closeHelp;
window.restartLevel = restartLevel;
window.playNextLevel = playNextLevel;
window.showSolution = showSolution;

/*
display solution
*/
