import React, {Component} from "react";
import FractalsRenderer from "../fractals/FractalsRenderer";

class MandelbrotSet extends Component {

  renderer = new FractalsRenderer();

  componentDidMount() {
    this.renderer.injectCanvas(this.refs.canvas);
    this.renderer.loadFrame(true)
  }

  render() {
    return (
        <canvas ref="canvas" width={1000} height={800}/>
    )
  }
}

export default MandelbrotSet;