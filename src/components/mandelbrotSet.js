import React, {Component} from "react";
import Worker from '../worker/mandelbrot.worker';
import RepeatedWorkerPool from '../worker/repeatedWorkerPool'

class MandelbrotSet extends Component {
  setup = {
    res: [1250, 1000],
    plane: [-2.0, 0.5, -1.0, 1.0],
    scaling: 1,
    workers: 20
  }

  updateCanvas = (canvas, data, width, height, x, y) => {
    canvas.putImageData(new ImageData(
        new Uint8ClampedArray(data),
        width,
        height
    ), x, y);
  }

  componentDidMount() {
    let canvas = this.refs.canvas.getContext('2d');
    const realWorkers = this.setup.workers + (this.setup.res[1] % this.setup.workers === 0 ? 0 : 1)
    let pool = new RepeatedWorkerPool(() => new Worker(), realWorkers)

    pool.onEachMessage = (e) => {
      this.updateCanvas(canvas, e.data.data, e.data.width, e.data.height, e.data.x, e.data.y);
    };

    for (let i = 0; i < realWorkers; i++) {
      pool.postMessage({
        res: this.setup.res,
        plane: this.setup.plane,
        scaling: this.setup.scaling,
        partNum: i,
        partCount: this.setup.workers
      });
    }
  }

  render() {
    return (
        <canvas ref="canvas" width={1250} height={1000}/>
    )
  }
}

export default MandelbrotSet;