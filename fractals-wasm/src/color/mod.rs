use math::FractalPoint;
use wasm_bindgen::UnwrapThrowExt;
use palette::{Hsv, rgb::Srgb};

pub trait ColorTransformation {

    fn determine_color(&self, point: &FractalPoint, max_iters: usize) -> (u8, u8, u8);

    fn transform(
        &self,
        points: Vec<FractalPoint>,
        max_iters: usize,
        width: usize,
        height: usize,
        scaling: usize
    ) -> Vec<u8> {
        let mut image_data = Vec::with_capacity(4 * scaling * scaling * points.len());

        for y in 0..height {

            for _ in 0..scaling {

                for x in 0..width {

                    let point_index = width * y + x;

                    let (r, g, b) = self.determine_color(
                        points.get(point_index).expect("Point out of bounds!"),
                        max_iters
                    );

                    for _ in 0..scaling {
                        image_data.push(r);
                        image_data.push(g);
                        image_data.push(b);
                        image_data.push(255);
                    }
                }
            }
        }

        return image_data;
    }
}

pub struct HsvBasedColorTransformation;

fn hsv_to_rgb(h: f32, s: f32, v: f32) -> (u8, u8, u8) {
    let color_hsv = Hsv::new(h, s, v);
    let color_rgb = Srgb::from(color_hsv);

    return (
        (color_rgb.red * 255.0) as u8,
        (color_rgb.green * 255.0) as u8,
        (color_rgb.blue * 255.0) as u8
    )
}

impl ColorTransformation for HsvBasedColorTransformation {

    fn determine_color(&self, point: &FractalPoint, max_iters: usize) -> (u8, u8, u8) {
        return if point.iterations == max_iters {
            (0, 0, 0)
        } else {
            let iterations = point.iterations << 2;
            let modifier = iterations as f32 / 1000.0;

            hsv_to_rgb(
                modifier * 360.0, 1.0, 1.0
            )
        }
    }
}