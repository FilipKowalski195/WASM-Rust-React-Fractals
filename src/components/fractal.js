import React, {Component} from "react";
import FractalsRenderer from "../fractals/FractalsRenderer";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {
    Slider,
    MenuItem,
    Select,
    LinearProgress,
    CircularProgress,
    Typography,
    AccordionDetails,
    AccordionSummary,
    Accordion, ListItem, ListItemAvatar, Avatar, ListItemText, List
} from '@material-ui/core';
import { SketchPicker } from 'react-color';
import MemoryIcon from '@material-ui/icons/Memory';

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

    progressTimeoutId = null;

    renderer = new FractalsRenderer(
        window.screen.availWidth / window.screen.availHeight,
        window.screen.availHeight * 0.83
    );

    componentDidMount() {

        this.setState({
            width: this.renderer.getWidth(),
            height: this.renderer.getHeight(),
        })

        this.renderer.injectCanvas(this.refs.canvas);
        this.renderer.init();

        this.renderer.addOnFetchingProgressChanged((progress) => {
            if (this.state.firstLoading && !progress) {
                this.setState({
                    ...this.state,
                    visible: true,
                    firstLoading: false,
                })
            }

            clearTimeout(this.progressTimeoutId)

            if (progress) {
                this.setState({...this.state, loading: true})
            } else {
                this.progressTimeoutId = setTimeout(() => {
                    this.setState({...this.state, loading: false})
                }, 100);
            }
        })

        this.renderer.addOnNewWorkerStats((stats) => {
            this.setState({
                ...this.state,
                stats
            })
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

        this.renderer.setup.fractal = {
            ...this.renderer.setup.fractal,
            type: this.state.fractalNo === 0 ? 'Julia' : 'Mandelbrot'
        }

        this.renderer.resetPlane()

        this.renderer.invalidate()
    };

    handleChangeComplete = () => {
        this.setState({...this.state, finalColor: this.state.color});
    };

    handleColorChange = (color) => {
        this.setState({...this.state, color: color.hex});
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
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            {this.state.firstLoading ?
                                <CircularProgress color="inherit" style={{position: 'absolute'}}/> : ''}
                            <canvas ref="canvas" style={{visibility: this.state.visible ? 'visible' : 'hidden'}}
                                    width={this.state.width} height={this.state.height}/>
                        </div>
                    </div>

                    {(this.state.loading && !this.state.firstLoading) ? <LinearProgress/> : ''}
                </div>

                <div>
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}
                        >
                            <Typography>Choose Fractals to show</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                <Select
                                    value={this.state.fractalNo}
                                    onChange={this.handleFractalChange}
                                >
                                    <MenuItem value={0}>Mandelbrot set</MenuItem>
                                    <MenuItem value={1}>Julia Set</MenuItem>
                                </Select>
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}
                        >
                            <Typography>Statistics</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List>
                                {this.state.stats?.map((it) => {
                                    return (

                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        <MemoryIcon />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={`Thread ${it.id}`}
                                                    secondary={`Preview time ${parseInt(it.scaledMs)} full time: ${parseInt(it.fullResMs)}`} />
                                            </ListItem>
                                    )
                                })}
                            </List>

                        </AccordionDetails>
                    </Accordion>
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}
                        >
                            <Typography>Color-picker placeholder</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <SketchPicker
                                color={this.state.color}
                                onChange={this.handleColorChange}
                                onChangeComplete={this.handleChangeComplete}
                            />
                        </AccordionDetails>
                    </Accordion>
                </div>

            </div>

        )
    }
}

export default Fractal;