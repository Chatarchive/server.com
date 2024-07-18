const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Colors
const WHITE = 'rgb(255, 255, 255)';
const BLACK = 'rgb(0, 0, 0)';
const RED = 'rgb(255, 0, 0)';
const BLUE = 'rgb(0, 0, 255)';
const GRAY = 'rgb(128, 128, 128)';

const WIDTH = 1800;
const HEIGHT = 1200;
const SCALE = 1;
let viewOffset = 0;
let displayReadme = false;

// Class definitions
class PointCharge {
    constructor(x, q) {
        this.x = x;
        this.q = q;
        this.showForce = true;
    }

    toggleForceDisplay() {
        this.showForce = !this.showForce;
    }

    renderCharge(ctx, scale, offset) {
        const chargePos = [(this.x * 60 * scale) + WIDTH / 2 + offset, HEIGHT / 2];
        const color = this.showForce ? BLACK : GRAY;
        ctx.beginPath();
        ctx.arc(chargePos[0], chargePos[1], 10 * scale, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.font = `${24 * scale}px Arial`;
        ctx.fillStyle = BLACK;
        ctx.fillText(`${this.q}Q`, chargePos[0], chargePos[1] + 20 * scale);
    }
}

class ElectricFieldCalculator {
    constructor(xMin, xMax) {
        this.charges = [];
        this.xMin = xMin;
        this.xMax = xMax;
        this.showFraction = false;
        this.showNegativeForce = false;
    }

    toggleForceSign() {
        this.showNegativeForce = !this.showNegativeForce;
    }

    addCharge(x, q) {
        if (x < this.xMin || x > this.xMax) {
            return;
        }
        for (let charge of this.charges) {
            if (charge.x === x) {
                return;
            }
        }
        this.charges.push(new PointCharge(x, q));
    }

    removeCharge(x) {
        this.charges = this.charges.filter(charge => charge.x !== x);
    }

    toggleForceDisplay(x) {
        for (let charge of this.charges) {
            if (charge.x === x) {
                charge.toggleForceDisplay();
            }
        }
    }

    toggleFraction() {
        this.showFraction = !this.showFraction;
    }

    calculateForces() {
        let forces = new Map();
        for (let charge1 of this.charges) {
            let force = 0;
            for (let charge2 of this.charges) {
                if (charge1 !== charge2) {
                    const r = charge1.x - charge2.x;
                    if (r !== 0) {
                        const F = charge1.q * charge2.q / (r ** 2);
                        const direction = r > 0 ? 1 : -1;
                        force += F * direction;
                    }
                }
            }
            forces.set(charge1, force);
        }
        return forces;
    }

    drawForces(ctx, scale, offset) {
        const forces = this.calculateForces();
        for (let [charge, force] of forces) {
            if (!charge.showForce) {
                continue;
            }
            const chargePos = [(charge.x * 60 * scale) + WIDTH / 2 + offset, HEIGHT / 2];
            const forcePos = [(charge.x * 60 * scale) + WIDTH / 2 + offset + 30 * scale * (force > 0 ? 1 : -1), HEIGHT / 2];
            const color = force > 0 ? RED : BLUE;
            ctx.beginPath();
            ctx.moveTo(chargePos[0], chargePos[1]);
            ctx.lineTo(forcePos[0], forcePos[1]);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 * scale;
            ctx.stroke();
            drawArrowhead(ctx, color, forcePos, force > 0, scale);
            ctx.font = `${24 * scale}px Arial`;
            ctx.fillStyle = BLACK;
            ctx.fillText(`${Math.abs(force).toFixed(2)}F`, forcePos[0] + (force > 0 ? 15 : -20) * scale, forcePos[1] - 30 * scale);
        }
    }
}

// Functions
function drawArrowhead(ctx, color, position, right, scale) {
    ctx.beginPath();
    if (right) {
        ctx.moveTo(position[0] + 15 * scale, position[1]);
        ctx.lineTo(position[0], position[1] - 5 * scale);
        ctx.lineTo(position[0], position[1] + 5 * scale);
    } else {
        ctx.moveTo(position[0] - 15 * scale, position[1]);
        ctx.lineTo(position[0], position[1] - 5 * scale);
        ctx.lineTo(position[0], position[1] + 5 * scale);
    }
    ctx.fillStyle = color;
    ctx.fill();
}

function drawXAxis(ctx, scale, offset) {
    for (let x = -10; x <= 10; x++) {
        const xCenter = x * 60 * scale + WIDTH / 2 + offset;
        ctx.beginPath();
        ctx.moveTo(xCenter, HEIGHT / 2 - 10 * scale);
        ctx.lineTo(xCenter, HEIGHT / 2 + 10 * scale);
        ctx.strokeStyle = BLACK;
        ctx.stroke();
        ctx.font = `${24 * scale}px Arial`;
        ctx.fillStyle = BLACK;
        ctx.fillText(x, xCenter, HEIGHT / 2 + 60 * scale);
    }
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2 - 600 * scale + offset, HEIGHT / 2);
    ctx.lineTo(WIDTH / 2 + 600 * scale + offset, HEIGHT / 2);
    ctx.strokeStyle = BLACK;
    ctx.stroke();
}

// Main loop
const efc = new ElectricFieldCalculator(-10, 10);
efc.addCharge(2, 3);
efc.addCharge(-3, -2);

function mainLoop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawXAxis(ctx, SCALE, viewOffset);
    efc.drawForces(ctx, SCALE, viewOffset);
    for (let charge of efc.charges) {
        charge.renderCharge(ctx, SCALE, viewOffset);
    }
    requestAnimationFrame(mainLoop);
}

mainLoop();
