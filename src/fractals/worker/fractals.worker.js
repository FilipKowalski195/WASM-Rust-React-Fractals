const wasm = import('fractals-wasm')

onmessage = function (e) {
    wasm.then(({generate_frame_part_mandelbrot, generate_frame_part_julia}) => {
        const scaling = e.data.scaling;
        const partNum = e.data.partNum;
        const partCount = e.data.partCount;
        const maxIters = e.data.maxIters;
        const fullHeight = e.data.res[1];
        const type = e.data.fractal.type;
        const point = e.data.fractal.point;

        const partHeight = Math.floor(fullHeight / partCount);

        let data;

        if(type === "Mandelbrot") {
            data = generate_frame_part_mandelbrot(
                Uint32Array.from(e.data.res),
                Float64Array.from(e.data.plane),
                scaling,
                partNum,
                partCount,
                maxIters
            );
        } else {
            data = generate_frame_part_julia(
                Uint32Array.from(e.data.res),
                Float64Array.from(e.data.plane),
                scaling,
                partNum,
                partCount,
                maxIters,
                Float64Array.from(point)
            );
        }


        postMessage({
            data: data,
            x: 0,
            y:  partNum * partHeight,
            width: e.data.res[0],
            height: partHeight
        });
    })
}
