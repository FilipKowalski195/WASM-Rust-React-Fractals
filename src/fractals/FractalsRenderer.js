import Worker from './worker/mandelbrot.worker'
import RepeatedWorkerPool from './worker/repeatedWorkerPool'

class FractalsRenderer {

    setup = {
        res: [1000, 800],
        plane: [-1.6, 0.4, -0.8, 0.8],
        scaling: 5,
        workers: navigator.hardwareConcurrency,
        maxIters: 1000
    }

    realWorkers = this.setup.workers + (this.setup.res[1] % this.setup.workers === 0 ? 0 : 1)
    pool = new RepeatedWorkerPool(() => new Worker(), this.realWorkers)

    isMovingPlane = false;

    fullResTask = null;

    canvas = null

    progressListeners = []

    initGamepad() {
        window.addEventListener('gamepadconnected', (e) => {
            this.padIndex = e.gamepad.index;
        })

        setInterval(() => {
            if (this.padIndex == null) {
                return;
            }

            const [x1, y1, _, y2] = navigator.getGamepads()[this.padIndex].axes

            let xMove = 0;
            let yMove = 0;

            if (Math.abs(x1) > 0.04) {
                xMove = x1 * 100;
            }

            if (Math.abs(y1) > 0.04) {
                yMove = y1 * 100;
            }

            if (xMove !== 0 || yMove !== 0) {
                this.movePlaneByMouseMovement(-xMove, -yMove)
            }

            if (Math.abs(y2) > 0.02) {
                this.zoomByWheelDeltaY(y2 * 100)
            }
        }, 150)
    }

    injectCanvas(canvas) {

        this.pool.onEachMessage = (e) => this.onPoolAnswer(e);

        this.canvas = canvas;

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoomByWheelDeltaY(e.deltaY);
        })

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isMovingPlane) {
                this.movePlaneByMouseMovement(e.movementX, e.movementY);
            }
        });

        this.canvas.addEventListener('mousedown', () => {
            this.isMovingPlane = true;
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isMovingPlane = false;
        });
    }

    zoomByWheelDeltaY(deltaY) {

        const xParticle = this.getParticleX();

        if (Math.abs(xParticle) < 9.0e-16 && deltaY < 0) {
            return
        }

        const xShrink = xParticle * deltaY * this.getWidthHeightProportion();

        this.setup.plane[0] -= xShrink;
        this.setup.plane[1] += xShrink;

        const yShrink = this.getParticleY() * deltaY;

        this.setup.plane[2] -= yShrink;
        this.setup.plane[3] += yShrink;

        if (!this.pool.isOccupied()) {
            this.loadFrame(false)
            this.scheduleFullRes()
        }
    }

    movePlaneByMouseMovement(movementX, movementY) {

        const xMove = this.getParticleX() * movementX;
        const yMove = this.getParticleY() * movementY;

        this.setup.plane[0] -= xMove;
        this.setup.plane[1] -= xMove;

        this.setup.plane[2] -= yMove;
        this.setup.plane[3] -= yMove;

        if (!this.pool.isOccupied()) {
            this.loadFrame(false)
            this.scheduleFullRes()
        }
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

    loadFrame(fullRes) {

        this.progressListeners.forEach((listener) => listener(true))

        for (let i = 0; i < this.realWorkers; i++) {
            this.pool.postMessage({
                res: this.setup.res,
                plane: this.setup.plane,
                scaling: fullRes ? 1 : this.setup.scaling,
                partNum: i,
                partCount: this.setup.workers,
                maxIters: fullRes ? this.setup.maxIters : this.setup.maxIters * 0.5
            });
        }
    }

    onPoolAnswer(e) {
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
        if (this.fullResTask != null) {
            clearTimeout(this.fullResTask);
        }

        this.fullResTask = setTimeout(() => {
            this.loadFrame(true)
        }, 400);
    }

    isFetching() {
        return this.pool.isOccupied();
    }

    addOnFetchingProgressChanged(listener) {
        this.progressListeners.push(listener);
    }

    removeOnFetchingProgressChanged(listener) {
        this.progressListeners.push(listener);
    }
}

export default FractalsRenderer;