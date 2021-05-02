import React, {Component} from "react";
import FractalsRenderer from "../fractals/FractalsRenderer";

class MandelbrotSet extends Component {

  state = {
    width: 0,
    height: 0
  }

  renderer = new FractalsRenderer(
      window.screen.availWidth / window.screen.availHeight,
      window.screen.availHeight * 0.9
  );

  componentDidMount() {

    this.setState({
      width: this.renderer.setup.res[0],
      height: this.renderer.setup.res[1]
    })

    this.renderer.injectCanvas(this.refs.canvas);
    this.renderer.init();

  }

  componentWillUnmount() {
    this.renderer.close()
  }

  render() {
    return (
        <canvas ref="canvas" width={this.state.width} height={this.state.height} />
    )
  }
}

export default MandelbrotSet;