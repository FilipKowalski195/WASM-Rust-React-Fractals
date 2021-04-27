
const wasm = import('fractals-wasm')


onmessage = function (e) {

    wasm.then(({generate_frame_part_mandelbrot}) => {
        const scaling = e.data.scaling;
        const partNum = e.data.partNum;
        const partCount = e.data.partCount;
        const maxIters = e.data.maxIters

        const data = generate_frame_part_mandelbrot(
            Uint32Array.from(e.data.res),
            Float64Array.from(e.data.plane),
            scaling,
            partNum,
            partCount,
            maxIters
        );

        const height = e.data.res[1];

        postMessage({
            data: data,
            x: 0,
            y:  partNum * Math.floor(height / partCount),
            width: e.data.res[0],
            height: Math.floor(partNum === partCount && height % partCount !== 0 ? height % partCount : height / partCount)
        });
    })
}
