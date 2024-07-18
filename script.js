const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const chargeInput = document.getElementById('chargeInput');
const infoButton = document.getElementById('infoButton');
const readme = document.getElementById('readme');
const info = document.getElementById('info');
let scale = 1;
let viewOffset = 0;
let charges = [];
let showFraction = false;
let showNegativeForce = false;

class PointCharge {
    constructor(x, q) {
        this.x = x;
        this.q = q;
        this.showForce = true;
    }

    toggleForceDisplay() {
        this.showForce = !this.showForce;
    }

    renderCharge() {
        const chargePos = this.getChargePosition();
        ctx.fillStyle = this.showForce ? '#000000' : '#808080';
        ctx.beginPath();
        ctx.arc(chargePos.x, chargePos.y, 10 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.q}Q`, chargePos.x, chargePos.y + 20 * scale);
    }

    getChargePosition() {
        return {
            x: (this.x * 60 * scale) + canvas.width / 2 + viewOffset,
            y: canvas.height / 2
        };
    }
}

class ElectricFieldCalculator {
    constructor() {
        this.charges = [];
    }

    addCharge(x, q) {
        if (x < -10 || x > 10) return;
        if (!this.charges.some(charge => charge.x === x)) {
            this.charges.push(new PointCharge(x, q));
        }
    }

    removeCharge(x) {
        this.charges = this.charges.filter(charge => charge.x !== x);
    }

    toggleForceDisplay(x) {
        const charge = this.charges.find(charge => charge.x === x);
        if (charge) charge.toggleForceDisplay();
    }

    toggleFraction() {
        showFraction = !showFraction;
    }

    calculateForces() {
        const forces = this.charges.map(charge => ({ charge, force: 0 }));
        for (let i = 0; i < this.charges.length; i++) {
            for (let j = 0; j < this.charges.length; j++) {
                if (i !== j) {
                    const charge1 = this.charges[i];
                    const charge2 = this.charges[j];
                    const r = charge1.x - charge2.x;
                    if (r !== 0) {
                        const F = charge1.q * charge2.q / (r ** 2);
                        const direction = r > 0 ? 1 : -1;
                        forces[i].force += F * direction;
                    }
                }
            }
        }
        return forces;
    }

    drawForces() {
        const forces = this.calculateForces();
        forces.forEach(({ charge, force }) => {
            if (!charge.showForce) return;
            const chargePos = charge.getChargePosition();
            const forcePos = {
                x: chargePos.x + 30 * scale * (force > 0 ? 1 : -1),
                y: chargePos.y
            };
            ctx.strokeStyle = force > 0 ? '#FF0000' : '#0000FF';
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.moveTo(chargePos.x, chargePos.y);
            ctx.lineTo(forcePos.x, forcePos.y);
            ctx.stroke();
            ctx.closePath();
            this.drawArrowhead(forcePos, force > 0);
            ctx.fillStyle = '#000000';
            const fontSize = 30 * scale;
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            let text;
            if (showFraction) {
                const fraction = new Fraction(force).limitDenominator();
                const numerator = Math.abs(fraction.numerator);
                const denominator = Math.abs(fraction.denominator);
                if (denominator === 1) {
                    text = `${force < 0 && showNegativeForce ? '-' : ''}${numerator}F`;
                } else {
                    text = `${force < 0 && showNegativeForce ? '-' : ''}${numerator}/${denominator}F`;
                }
            } else {
                text = `${force < 0 && showNegativeForce ? '-' : ''}${Math.abs(force).toFixed(2)}F`;
            }
            ctx.fillText(text, forcePos.x + (force > 0 ? 20 : -20) * scale, forcePos.y - 30 * scale);
        });
    }

    drawArrowhead(position, right) {
        ctx.fillStyle = right ? '#FF0000' : '#0000FF';
        const points = right
            ? [
                { x: position.x + 15 * scale, y: position.y },
                { x: position.x, y: position.y - 5 * scale },
                { x: position.x, y: position.y + 5 * scale }
            ]
            : [
                { x: position.x - 15 * scale, y: position.y },
                { x: position.x, y: position.y - 5 * scale },
                { x: position.x, y: position.y + 5 * scale }
            ];
        ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.closePath();
        ctx.fill();
    }
}

function drawXAxis() {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    const step = 60 * scale;
    for (let x = -10; x <= 10; x++) {
        const xCenter = x * step + canvas.width / 2 + viewOffset;
        ctx.beginPath();
        ctx.moveTo(xCenter, canvas.height / 2 - 10 * scale);
        ctx.lineTo(xCenter, canvas.height / 2 + 10 * scale);
        ctx.stroke();
        ctx.closePath();
        ctx.fillStyle = '#000000';
        const fontSize = 24 * scale;
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(x, xCenter, canvas.height / 2 + 60 * scale);
    }
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 600 * scale + viewOffset, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + 600 * scale + viewOffset, canvas.height / 2);
    ctx.stroke();
    ctx.closePath();
}

const efc = new ElectricFieldCalculator();

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (Math.abs(y - canvas.height / 2) < 40 * scale) {
        const chargeX = Math.round((x - canvas.width / 2 - viewOffset) / (60 * scale));
        if (chargeX >= -10 && chargeX <= 10) {
            const existingCharge = efc.charges.find(charge => charge.x === chargeX);
            if (existingCharge) {
                efc.toggleForceDisplay(chargeX);
            } else {
                const q = parseFloat(chargeInput.value) || 1;
                efc.addCharge(chargeX, q);
            }
            draw();
        }
    }
});

infoButton.addEventListener('click', () => {
    info.style.display = info.style.display === 'none' ? 'block' : 'none';
    if (info.style.display === 'block') {
        fetch('readme.txt')
            .then(response => response.text())
            .then(text => {
                readme.textContent = text;
            });
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawXAxis();
    efc.drawForces();
    efc.charges.forEach(charge => charge.renderCharge());
}

draw();
