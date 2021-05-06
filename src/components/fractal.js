import React, {Component} from "react";
import FractalsRenderer from "../fractals/FractalsRenderer";

import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Slider, MenuItem, Select, LinearProgress, Backdrop, CircularProgress} from '@material-ui/core';
import { SketchPicker } from 'react-color';

class Fractal extends Component {

  state = {
    width: 0,
    height: 0,
    settingOne: 50,
    fractalNo: 0,
    color: '#ff0000',
    finalColor: '#ff0000',
    loading: true,
    firstLoading: true, 
    visible: false, 
  }

  renderer = new FractalsRenderer(
      window.screen.availWidth / window.screen.availHeight,
      window.screen.availHeight * 0.9
  );

  componentDidMount() {

    this.setState({
      width: this.renderer.setup.res[0],
      height: this.renderer.setup.res[1],
    })

    this.renderer.injectCanvas(this.refs.canvas);
    this.renderer.init();

    this.renderer.addOnFetchingProgressChanged((bool) => { 
      if (this.state.firstLoading && !bool) { 
            this.setState({
              ...this.state,
              visible: true, 
              firstLoading: false, 
            })
            console.log("Not vissible")
      }
      this.setState({...this.state, loading: bool})
    })

  }

  componentWillUnmount() {
    this.renderer.close()
  }

  handleChange = (event, newValue) => {
    this.setState({
      ...this.state, 
      settingOne: newValue
    });
  };

  handleFractalChange = (event) => {
    this.setState({
      ...this.state,
      fractalNo: event.target.value,
    })
  };

  handleChangeComplete = () => {
    this.setState({ ...this.state, finalColor: this.state.color });
  };

  handleColorChange = (color) => {
    this.setState({ ...this.state, color: color.hex });
  };

  render() {
    
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignContent: 'center',
        alignItems: 'flex-start',
      }}>
        <div>
          <div style={{border: '1px solid black'}}> 
            <div style={{display: 'flex', justifyContent: 'center', alignItems:'center'}}>
              {this.state.firstLoading ? <CircularProgress color="inherit" style={{position: 'absolute'}}/> : ''}
              <canvas ref="canvas" style={{visibility: this.state.visible ? 'visible' : 'hidden' }} width={this.state.width} height={this.state.height}  />
            </div>
          </div>
         
          { (this.state.loading && !this.state.firstLoading) ? <LinearProgress />  : ''}
        </div>
        
          <div>
          <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
              <Typography>Choose Fractals to show</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                    <Select
                      value={this.state.fractalNo}
                      onChange={this.handleFractalChange}
                    >
                    <MenuItem value={this.state.fractalNo}>Zbiór Mandelbrota</MenuItem>
                    <MenuItem value={this.state.fractalNo}>Zbiory Julii</MenuItem>
                  </Select>
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
              <Typography>Slider option placeholder</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  This is basic explanation of how this setting work. XXXXXXXXXXXXXXX
                  <Slider value={this.state.settingOne} onChange={this.handleChange}/>
                </Typography>
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
              >
                <Typography>Color-picker placeholder</Typography>
              </AccordionSummary>
              <AccordionDetails>
                    <SketchPicker
                      color={ this.state.color }
                      onChange= { this.handleColorChange }
                      onChangeComplete={ this.handleChangeComplete }
                    />
              </AccordionDetails>
            </Accordion>
          </div>
          
      </div> 
        
    )
  }
}

export default Fractal;