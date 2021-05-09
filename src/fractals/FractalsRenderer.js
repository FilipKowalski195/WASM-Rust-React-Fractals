import Worker from './worker/fractals.worker'
import RepeatedWorkerPool from './worker/repeatedWorkerPool'

class FractalsRenderer {

    firstAnswer = false;

    render = {
        fractalChanged: true,
        isMovingPlane: false,
        fullResTask: null,
        refreshLoop: null,
        refreshMs: 5,
        fullResMs: 500,
        precisionScrollLimit: 9.0e-16,
        zoomSpeedLock: 50,
    }

    padIndex = null
    padSettings = {
        deadZone: 0.1,
        scrollModifier: 20,
        moveModifier: 15,
    }

    canvas = null;

    progressListeners = [];

    constructor(screenRatio, maxHeight) {

        const scaling = 5;
        const workers = navigator.hardwareConcurrency;

        const factor = scaling * workers;

        const height = Math.floor(maxHeight / factor) * factor;
        let width = height * screenRatio;

        width = Math.floor(width / scaling) * scaling;

        const planeLengthX = 3 * screenRatio;

        const plane = [-planeLengthX * 0.6, planeLengthX * 0.4, -1.5, 1.5];

        this.setup = {
            res: [width, height],
            plane: plane,
            scaling: scaling,
            workers: workers,
            maxIters: 1000
        }

        console.log(this.setup)

        this.parts = this.setup.workers;
        this.pool = new RepeatedWorkerPool(() => new Worker(), this.setup.workers);
    }

    init() {

        window.addEventListener('gamepadconnected', (e) => {
            this.padIndex = e.gamepad.index;
        })

        window.addEventListener('gamepaddisconnected', (e) => {
            if (this.padIndex === e.gamepad.index) {
                this.padIndex = null;
            }
        })

        this.render.refreshLoop = setInterval(() => {
            this.processPadEvents()

            const shouldRender = this.render.fractalChanged &&
                (this.render.fullResTask == null || !this.pool.isOccupied())

            if (shouldRender) {

                this.loadFrame(false)
                this.scheduleFullRes()
            }
        }, this.render.refreshMs)
    }

    close() {
        if (this.render.refreshLoop != null) {
            clearInterval(this.render.refreshLoop)
        }
    }

    loadFrame(fullRes) {

        this.progressListeners.forEach((listener) => listener(true))

        for (let i = 0; i < this.parts; i++) {
            this.pool.postMessage({
                res: this.setup.res,
                plane: this.setup.plane,
                scaling: fullRes ? 1 : this.setup.scaling,
                partNum: i,
                partCount: this.setup.workers,
                maxIters: this.setup.maxIters,
                fractal: {
                    type: "Julia",
                    point: [-0.1, 0.65]
                }
            });
        }

        this.render.fractalChanged = false;
    }

    processPadEvents() {

        if (this.padIndex == null ) {
            return;
        }

        const [x1, y1, _, y2] = navigator.getGamepads()[this.padIndex].axes

        let xMove = 0;
        let yMove = 0;

        if (Math.abs(x1) > this.padSettings.deadZone) {
            xMove = x1 * this.padSettings.moveModifier;
        }

        if (Math.abs(y1) > this.padSettings.deadZone) {
            yMove = y1 * this.padSettings.moveModifier;
        }

        if (xMove !== 0 || yMove !== 0) {
            this.movePlaneByMouseMovement(-xMove, -yMove)
        }

        if (Math.abs(y2) > this.padSettings.deadZone) {
            this.zoomByWheelDeltaY(y2 * this.padSettings.scrollModifier)
        }
    }

    injectCanvas(canvas) {

        this.pool.onEachMessage = (e) => this.onPoolAnswer(e);

        this.canvas = canvas;

        this.canvas.style.cursor = "grab"

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoomByWheelDeltaY(e.deltaY);
        })

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.render.isMovingPlane) {
                this.movePlaneByMouseMovement(e.movementX, e.movementY);
            }
        });

        this.canvas.addEventListener('mousedown', () => {
            this.render.isMovingPlane = true;
            this.canvas.style.cursor = "grabbing"
        });

        this.canvas.addEventListener('mouseup', () => {
            this.render.isMovingPlane = false;
            this.canvas.style.cursor = "grab"
        });
    }

    zoomByWheelDeltaY(deltaY) {
        deltaY = deltaY / Math.abs(deltaY) * Math.min(Math.abs(deltaY), this.render.zoomSpeedLock)

        const xParticle = this.getParticleX();

        if (Math.abs(xParticle) < this.render.precisionScrollLimit && deltaY < 0) {
            return
        }

        const xShrink = xParticle * deltaY * this.getWidthHeightProportion();

        this.setup.plane[0] -= xShrink;
        this.setup.plane[1] += xShrink;

        const yShrink = this.getParticleY() * deltaY;

        this.setup.plane[2] -= yShrink;
        this.setup.plane[3] += yShrink;

        this.render.fractalChanged = true
    }

    movePlaneByMouseMovement(movementX, movementY) {

        const xMove = this.getParticleX() * movementX * 0.8;
        const yMove = this.getParticleY() * movementY * 0.8;

        this.setup.plane[0] -= xMove;
        this.setup.plane[1] -= xMove;

        this.setup.plane[2] -= yMove;
        this.setup.plane[3] -= yMove;

        this.render.fractalChanged = true
    }

    getParticleX() {
        return (this.setup.plane[1] - this.setup.plane[0]) / this.setup.res[0];
    }

    getParticleY() {
        return (this.setup.plane[3] - this.setup.plane[2]) / this.setup.res[1];
    }

    getWidthHeightProportion() {
        return this.setup.res[0] / this.setup.res[1];
    }

    onPoolAnswer(e) {

        if (!this.pool.isOccupied()) {
            this.firstAnswer = true;
            this.progressListeners.forEach((listener) => listener(false))
        }

        this.updateCanvas(e.data.data, e.data.width, e.data.height, e.data.x, e.data.y);
    }

    updateCanvas(data, width, height, x, y) {
        this.canvas.getContext("2d").putImageData(new ImageData(
            new Uint8ClampedArray(data),
            width,
            height
        ), x, y);
    }

    scheduleFullRes() {
        if (this.render.fullResTask != null) {
            clearTimeout(this.render.fullResTask);
        }

        this.render.fullResTask = setTimeout(() => {
            this.loadFrame(true);
            this.render.fullResTask = null;
        }, this.render.fullResMs);
    }

    getCloserNumber(arr, number) {
        let closer = arr[0]

        for (const n of arr) {
            if (Math.abs(n - number) < Math.abs(closer - number)) {
                closer = n;
            }
        }

        return closer;
    }

    isFetching() {
        return !this.firstAnswer || this.pool.isOccupied();
    }

    addOnFetchingProgressChanged(listener) {
        this.progressListeners.push(listener);
    }

    removeOnFetchingProgressChanged(listener) {
        this.progressListeners.push(listener);
    }
}

export default FractalsRenderer;