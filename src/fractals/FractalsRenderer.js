import Worker from './worker/mandelbrot.worker'
import RepeatedWorkerPool from './worker/repeatedWorkerPool'

class FractalsRenderer {

    setup = this.prepareSetup(
        [1200, 600],
        [-3.5, 2.5, -1.5, 1.5],
        1000
    );

    parts = this.setup.workers;
    pool = new RepeatedWorkerPool(() => new Worker(), this.setup.workers);
    firstAnswer = false;

    render = {
        fractalChanged: true,
        isMovingPlane: false,
        fullResTask: null,
        refreshLoop: null,
        refreshMs: 5,
        fullResMs: 500,
        precisionScrollLimit: 9.0e-16
    }

    padIndex = null
    padSettings = {
        deadZone: 0.1,
        scrollModifier: 20,
        moveModifier: 15,
    }

    canvas = null;

    progressListeners = [];

    init() {

        console.log(this.setup)

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
                maxIters: this.setup.maxIters
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
        });

        this.canvas.addEventListener('mouseup', () => {
            this.render.isMovingPlane = false;
        });
    }

    zoomByWheelDeltaY(deltaY) {

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

        this.firstAnswer = true;

        if (!this.pool.isOccupied()) {
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

    prepareSetup(res, plane, iters) {

        const factors = number => Array
            .from(Array(number + 1), (_, i) => i)
            .filter(i => number % i === 0)

        const cores = navigator.hardwareConcurrency;

        const possibleValues = factors(res[1])

        let workers = this.getCloserNumber(possibleValues, cores)
        let scaling = this.getCloserNumber(possibleValues, 5)

        if (res[1] % 200 !== 0) {
            throw new Error("Resolution must be divisible by 200 to " +
                "provide high flexibility in workers distribution!");
        }

        return {
            res: res,
            plane: plane,
            scaling: scaling,
            workers: workers,
            maxIters: iters
        }
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