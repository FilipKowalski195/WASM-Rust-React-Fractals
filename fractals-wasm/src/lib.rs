#![feature(wasm_simd)]
mod math;

extern crate wasm_bindgen;
extern crate web_sys;
extern crate console_error_panic_hook;
use std::panic;

use wasm_bindgen::prelude::*;
use math::{FractalGenerator, Generator, FractalConfig};
use math::mandelbrot::MandelbrotGenerator;
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
pub fn greet() {

    console_error_panic_hook::set_once();

    let perf = window()
        .expect("Window expected")
        .performance()
        .expect("Performance expected");

    let time = perf.now();

    let gen = Generator::MANDELBROT.create();

    let conf = FractalConfig {
        start_re: -1.45,
        end_re: 2.0,
        re_steps: 2000,

        start_im: 0.0043,
        end_im: 1.0,
        im_steps: 1000,

        max_iters: 500
    };

    let result = gen.generate(&conf);


    alert(&(perf.now() - time).to_string());
    alert(&result[0].iterations.to_string());
}
