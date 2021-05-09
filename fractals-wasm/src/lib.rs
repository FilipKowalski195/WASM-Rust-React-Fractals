mod math;
mod color;

extern crate wasm_bindgen;
extern crate web_sys;
extern crate console_error_panic_hook;
extern crate palette;

use wasm_bindgen::prelude::*;
use math::{Generator, FractalConfig};
use color::{ColorTransformation, HsvBasedColorTransformation};
use web_sys::window;
use std::cmp::max;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[derive(Copy, Clone)]
pub struct Resolution {
    pub width: usize,
    pub height: usize,
}

impl Resolution {
    pub fn new(width: usize, height: usize) -> Self {
        Resolution {
            width, height
        }
    }
}

#[derive(Copy, Clone)]
pub struct ComplexPlaneRange {
    pub start_im: f64,
    pub end_im: f64,

    pub start_re: f64,
    pub end_re: f64
}

impl ComplexPlaneRange {

    pub fn new(start_im: f64, end_im: f64, start_re: f64, end_re: f64) -> Self {
        ComplexPlaneRange {
            start_im, end_im, start_re, end_re
        }
    }
}

pub struct FramePartConfig {
    pub res: Resolution,
    pub plane: ComplexPlaneRange,
    pub scaling: usize,
    pub part_num: usize,
    pub part_count: usize,
    pub max_iters: usize,
}

impl FramePartConfig {
    fn is_last_leftover(&self) -> bool {
        self.res.height % self.part_count != 0 && self.part_num == self.part_count
    }

    fn height_split(&self) -> usize {
        self.descaled_height() / self.part_count
    }

    fn height_leftover(&self) -> usize {
        self.descaled_height() % self.part_count
    }

    fn descaled_width(&self) -> usize {
        if self.res.width % self.scaling != 0 {
            panic!("Width must be divisible by scaling!")
        }

        return self.res.width / self.scaling;
    }

    fn descaled_height(&self) -> usize {
        if self.res.height % self.scaling != 0 {
            panic!("Height must be divisible by scaling!")
        }

        return self.res.height / self.scaling;
    }

    fn frame_height(&self) -> usize {
        return if self.is_last_leftover() {
            self.height_leftover()
        } else {
            self.height_split()
        };
    }

    fn frame_complex_plane(&self) -> ComplexPlaneRange {
        let frame_height = self.frame_height();
        let current_factor = frame_height as f64 / self.descaled_height() as f64;
        let im_length = (self.plane.end_im - self.plane.start_im) * current_factor;

        let factor = (self.part_num * self.height_split()) as f64 / self.descaled_height() as f64;
        let im_start = (self.plane.end_im - self.plane.start_im) * factor;

        return ComplexPlaneRange {
            start_im: self.plane.start_im + im_start,
            end_im: self.plane.start_im + im_start + im_length,
            start_re: self.plane.start_re,
            end_re: self.plane.end_re
        }
    }
}

#[wasm_bindgen]
pub fn generate_frame_part_julia(
    resolution: Vec<usize>,
    plane: Vec<f64>,
    scaling: usize,
    part_num: usize,
    part_count: usize,
    max_iters: usize,
    p_point: Vec<f64>
) -> Vec<u8> {
    let conf = FramePartConfig {
        res: Resolution { width: resolution[0], height: resolution[1] },
        plane: ComplexPlaneRange {
            start_re: plane[0],
            end_re: plane[1],
            start_im: plane[2],
            end_im: plane[3],
        },
        scaling,
        part_num,
        part_count,
        max_iters,
    };

    return generate_frame_part(conf, Generator::JULIA(p_point[0], p_point[1]))
}

#[wasm_bindgen]
pub fn generate_frame_part_mandelbrot(
    resolution: Vec<usize>,
    plane: Vec<f64>,
    scaling: usize,
    part_num: usize,
    part_count: usize,
    max_iters: usize,
) -> Vec<u8> {
    let conf = FramePartConfig {
        res: Resolution { width: resolution[0], height: resolution[1] },
        plane: ComplexPlaneRange {
            start_re: plane[0],
            end_re: plane[1],
            start_im: plane[2],
            end_im: plane[3],
        },
        scaling,
        part_num,
        part_count,
        max_iters,
    };

    return generate_frame_part(conf, Generator::MANDELBROT)
}

fn generate_frame_part(config: FramePartConfig, generator: Generator) -> Vec<u8> {
    if config.res.height % config.scaling != 0 {
        panic!("Height must be divisible by scaling!")
    }

    let gen = generator.create();
    let frame_plane = config.frame_complex_plane();

    let f_conf = FractalConfig {
        start_re: frame_plane.start_re,
        end_re: frame_plane.end_re,
        re_steps: config.descaled_width(),

        start_im: frame_plane.start_im,
        end_im: frame_plane.end_im,
        im_steps: config.frame_height(),

        max_iters: config.max_iters,
    };

    let result = gen.generate(&f_conf);

    let trans = HsvBasedColorTransformation{};

    let colored = trans.transform(
        result,
        f_conf.max_iters,
        config.descaled_width(),
        config.frame_height(),
        config.scaling
    );

    return colored;
}