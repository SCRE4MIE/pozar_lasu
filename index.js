// CANVAS consts
const canvas = document.getElementById("border");
const ctx = canvas.getContext("2d");

const n = 600;
const m = 600;

const treesColors = ['#a7ff0d', '#0dff86', '#00572a', '#f7ff02']
// ===========================================================================

// variables to change in forms
let windSpeedMultiplier = 2;
let windDirection = 'N'
let fireDmg = 0.01;
let fireTempMultiplier = 0.1;
let humidity = 0.2 // 20%

let initialFireTreeHealth = 600;
let pineTreeHealth = 350;
let spruceTreeHealth = 500;
let oakTreeHealth = 1000;
let mapleTreeHealth = 700;

let pineTempToFire = 300;
let spruceTempToFire = 600;
let oakTempToFire = 600;
let mapleTempToFire = 600;
// ===========================================================================

// drawing map variables
let isDrawing = false;
let stopDrawing = false;
ctx.lineWidth = 10;
ctx.strokeStyle = '#4378fd'
// ===========================================================================

// border numbers consts
const liveTreesSpan = document.getElementById("countLiveTreesID");
const burningTreesSpan = document.getElementById("countBurningTreesID");
const deathTreesSpan = document.getElementById("countDeathTreesID");
const generationSpan = document.getElementById("generationID");
// ===========================================================================

// Canvas Drawing Functions
const getMousePos = (canvas, evt) => {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

// Event listener for mouse down
canvas.addEventListener('mousedown', (evt) => {
    if (!stopDrawing) {
        isDrawing = true;
        const mousePos = getMousePos(canvas, evt);
        ctx.beginPath();
        ctx.moveTo(mousePos.x, mousePos.y);
    }
});

// Event listener for mouse move
canvas.addEventListener('mousemove', (evt) => {
    if (isDrawing) {
        const mousePos = getMousePos(canvas, evt);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
    }
});

// Event listener for mouse up
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

// Event listener for mouse leaving the canvas
canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
});
// ===========================================================================

// forms and forms event listeners
const createMapForm = document.getElementById("mapCreatorForm");
const simulationForm = document.getElementById("simulationForm");
const windArrow = document.getElementById("windArrowID");
createMapForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const dataForm = new FormData(e.target);
    ctx.lineWidth = dataForm.get("lineWidth");
    initialFireTreeHealth = parseInt(dataForm.get("initialFireTreeHealth"));
    spruceTreeHealth = parseInt(dataForm.get("spruceTreeHealth"));
    pineTreeHealth = parseInt(dataForm.get("pineTreeHealth"));
    oakTreeHealth = parseInt(dataForm.get("oakTreeHealth"));
    mapleTreeHealth = parseInt(dataForm.get("mapleTreeHealth"));
    humidity = parseFloat(dataForm.get("humidity"));

    pineTempToFire = parseInt(dataForm.get("pineTempToFire"));
    spruceTempToFire = parseInt(dataForm.get("spruceTempToFire"));
    oakTempToFire = parseInt(dataForm.get("oakTempToFire"));
    mapleTempToFire = parseInt(dataForm.get("mapleTempToFire"));

})

simulationForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const dataForm = new FormData(e.target);
    windDirection = dataForm.get("windDirection");
    // change arrow direction in HTML
    windArrow.classList = [];
    windArrow.classList.add('wind');
    windArrow.classList.add(`wind-${windDirection}`);
    // =======
    windSpeedMultiplier = parseFloat(dataForm.get("windSpeedMultiplier"));
    fireDmg = parseFloat(dataForm.get("fireDmg"));
    fireTempMultiplier = parseFloat(dataForm.get("fireTempMultiplier"));
})

// ===========================================================================

// function to change string 'rgb(0,0,0) to hex color number'
const rgb2hex = (rgb) => `#${rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('')}`
// ===========================================================================

// event listener to change drawing color
const rectanglesColors = document.querySelectorAll(".rectangle-color");
rectanglesColors.forEach((item) => {
    item.addEventListener('click', (e) => {
        const computedStyle = window.getComputedStyle(item);
        const backgroundColor = computedStyle.backgroundColor;
        ctx.strokeStyle = rgb2hex(backgroundColor);
    })
})
// ===========================================================================

// get data from Canvas and create matrix RGB
let matrix_colors = [] // tmp matrix
let matrix_hex_nxm = []  // RGB nxm matrix
const createRGBMatrix = () => {
    const imageData = ctx.getImageData(0, 0, n, m);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        // Extract RGBA values
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const alpha = data[i + 3];
        matrix_colors.push(`rgb(${red}, ${green}, ${blue})`)
    }
    let index = 0;
    for (let i = 0; i < n; i += 1) {
        let matrix_row = [];
        for (let j = 0; j < m; j += 1) {
            matrix_row.push(rgb2hex(matrix_colors[index]));
            index += 1;
        }
        matrix_hex_nxm.push(matrix_row);
    }

}
// ===========================================================================

// object classes

//types:
// water - #4378fd
// ground - #a54f2a
// pine tree - #a7ff0d
// spruce - #0dff86
// oak - #00572a
// maple - #f7ff02
// fire - #fa0000

class GroundObject {
    constructor(hex_color) {
        this.type_tree = '';
        this.hex_color = hex_color;
        this.health = 0;
        this.fireTemp = 0;
        this.tempToLightTheFire = 0;
        this.burning = false;
        this.is_not_burning = false;
        this.isTree = false;
        this.humidity = humidity;
        this.decisionType();
    }

    decisionType() {
        if (this.hex_color === '#4378fd') {
            this.type_tree = 'water';
            this.is_not_burning = true;
        } else if (this.hex_color === '#a54f2a') {
            this.type_tree = 'ground';
            this.is_not_burning = true;
        } else if (this.hex_color === '#a7ff0d') {
            this.type_tree = 'pine_tree';
            this.health = pineTreeHealth;
            this.tempToLightTheFire = pineTempToFire;
            this.isTree = true;
        } else if (this.hex_color === '#0dff86') {
            this.type_tree = 'spruce';
            this.health = spruceTreeHealth;
            this.tempToLightTheFire = spruceTempToFire;
            this.isTree = true;
        } else if (this.hex_color === '#00572a') {
            this.type_tree = 'oak';
            this.health = oakTreeHealth;
            this.tempToLightTheFire = oakTempToFire;
            this.isTree = true;
        } else if (this.hex_color === '#f7ff02') {
            this.type_tree = 'maple';
            this.health = mapleTreeHealth;
            this.tempToLightTheFire = mapleTempToFire;
            this.isTree = true;
        } else if (this.hex_color === '#fa0000') {
            this.fireTemp = 100;
            this.burning = true;
            this.health = initialFireTreeHealth;
            this.tempToLightTheFire = 100;
            this.isTree = true;
        } else {
            this.type_tree = 'grass';
            this.hex_color = '#c9fcb0'
            this.health = 10;
            this.tempToLightTheFire = 100;
        }
    }

    calcBurning() {
        // calculate burning per loop
        if (this.burning === true && this.is_not_burning !== true) {
            this.fireTemp += (this.fireTemp * fireTempMultiplier);
            this.health -= (fireDmg * this.fireTemp) + this.humidity;
            this.humidity -= this.humidity * this.fireTemp *0.01;
            if (this.health <= 0) {
                this.hex_color = '#000000' // make it black ( burned )
                this.is_not_burning = true; // cannot burn anymore
                this.fireTemp = 0;
                this.burning = false;
            }
        }
    }

    calcFirePerLoop(i, j) {
        // calculate the temperature of the fire and the effect of the wind, determines whether the tree is ignited or not
        let fireTempSum = 0;

        const left_top = mapMatrix[((i - 1 % n) + n) % n][((j - 1) + m) % m];
        const center_top = mapMatrix[((i - 1 % n) + n) % n][j];
        const right_top = mapMatrix[((i - 1 % n) + n) % n][((j + 1) + m) % m];

        const left_center = mapMatrix[i][((j - 1) + m) % m];
        const center = mapMatrix[i][j];
        const right_center = mapMatrix[i][((j + 1) + m) % m];

        const left_bottom = mapMatrix[((i + 1 % n) + n) % n][((j - 1) + m) % m];
        const center_bottom = mapMatrix[((i + 1 % n) + n) % n][j];
        const right_bottom = mapMatrix[((i + 1 % n) + n) % n][((j + 1) + m) % m];

        let left_top_wind = 1;
        let center_top_wind = 1;
        let right_top_wind = 1;
        let left_center_wind = 1;
        let right_center_wind = 1;
        let left_bottom_wind = 1;
        let center_bottom_wind = 1;
        let right_bottom_wind = 1;

        // calc wind
        if (windDirection === 'N') {
            center_top_wind = center_top_wind * windSpeedMultiplier;
        }
        if (windDirection === 'NE') {
            right_top_wind = right_top_wind * windSpeedMultiplier;
        }
        if (windDirection === 'NW') {
            left_top_wind = left_top_wind * windSpeedMultiplier;
        }
        if (windDirection === 'E') {
            right_center_wind = right_center_wind * windSpeedMultiplier;
        }
        if (windDirection === 'W') {
            left_center_wind = left_center_wind * windSpeedMultiplier;
        }
        if (windDirection === 'S') {
            center_bottom_wind = center_bottom_wind * windSpeedMultiplier;
        }
        if (windDirection === 'SE') {
            right_bottom_wind = right_bottom_wind * windSpeedMultiplier;
        }
        if (windDirection === 'SW') {
            left_bottom_wind = left_bottom_wind * windSpeedMultiplier;
        }
        fireTempSum += left_top.fireTemp * left_top_wind;
        fireTempSum += center_top.fireTemp * center_top_wind;
        fireTempSum += right_top.fireTemp * right_top_wind;
        fireTempSum += left_center.fireTemp * left_center_wind;
        fireTempSum += right_center.fireTemp * right_center_wind;
        fireTempSum += left_bottom.fireTemp * left_bottom_wind;
        fireTempSum += center_bottom.fireTemp * center_bottom_wind;
        fireTempSum += right_bottom.fireTemp * right_bottom_wind;

        // determines whether the tree is ignited or not
        if (fireTempSum >= this.tempToLightTheFire && this.is_not_burning !== true && this.burning === false) {
            this.burning = true; // make a FIRE!
            this.fireTemp = 1;
            this.hex_color = '#fa0000'
        }
        this.calcBurning();
    }

}

// creating main map
let mapMatrix = [] // main map matrix nxm
const createMap = () => {
    for (let i = 0; i < n; i += 1) {
        let mapMatrixRow = [];
        for (let j = 0; j < m; j += 1) {
            mapMatrixRow.push(new GroundObject(matrix_hex_nxm[i][j]))
        }
        mapMatrix.push(mapMatrixRow);
    }
}
// ======================================================================

// create initial border canvas with random trees
const createInitialRandomBorder = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let cellSize = canvas.width / m;
    for (let row = 0; row < n; row++) {
        for (let col = 0; col < m; col++) {
            ctx.fillStyle = treesColors[Math.floor(Math.random() * treesColors.length)]
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    }
}
// ======================================================================

// draw Matrix on Canvas
const drawMatrix = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let cellSize = canvas.width / m;
    for (let row = 0; row < n; row++) {
        for (let col = 0; col < m; col++) {
            ctx.fillStyle = mapMatrix[row][col].hex_color;
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    }
}
// ======================================================================

// button: go to simulation
const goToSimulationBTN = document.getElementById("goToSimulationBtnID");
goToSimulationBTN.addEventListener('click', (e) => {
    createMapForm.classList.add('hide-form');
    simulationForm.classList.remove('hide-form');
    stopDrawing = true;
    createRGBMatrix();
    createMap();
    drawMatrix();
})
// ======================================================================

// function to calculate simulation per loop
const calcSimulation = (generation) => {
    let liveTreesCount = 0
    let burningTreesCount = 0
    let deathTreesCount = 0
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            let mapElementObject = mapMatrix[i][j];
            mapElementObject.calcFirePerLoop(i, j);
            if (mapElementObject.isTree === true) {
                if (mapElementObject.burning === true) {
                    burningTreesCount += 1;
                } else if (mapElementObject.health <= 0) {
                    deathTreesCount += 1;
                } else {
                    liveTreesCount += 1;
                }
            }
        }
    }
    drawMatrix();
    changeNumbers(liveTreesCount, burningTreesCount, deathTreesCount, generation);
}
// ======================================================================

// function to change numbers inside HTML
const changeNumbers = (liveTreesCount, burningTreesCount, deathTreesCount, generation) => {
    liveTreesSpan.innerHTML = liveTreesCount;
    burningTreesSpan.innerHTML = burningTreesCount;
    deathTreesSpan.innerHTML = deathTreesCount;
    generationSpan.innerHTML = generation;
}
// ======================================================================


// animation
let startAnim = false;

document.getElementById('startBtn').addEventListener("click", (e) => {
    startAnim = true;
    requestAnimationFrame(mainLoop);
})

document.getElementById('stopBtn').addEventListener("click", (e) => {
    startAnim = false;
})
// ======================================================================

let generationNumber = 0;

// main loop with animation frames
const mainLoop = () => {
    if (startAnim === true) {
        calcSimulation(generationNumber);
        generationNumber += 1;
        requestAnimationFrame(mainLoop);
    }
}
// ======================================================================

// document ready function
document.addEventListener("DOMContentLoaded", () => {
    createInitialRandomBorder(); // create initial border Canvas
    mainLoop(); // start simulation
});
// ======================================================================

