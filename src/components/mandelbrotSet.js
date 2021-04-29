import React, {Component} from "react";
import FractalsRenderer from "../fractals/FractalsRenderer";

class MandelbrotSet extends Component {

  renderer = new FractalsRenderer();

  componentDidMount() {
    this.renderer.injectCanvas(this.refs.canvas);
    this.renderer.init();
  }

  componentWillUnmount() {
    this.renderer.close()
  }

  render() {
    return (
        <canvas ref="canvas" width={1200} height={600} />
    )
  }
}

export default MandelbrotSet;