import Worker from './worker/fractals.worker'
import RepeatedWorkerPool from './worker/repeatedWorkerPool'

class FractalsRenderer {

    _firstAnswer = false;

    _render = {
        fractalChanged: true,
        isMovingPlane: false,
        fullResTask: null,
        refreshLoop: null,
        refreshMs: 5,
        fullResMs: 500,
        precisionScrollLimit: 9.0e-16,
        zoomSpeedLock: 50,
    }

    _padIndex = null
    _padSettings = {
        deadZone: 0.1,
        scrollModifier: 20,
        moveModifier: 15,
    }

    _canvas = null;

    _progressListeners = [];
    stats = []
    _statsListeners = []

    setup = {
        maxIters: 1000,
        color: {
            h: 200.0,
            s: 1.0,
            v: 1.0,
            smooth: true,
            smoothMove: true,
            mode: "Value",
        },
        fractal: {
            type: "Mandelbrot",
            point: [0.0, 0.0]
        }
    }

    constructor(screenRatio, maxHeight) {

        const scaling = 5;
        const workers = navigator.hardwareConcurrency;

        const factor = scaling * workers;

        const height = Math.floor(maxHeight / factor) * factor;
        let width = height * screenRatio;

        width = Math.floor(width / scaling) * scaling;

        const planeLengthX = 3 * screenRatio;

        const plane = [-planeLengthX * 0.6, planeLengthX * 0.4, -1.5, 1.5];

        this._setup = {
            res: [width, height],
            plane: plane,
            scaling: scaling,
            workers: workers
        }

        console.log(this._setup)

        this.parts = this._setup.workers;
        this.pool = new RepeatedWorkerPool(() => new Worker(), this._setup.workers);

        for (let i = 0; i < this._setup.workers; i++) {
            this.stats.push({
                id: i,
                scaledMs: 0,
                fullResMs: 0
            })
        }
    }

    init() {

        window.addEventListener('gamepadconnected', (e) => {
            this._padIndex = e.gamepad.index;
        })

        window.addEventListener('gamepaddisconnected', (e) => {
            if (this._padIndex === e.gamepad.index) {
                this._padIndex = null;
            }
        })

        this._render.refreshLoop = setInterval(() => {
            this.processPadEvents()

            const shouldRender = this._render.fractalChanged &&
                (this._render.fullResTask == null || !this.pool.isOccupied())

            if (shouldRender) {

                this.loadFrame(false)
                this.scheduleFullRes()
            }
        }, this._render.refreshMs)
    }

    close() {
        if (this._render.refreshLoop != null) {
            clearInterval(this._render.refreshLoop)
        }
    }

    invalidate() {
        this._render.fractalChanged = true;
    }

    getWidth() {
        return this._setup.res[0]
    }

    getHeight() {
        return this._setup.res[1]
    }

    loadFrame(fullRes) {

        this._progressListeners.forEach((listener) => listener(true))

        for (let i = 0; i < this.parts; i++) {
            this.pool.postMessage({
                res: this._setup.res,
                plane: this._setup.plane,
                scaling: fullRes ? 1 : this._setup.scaling,
                isFullRes: fullRes,
                partNum: i,
                partCount: this._setup.workers,
                maxIters: this.setup.maxIters,
                fractal: this.setup.fractal,
                color: {
                    ...this.setup.color,
                    smooth: fullRes ? this.setup.color.smooth : this.setup.color.smoothMove
                }
            });
        }

        this._render.fractalChanged = false;
    }

    processPadEvents() {

        if (this._padIndex == null ) {
            return;
        }

        const [x1, y1, _, y2] = navigator.getGamepads()[this._padIndex].axes

        let xMove = 0;
        let yMove = 0;

        if (Math.abs(x1) > this._padSettings.deadZone) {
            xMove = x1 * this._padSettings.moveModifier;
        }

        if (Math.abs(y1) > this._padSettings.deadZone) {
            yMove = y1 * this._padSettings.moveModifier;
        }

        if (xMove !== 0 || yMove !== 0) {
            this.movePlaneByMouseMovement(-xMove, -yMove)
        }

        if (Math.abs(y2) > this._padSettings.deadZone) {
            this.zoomByWheelDeltaY(y2 * this._padSettings.scrollModifier)
        }
    }

    injectCanvas(canvas) {

        this.pool.onEachMessage = (e) => this.onPoolAnswer(e);

        this._canvas = canvas;

        this._canvas.style.cursor = "grab"

        this._canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoomByWheelDeltaY(e.deltaY);
        })

        this._canvas.addEventListener('mousemove', (e) => {
            if (this._render.isMovingPlane) {
                this.movePlaneByMouseMovement(e.movementX, e.movementY);
            }
        });

        this._canvas.addEventListener('mousedown', () => {
            this._render.isMovingPlane = true;
            this._canvas.style.cursor = "grabbing"
        });

        this._canvas.addEventListener('mouseup', () => {
            this._render.isMovingPlane = false;
            this._canvas.style.cursor = "grab"
        });
    }

    zoomByWheelDeltaY(deltaY) {
        deltaY = deltaY / Math.abs(deltaY) * Math.min(Math.abs(deltaY), this._render.zoomSpeedLock)

        const xParticle = this.getParticleX();

        if (Math.abs(xParticle) < this._render.precisionScrollLimit && deltaY < 0) {
            return
        }

        const xShrink = xParticle * deltaY * this.getWidthHeightProportion();

        this._setup.plane[0] -= xShrink;
        this._setup.plane[1] += xShrink;

        const yShrink = this.getParticleY() * deltaY;

        this._setup.plane[2] -= yShrink;
        this._setup.plane[3] += yShrink;

        this._render.fractalChanged = true
    }

    movePlaneByMouseMovement(movementX, movementY) {

        const xMove = this.getParticleX() * movementX * 0.8;
        const yMove = this.getParticleY() * movementY * 0.8;

        this._setup.plane[0] -= xMove;
        this._setup.plane[1] -= xMove;

        this._setup.plane[2] -= yMove;
        this._setup.plane[3] -= yMove;

        this._render.fractalChanged = true
    }

    getParticleX() {
        return (this._setup.plane[1] - this._setup.plane[0]) / this._setup.res[0];
    }

    getParticleY() {
        return (this._setup.plane[3] - this._setup.plane[2]) / this._setup.res[1];
    }

    getWidthHeightProportion() {
        return this._setup.res[0] / this._setup.res[1];
    }

    onPoolAnswer(e) {

        if (!this.pool.isOccupied()) {
            this._firstAnswer = true;
            this._progressListeners.forEach((listener) => listener(false))
        }

        if (e.data.isFullRes) {
            this.stats[e.data.workerId].fullResMs = e.data.time
        } else {
            this.stats[e.data.workerId].scaledMs = e.data.time
        }

        this._statsListeners.forEach((listener) => listener(this.stats))

        this.updateCanvas(e.data.data, e.data.width, e.data.height, e.data.x, e.data.y);
    }

    updateCanvas(data, width, height, x, y) {
        this._canvas.getContext("2d").putImageData(new ImageData(
            new Uint8ClampedArray(data),
            width,
            height
        ), x, y);
    }

    scheduleFullRes() {
        if (this._render.fullResTask != null) {
            clearTimeout(this._render.fullResTask);
        }

        this._render.fullResTask = setTimeout(() => {
            this.loadFrame(true);
            this._render.fullResTask = null;
        }, this._render.fullResMs);
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
        return !this._firstAnswer || this.pool.isOccupied();
    }

    addOnFetchingProgressChanged(listener) {
        this._progressListeners.push(listener);
    }

    addOnNewWorkerStats(listener) {
        this._statsListeners.push(listener)
    }
}

export default FractalsRenderer;