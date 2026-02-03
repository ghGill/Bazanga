import { gameLevels } from "./levels_data.js";

export class BoardManager {
    constructor(gameManager) {
        this.gameManager = gameManager;

        this.boardJson = null;
        this.boardSchema = null;
        this.board = {};
        this.boardSolution = [];
        this.player = null;
        this.availableSquares = [];
        this.movePlayer = this.movePlayer.bind(this);
        this.levelStatusCallback = null;
        this.playLevel = null;
        this.viewMode = null;

        this.moveEffect = new Audio("./assets/move.mp3");

        this.windowH = document.getElementById("game").offsetHeight;
    }

    playLevelBoard(lvl, cb) {
        this.levelStatusCallback = cb;
        this.playLevel = lvl;
        this.viewMode = "play";

        this.setBoardJson(this.playLevel);
        this.createBoard();
        this.play();
    }

    restart() {
        this.drawBoard();
        this.play();
    }

    play() {
        this.showAvailableSquares();

        if (this.viewMode !== "solution") {
            if (this.levelComplete()) {
                this.levelStatusCallback(true);
                return;
            }

            if (this.levelFailed()) {
                this.levelStatusCallback(false);
                return;
            }
        }
    }

    setBoardJson(lvl) {
        this.boardJson = gameLevels[lvl];
    }

    getBoardJson() {
        return this.boardJson;
    }

    itemKey(c, r) {
        return `${c}-${r}`;
    }

    setBoardItem(c, r, prop, data) {
        if (!this.board[this.itemKey(c, r)]) {
            this.board[this.itemKey(c, r)] = {};
        }

        this.board[this.itemKey(c, r)][prop] = data;
    }

    boardItem(c, r, prop = false) {
        if (!this.board[this.itemKey(c, r)])
            return null;

        if (!prop)
            return this.board[this.itemKey(c, r)];
        else
            return this.board[this.itemKey(c, r)][prop];
    }

    createBoard() {
        this.createBoardSchema();
        this.drawBoard();
    }

    createBoardSchema() {
        this.boardSchema = [];

        for (let r = 0; r < this.boardJson.rows; r++) {
            let boardRow = [];

            for (let c = 0; c < this.boardJson.cols; c++) {
                boardRow.push(0);
            }

            this.boardSchema.push(boardRow);
        }

        this.boardSchema[this.getBoardJson().rows - 1][this.getBoardJson().rows - 1] = 1000;

        let ballsValues = [...this.getBoardJson().values];
        this.boardSolution = [];
        this.locateAllBallsInSchema(this.getBoardJson().cols - 1, this.getBoardJson().rows - 1, ballsValues);
    }

    locateAllBallsInSchema(c, r, ballsValues) {
        let options = this.getAllValidDirections(c, r, true, true);

        let result = false;
        for (let t = 0; t < options.length; t++) {
            if (this.validPlace(options[t]), true) {
                const val = ballsValues.shift();
                const [oc, or, bc, br] = options[t];

                this.boardSchema[br][bc] = val;

                if (ballsValues.length == 0)
                    result = true
                else
                    result = this.locateAllBallsInSchema(oc, or, ballsValues)

                if (!result) {
                    this.boardSchema[br][bc] = 0;
                    ballsValues.unshift(val);
                }
                else {
                    this.addSolution(oc, or);
                    return true
                }
            }
        }

        return result;
    }

    drawBoard() {
        this.squareSize = Math.min(Math.floor((this.windowH * .85) / this.boardJson.rows), this.boardJson.size);

        const squaresElement = document.getElementById("squares");
        squaresElement.style.visibility = "hidden";

        // clear board
        this.board = [];
        this.player = null;
        squaresElement.innerHTML = '';

        for (let r = 0; r < this.boardJson.rows; r++) {
            let squaresRow = document.createElement("div");
            squaresRow.classList.add("squares-row");

            for (let c = 0; c < this.boardJson.cols; c++) {
                let bs = this.boardSquare(c, r);

                squaresRow.appendChild(bs);

                this.setBoardItem(c, r, "squareElm", bs);
                this.setBoardItem(c, r, "ballValue", 0);
                this.setBoardItem(c, r, "c", c);
                this.setBoardItem(c, r, "r", r);
            }

            squaresElement.appendChild(squaresRow);
        }

        this.boardSchema.map((row, rIndex) => {
            row.map((val, cIndex) => {
                switch (parseInt(val)) {
                    case 0:
                        break;

                    case 1000:  // player (blue ball)
                        this.player = this.locateBall(cIndex, rIndex, '0', "player");
                        break;

                    default:
                        const type = (typeof (val) == "string" ? "op" : "num");
                        this.locateBall(cIndex, rIndex, val, type);
                }
            })
        });

        squaresElement.style.visibility = "visible";
    }

    boardSquare(c, r) {
        let e = document.createElement("div");
        e.classList.add("square-item");
        e.style.width = `${this.squareSize}px`;
        e.style.height = `${this.squareSize}px`;
        e.dataset.c = c;
        e.dataset.r = r;

        return e;
    }

    getSquareCoordinates(c, r) {
        const { x, y } = this.boardItem(c, r, "squareElm").getBoundingClientRect();

        return { x: x, y: y };
    }

    locateBall(c, r, val, type) {
        const ballWrapper = document.createElement("div");
        ballWrapper.classList.add('ball-wrapper');
        ballWrapper.width = `${this.boardJson.size}px`;
        ballWrapper.height = `${this.boardJson.size}px`;

        const ballImg = document.createElement("img");
        ballImg.classList.add('ball-img');
        let file = '';
        switch (type) {
            case 'num':
                file = 'num_bg.png';
                break;

            case 'op':
                file = 'op_bg.png';
                break;

            case 'player':
                file = 'player.png';
                ballWrapper.classList.add('blue-ball');
                break;
        }
        ballImg.src = `./assets/${file}`;

        const ballText = document.createElement("div");
        ballText.classList.add('ball-text');
        ballText.textContent = val;
        ballWrapper.appendChild(ballText);

        ballWrapper.appendChild(ballImg);

        this.boardItem(c, r, "squareElm").appendChild(ballWrapper);
        this.setBoardItem(c, r, "ballValue", val);

        return this.boardItem(c, r);
    }

    removeBall(c, r) {
        this.boardItem(c, r, "squareElm").innerHTML = '';
        this.setBoardItem(c, r, "ballValue", 0);
    }

    validPlace(option, returnOnBallLocated = true, checkSchema = false) {
        const [oc, or, bc, br] = option;

        const colRange = Array.from({ length: this.getBoardJson().cols }, (_, i) => i);
        if (!colRange.includes(oc))
            return false

        const rowRange = Array.from({ length: this.getBoardJson().rows }, (_, i) => i);
        if (!rowRange.includes(or))
            return false

        let val = 0
        if (checkSchema)
            val = parseInt(this.boardSchema[br][bc]);
        else
            val = parseInt(this.boardItem(bc, br, "ballValue"));

        if (returnOnBallLocated) {
            // can not go to this coordinates, a ball already located there
            if (val !== 0)
                return false
        }
        else {
            // make sure you skip over a ball
            if (val === 0)
                return false
        }

        return true;
    }

    getAllValidDirections(c, r, returnOnBallLocated = true, checkSchema = false) {
        let validOptions = [];

        let options = [];
        options.push([c, r - 2, c, r - 1]);
        options.push([c + 2, r - 2, c + 1, r - 1]);
        options.push([c + 2, r, c + 1, r]);
        options.push([c + 2, r + 2, c + 1, r + 1]);
        options.push([c, r + 2, c, r + 1]);
        options.push([c - 2, r + 2, c - 1, r + 1]);
        options.push([c - 2, r, c - 1, r]);
        options.push([c - 2, r - 2, c - 1, r - 1]);

        // shuffle order
        let pos = Array.from({ length: options.length }, (_, i) => i);
        for (let i = pos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pos[i], pos[j]] = [pos[j], pos[i]];
        }

        for (const ind of pos) {
            if (this.validPlace(options[ind], returnOnBallLocated, checkSchema))
                validOptions.push([...options[ind]]);
        }

        return validOptions;
    }

    addSolution(c, r) {
        this.boardSolution.unshift({ "c": c, "r": r });
    }

    showAvailableSquares() {
        let { c, r } = this.player.squareElm.dataset;
        c = parseInt(c);
        r = parseInt(r);

        let availableDirections = this.getAllValidDirections(c, r, false, false);

        this.availableSquares = [];

        if (availableDirections.length > 0) {
            const playerValue = isNaN(parseInt(this.player.ballValue)) ? 0 : this.player.ballValue;

            availableDirections.forEach(op => {
                const [c, r, bc, br] = op;
                const skipOverValue = this.boardItem(bc, br, "ballValue");
                const isOp = (String(skipOverValue).length == 2);
                let opResult = 0;
                if (isOp)
                    opResult = eval(`${playerValue}${skipOverValue}`)

                if ((isOp && (opResult >= 0)) || (parseInt(skipOverValue) >= parseInt(playerValue))) {
                    this.availableSquares.push(op);

                    this.markSquare(c, r);
                    this.boardItem(c, r, "squareElm").addEventListener("click", this.movePlayer);
                }
            });
        }
    }

    markSquare(c, r) {
        this.boardItem(c, r, "squareElm").classList.add("valid-click");
    }

    clearAvailableSquares() {
        this.availableSquares.forEach(op => {
            const [c, r] = op;
            this.boardItem(c, r, "squareElm").classList.remove("valid-click");
            this.boardItem(c, r, "squareElm").removeEventListener("click", this.movePlayer);
        });
    }

    movePlayer(elm = null, c = null, r = null, cb=null) {
        this.gameManager.playSound(this.moveEffect);

        let dc = c, dr = r;

        if (elm !== null) {
            // destination location       
            dc = parseInt(elm.target.dataset.c);
            dr = parseInt(elm.target.dataset.r);
        }

        let { c: pc, r: pr } = this.player.squareElm.dataset; // current location
        pc = parseInt(pc);
        pr = parseInt(pr);

        const { x: dx, y: dy } = this.getSquareCoordinates(dc, dr);
        const { x: px, y: py } = this.getSquareCoordinates(pc, pr);

        const rc = (dc == pc) ? pc : (dc > pc) ? pc + 1 : pc - 1;
        const rr = (dr == pr) ? pr : (dr > pr) ? pr + 1 : pr - 1;


        const oldPlayer = this.player;
        this.player.squareElm.firstElementChild.style.transform = `translate(${dx - px}px, ${dy - py}px)`;

        this.clearAvailableSquares();
        
        const jumpOverValue = this.boardItem(rc, rr).ballValue;
        this.removeBall(rc, rr);

        setTimeout(() => {
            this.player = this.boardItem(dc, dr);
            this.player.squareElm.appendChild(oldPlayer.squareElm.firstElementChild);
            this.player.squareElm.firstElementChild.style.transform = 'none';
            this.setPlayerValue(oldPlayer.ballValue, jumpOverValue);

            oldPlayer.squareElm.innerHTML = '';
            oldPlayer.ballValue = 0;

            if (cb !== null) {
                setTimeout(() => {
                    this[cb]();
                }, 1000);                
            }
            else {
                this.play();
            }
        }, 500);
    }

    setPlayerValue(oldVal, newVal) {
        let setValue = newVal;
        if (['-', '+'].includes(String(newVal).charAt(0))) {
            setValue = eval(`${oldVal}${newVal}`);
        }

        this.player.squareElm.firstElementChild.firstElementChild.innerHTML = setValue;
        this.player.ballValue = setValue;
    }

    levelComplete() {
        let result = true;

        Object.keys(this.board).forEach(key => {
            const { c, r } = this.player.squareElm.dataset;

            if (this.itemKey(c, r) !== key) {
                const item = this.board[key];
                result = result && (parseInt(item.ballValue) === 0);
            }
        })

        return result;
    }

    levelFailed() {
        let result = true;

        Object.keys(this.board).forEach(key => {
            const item = this.board[key];
            result = result && (parseInt(item.ballValue) !== 0);
        })

        if (!result) {
            let { c: pc, r: pr } = this.player.squareElm.dataset; // current location
            pc = parseInt(pc);
            pr = parseInt(pr);

            result = (this.availableSquares.length == 0);
        }

        return result;
    }

    getNextLevel() {
        return this.playLevel == gameLevels.length - 1 ? this.playLevel : this.playLevel + 1;
    }

    showSolution(cb) {
        this.viewMode = "solution";
        this.onSolutionCompleteCallback = cb;
        this.solutionSteps = [...this.boardSolution];
        this.clearAvailableSquares();
        this.showNextSolutionStep();
    }

    showNextSolutionStep() {
        if (this.solutionSteps.length == 0) {
            this.viewMode = "play";
            this.onSolutionCompleteCallback();
            return;
        }

        const step = this.solutionSteps.shift();

        this.availableSquares = [[step.c, step.r]];
        this.markSquare(step.c, step.r);

        setTimeout(() => {
            this.movePlayer(null, step.c, step.r, "showNextSolutionStep");
        }, 500);
    }
}
