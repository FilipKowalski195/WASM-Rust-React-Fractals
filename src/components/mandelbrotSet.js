import React, {Component} from "react";

class MandelbrotSet extends Component {

  componentDidMount() {
    let canvas = this.refs.canvas.getContext('2d');
    import('fractals-wasm').then(({ generate_frame_part_mandelbrot }) => {

      let time = performance.now();
      let data = generate_frame_part_mandelbrot(
          Uint32Array.from([1250, 1000]),
          Float64Array.from([-2.0, 0.5, -1.0, 1.0]),
          5,
          0,
          1
      );
      alert(performance.now() - time)

      canvas.putImageData(new ImageData(
          new Uint8ClampedArray(data),
          1250,
          1000
      ), 0, 0)

    });
  }

  render() {
    return (
        <canvas ref="canvas" width={1250} height={1000}/>
    )
  }
}

export default MandelbrotSet;