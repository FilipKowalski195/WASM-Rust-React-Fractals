import React, {Component} from "react";
import FractalsRenderer from "../fractals/FractalsRenderer";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Avatar,
    Button, Checkbox,
    CircularProgress,
    Collapse, FormControl, FormControlLabel, InputLabel,
    LinearProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    MenuItem,
    Select, Slider, TextField,
    Typography
} from '@material-ui/core';
import {SketchPicker} from 'react-color';
import MemoryIcon from '@material-ui/icons/Memory';
import {hex2Hsv, hsv2Hex} from 'colorsys'

class Fractal extends Component {

    minIters = 100
    maxIters = 10_000

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
        juliaIPoint: 0.01,
        expanded: "",
        smooth: true,
        smoothOnPreview: true,
        itersValue: 0,
    }

    progressTimeoutId = null;

    renderer = new FractalsRenderer(
        window.screen.availWidth / window.screen.availHeight,
        window.screen.availHeight * 0.80
    );

    componentDidMount() {
        const {h, s, v} = this.renderer.setup.color
        this.setState({
            width: this.renderer.getWidth(),
            height: this.renderer.getHeight(),
            color: hsv2Hex({h, s: s * 100, v: v * 100}),
            smooth: this.renderer.setup.color.smooth,
            smoothOnPreview: this.renderer.setup.color.smoothOnPreview,
            itersValue: this.renderer.setup.maxIters
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
        this.setState({...this.state, color: color.hex});
        const {h, s, v} = hex2Hsv(color.hex)

        this.renderer.setup.color.h = h
        this.renderer.setup.color.s = s / 100
        this.renderer.setup.color.v = v / 100
        this.renderer.invalidate()
    };

    handleChangeMode = (event) => {

        let h = 359, s = 1.0, v = 1.0;

        switch (event.target.value) {
            case "Value": {
                h = 200;
                s = 1.0;
                v = 1.0;
                break;
            }
            case "Saturation": {
                h = 100;
                s = 1.0;
                v = 1.0;
                break;
            }
        }

        this.setState({
            ...this.state,
            mode: event.target.value,
            color: hsv2Hex({h, s: s * 100, v: v * 100})
        })

        this.renderer.setup.color.mode = event.target.value
        this.renderer.setup.color.h = h;
        this.renderer.setup.color.s = s;
        this.renderer.setup.color.v = v;

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

    handleExpand = panel => (event, isExpanded) => {
        this.setState({...this.state, expanded: isExpanded ? panel : "" })
    }

    handleSmoothChange = event => {
        let preview = this.renderer.setup.color.smoothOnPreview;
        this.renderer.setup.color.smoothOnPreview = !event.target.checked ? false : preview
        preview = this.renderer.setup.color.smoothOnPreview;

        this.setState({
            ...this.state,
            smooth: event.target.checked,
            smoothOnPreview: preview
        });
        this.renderer.setup.color.smooth = event.target.checked;
        this.renderer.invalidate();
    }

    handleSmoothOnPreviewChange = event => {
        this.setState({ ...this.state, smoothOnPreview: event.target.checked });
        this.renderer.setup.color.smoothOnPreview = event.target.checked;
        this.renderer.invalidate();
    }

    handleIterationsChangeBySlider = (event, value) => {
        const iters = value

        this.setState({...this.state, itersValue: iters});
        this.renderer.setup.maxIters = iters;
        this.renderer.invalidate();
    }

    filteredItersValue() {
        let value;

        if (typeof this.state.itersValue !== "number") {
            value = 0;
        } else {
            value = this.state.itersValue
        }

        return Math.min(Math.max(value, this.minIters), this.maxIters);
    }

    handleIterationsChangeByField = (event) => {
        const iters = parseInt(event.target.value)

        this.setState({...this.state, itersValue: iters});

        if (isNaN(iters) || iters < this.minIters || iters > this.maxIters) {
            return
        }

        this.renderer.setup.maxIters = iters;
        this.renderer.invalidate();
    }

    handleItersBlur = () => {
        this.setState({...this.state, itersValue: this.filteredItersValue()})
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
                    <div style={{border: '1px solid black'}}>
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            {this.state.firstLoading ? <CircularProgress color="inherit" style={{position: 'absolute'}}/> : ''}
                            <canvas ref="canvas" style={{visibility: this.state.visible ? 'visible' : 'hidden'}}
                                    width={this.state.width} height={this.state.height}/>
                        </div>
                    </div>

                    {(
                        this.state.loading && !this.state.firstLoading) ? <LinearProgress/> : ''}
                </div>
                <div>
                    <Accordion
                        expanded={this.state.expanded === "panel1"}
                        onChange={this.handleExpand("panel1")}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}
                        >
                            <Typography>Fractals settings</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                <Typography id="iterations-label">
                                    Iterations
                                </Typography>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    flexFlow: "row",
                                    marginBottom: "10px"
                                }}>
                                    <Slider
                                        onChange={this.handleIterationsChangeBySlider}
                                        value={this.filteredItersValue()}
                                        aria-labelledby="iterations-label"
                                        valueLabelDisplay="auto"
                                        step={1}
                                        min={this.minIters}
                                        max={this.maxIters}
                                        style={{
                                            flexShrink: 2,
                                            marginRight: '10px'
                                        }}
                                    />
                                    <TextField
                                        type="number"
                                        value={this.state.itersValue}
                                        onChange={this.handleIterationsChangeByField}
                                        onBlur={this.handleItersBlur}
                                        style={{
                                            flexShrink: 2
                                        }}
                                    />
                                </div>
                                <FormControl variant="filled"
                                             style={{width: '100%'}}>
                                    <InputLabel id="fractals-label">Fractal</InputLabel>
                                    <Select
                                        value={this.state.fractalNo}
                                        onChange={this.handleFractalChange}
                                        labelId="fractals-label"
                                        variant="filled"
                                        style={{
                                            width: '100%'
                                        }}
                                    >
                                        <MenuItem value={0}>Mandelbrot set</MenuItem>
                                        <MenuItem value={1}>Julia sets</MenuItem>
                                    </Select>
                                </FormControl>

                                <Collapse in={this.state.fractalNo}>
                                    <TextField
                                        id="standard-number"
                                        label="Real part"
                                        type="number"
                                        style={{
                                            width: '100%'
                                        }}
                                        variant="filled"
                                        value={this.state.juliaRPoint}
                                        onChange={this.handleRChange}
                                    />
                                    <TextField
                                        id="standard-number"
                                        label="Imaginary part"
                                        type="number"
                                        variant="filled"
                                        style={{
                                            width: '100%'
                                        }}
                                        value={this.state.juliaIPoint}
                                        onChange={this.handleIChange}

                                    />
                                    <Button
                                        variant="contained"
                                        onClick={this.handlePointChange}
                                        style={{
                                            width: '100%'
                                        }}
                                    >
                                        Apply
                                    </Button>
                                </Collapse>

                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                    <Accordion
                        expanded={this.state.expanded === "panel2"}
                        onChange={this.handleExpand("panel2")}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}>
                            <Typography>Coloring settings</Typography>
                        </AccordionSummary>

                        <AccordionDetails style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexFlow: 'column wrap',
                        }}>

                            <div style={{ width: "100%" }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={this.state.smooth}
                                            onChange={this.handleSmoothChange}/>
                                    }
                                    label="Smoothing"
                                />

                                <Collapse in={this.state.smooth}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                disabled={!this.state.smooth}
                                                checked={this.state.smoothOnPreview}
                                                onChange={this.handleSmoothOnPreviewChange}/>
                                        }
                                        label="Smoothing on preview"
                                    />
                                </Collapse>
                            </div>
                            <FormControl variant="filled"
                                         style={{
                                             marginBottom: '10px',
                                             width: '100%',
                                         }}>
                                <InputLabel id="mode-label">Mode</InputLabel>
                                <Select
                                    labelId="mode-label"
                                    value={this.state.mode}
                                    onChange={this.handleChangeMode}
                                >
                                    <MenuItem value={'Hue'}>Hue</MenuItem>
                                    <MenuItem value={'Saturation'}>Saturation</MenuItem>
                                    <MenuItem value={'Value'}>Value</MenuItem>
                                </Select>
                            </FormControl>

                            <SketchPicker
                                style={{margin: '10px'}}
                                color={this.state.color}
                                onChange={this.handleColorChange}
                                disableAlpha={true}
                            />
                        </AccordionDetails>

                    </Accordion>
                    <Accordion
                        expanded={this.state.expanded === "panel3"}
                        onChange={this.handleExpand("panel3")}>
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
                                                secondary={<div>
                                                    <div>Preview time: {parseInt(it.scaledMs)} ms</div>
                                                    <div>Full time: {parseInt(it.fullResMs)} ms</div>
                                                </div>}/>
                                        </ListItem>
                                    )
                                })}
                            </List>

                        </AccordionDetails>
                    </Accordion >
                </div>
            </div>

        )
    }
}

export default Fractal;