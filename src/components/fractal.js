import React, { Component } from "react";
import FractalsRenderer from "../fractals/FractalsRenderer";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Avatar,
    Button,
    CircularProgress,
    Collapse,
    LinearProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    MenuItem,
    Select, TextField,
    Typography
} from '@material-ui/core';
import { SketchPicker } from 'react-color';
import MemoryIcon from '@material-ui/icons/Memory';
import { hex2Hsv, hsv2Hex } from 'colorsys'

class Fractal extends Component {

    state = {
        width: 0,
        height: 0,
        settingOne: 50,
        fractalNo: 0,
        color: '#ff0000',
        loading: true,
        firstLoading: true,
        visible: false,
        mode: 'Hue',
        juliaRPoint: 0.285,
        juliaIPoint: 0.1
    }

    progressTimeoutId = null;

    renderer = new FractalsRenderer(
        window.screen.availWidth / window.screen.availHeight,
        window.screen.availHeight * 0.83
    );

    componentDidMount() {
        const { h, s, v } = this.renderer.setup.color
        this.setState({
            width: this.renderer.getWidth(),
            height: this.renderer.getHeight(),
            color: hsv2Hex({ h, s: s * 100, v: v * 100 })
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
                this.setState({ ...this.state, loading: true })
            } else {
                this.progressTimeoutId = setTimeout(() => {
                    this.setState({ ...this.state, loading: false })
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

    handleColorChange = (color) => {
        this.setState({ ...this.state, color: color.hex });
        const { h, s, v } = hex2Hsv(color.hex)
        console.log(color.hex, h, s, v)
        this.renderer.setup.color.h = h
        this.renderer.setup.color.s = s / 100
        this.renderer.setup.color.v = v / 100
        this.renderer.invalidate()
    };

    handleChangeMode = (event) => {
        this.setState({ ...this.state, mode: event.target.value })
        this.renderer.setup.color.mode = event.target.value
        this.renderer.invalidate()
    }

    handleRChange = event => {
        this.setState({...this.state, juliaRPoint: event.target.value})
    }

    handleIChange = event => {
        this.setState({...this.state, juliaIPoint: event.target.value})
    }

    handlePointChange = () => {
        this.renderer.setup.fractal.point = [this.state.juliaRPoint, this.state.juliaIPoint]
        this.renderer.invalidate()
    }

    render() {

        return (
            <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignContent: 'center',
                alignItems: 'flex-start',
            }}>
                <div>
                    <div style={{ border: '1px solid black' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {this.state.firstLoading ?
                                <CircularProgress color="inherit" style={{ position: 'absolute' }}/> : ''}
                            <canvas ref="canvas" style={{ visibility: this.state.visible ? 'visible' : 'hidden' }}
                                    width={this.state.width} height={this.state.height}/>
                        </div>
                    </div>

                    {(
                        this.state.loading && !this.state.firstLoading) ? <LinearProgress/> : ''}
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

                                <Collapse in={this.state.fractalNo}>
                                    <TextField
                                        id="standard-number"
                                        label="Number"
                                        type="number"
                                        value={this.state.juliaRPoint}
                                        onChange={this.handleRChange}
                                    />
                                    <TextField
                                        id="standard-number"
                                        label="Number"
                                        type="number"
                                        value={this.state.juliaIPoint}
                                        onChange={this.handleIChange}
                                    />
                                        <Button onClick={this.handlePointChange} >Change point</Button>
                                </Collapse>

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
                                                    <MemoryIcon/>
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={`Thread ${it.id}`}
                                                secondary={`Preview time ${parseInt(it.scaledMs)} full time: ${parseInt(it.fullResMs)}`}/>
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
                        <AccordionDetails style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexFlow: 'column wrap',

                        }}>
                            <SketchPicker
                                style={{ margin: '10px' }}
                                color={this.state.color}
                                onChange={this.handleColorChange}
                                disableAlpha={true}
                            />
                            <Select
                                style={{ margin: '10px' }}
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                value={this.state.mode}
                                onChange={this.handleChangeMode}
                            >
                                <MenuItem value={'Value'}>Value</MenuItem>
                                <MenuItem value={'Hue'}>Hue</MenuItem>
                                <MenuItem value={'Saturation'}>Saturation</MenuItem>
                            </Select>
                        </AccordionDetails>

                    </Accordion>
                </div>

            </div>

        )
    }

}

export default Fractal;