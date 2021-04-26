import React, {Component} from "react";

class JuliaSet extends Component {

  componentDidMount() {
    let canvas = this.refs.canvas.getContext('2d');
    canvas.fillRect(0, 0, 100, 100);
  }

  render() {
    return (
        <canvas ref="canvas" width={1250} height={1000}/>
    )
  }
}

export default JuliaSet;