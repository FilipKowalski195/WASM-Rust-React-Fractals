#![feature(wasm_simd)]
mod math;
mod color;

extern crate wasm_bindgen;
extern crate web_sys;
extern crate console_error_panic_hook;

use wasm_bindgen::prelude::*;
use math::{FractalGenerator, Generator, FractalConfig};
use color::{GrayscaleTransformation, ColorTransformation};
use web_sys::window;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn generate_test() -> Vec<u8> {

    let conf = FractalConfig {
        start_re: -1.0,
        end_re: 2.0,
        re_steps: 1250,

        start_im: -1.0,
        end_im: 1.0,
        im_steps: 62,

        max_iters: 500,
    };

    let colors = GrayscaleTransformation {};

    let gen = Generator::MANDELBROT.create();
    let data = gen.generate(&conf);

    return colors.transform(data, conf.max_iters);
}