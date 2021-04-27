import React, {Component} from "react";
import Worker from '../worker/mandelbrot.worker';
import RepeatedWorkerPool from '../worker/repeatedWorkerPool'

class MandelbrotSet extends Component {
  setup = {
    res: [1000, 800],
    plane: [-1.6, 0.4, -0.8, 0.8],
    scaling: 5,
    workers: 20,
    maxIters: 1000
  }

  realWorkers = this.setup.workers + (this.setup.res[1] % this.setup.workers === 0 ? 0 : 1)
  pool = new RepeatedWorkerPool(() => new Worker(), this.realWorkers)

  isMoving = false;

  fullResTask = null;

  updateCanvas = (canvas, data, width, height, x, y) => {
    canvas.putImageData(new ImageData(
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
    }, 500);
  }

  componentDidMount() {
    this.loadFrame(true);

    this.refs.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      console.log(e.deltaY)

      const xParticle = (this.setup.plane[1] - this.setup.plane[0]) / this.setup.res[0];

      const yParticle = (this.setup.plane[3] - this.setup.plane[2]) / this.setup.res[1];

      const prop = this.setup.res[0] / this.setup.res[1];

      this.setup.plane[0] -= xParticle * e.deltaY * prop;
      this.setup.plane[1] += xParticle * e.deltaY * prop;

      this.setup.plane[2] -= yParticle * e.deltaY;
      this.setup.plane[3] += yParticle * e.deltaY;

      if (!this.pool.isOccupied()) {
        this.loadFrame(false)
        this.scheduleFullRes()
      }
    })


    this.refs.canvas.addEventListener('mousedown', () => {
      this.isMoving = true;
    });

    this.refs.canvas.addEventListener('mouseup', () => {
      this.isMoving = false;
    });

    this.refs.canvas.addEventListener('mousemove', (e) => {
      if (this.isMoving) {
        const xParticle = (this.setup.plane[1] - this.setup.plane[0]) / this.setup.res[0];

        const yParticle = (this.setup.plane[3] - this.setup.plane[2]) / this.setup.res[1];

        this.setup.plane[0] -= xParticle * e.movementX;
        this.setup.plane[1] -= xParticle * e.movementX;

        this.setup.plane[2] -= yParticle * e.movementY;
        this.setup.plane[3] -= yParticle * e.movementY;

        if (!this.pool.isOccupied()) {
          this.loadFrame(false)
          this.scheduleFullRes()
        }
      }
    });
  }

  loadFrame(fullRes) {
    let canvas = this.refs.canvas.getContext('2d');

    this.pool.onEachMessage = (e) => {
      this.updateCanvas(canvas, e.data.data, e.data.width, e.data.height, e.data.x, e.data.y);
    };

    for (let i = 0; i < this.realWorkers; i++) {
      this.pool.postMessage({
        res: this.setup.res,
        plane: this.setup.plane,
        scaling: fullRes ? 1 : this.setup.scaling,
        partNum: i,
        partCount: this.setup.workers,
        maxIters: this.setup.maxIters
      });
    }
  }

  render() {
    return (
        <canvas ref="canvas" width={1000} height={800}/>
    )
  }
}

export default MandelbrotSet;