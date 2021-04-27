use math::FractalPoint;
use wasm_bindgen::UnwrapThrowExt;

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

pub struct GrayscaleTransformation;

impl ColorTransformation for GrayscaleTransformation {
    fn determine_color(&self, point: &FractalPoint, max_iters: usize) -> (u8, u8, u8) {
        let greyscale = ((point.iterations as f64 / max_iters as f64).floor() * 255.0) as u8;

        return (greyscale, greyscale, greyscale)
    }
}

pub struct ElectricBlue;

// impl ColorTransformation for ElectricBlue{
//     fn determine_color(&self, point: &FractalPoint, max_iters: usize) -> (u8, u8, u8) {
//         for (i = 0; i < 255; i++) {
//             if (i < 32) {
//                 r = 0;
//                 g = 0;
//                 b = i * 4;
//             } else if (i < 64) {
//                 r = (i - 32) * 8;
//                 g = (i - 32) * 8;
//                 b = 127 + (i - 32) * 4;
//             } else if (i < 96) {
//                 r = 255 - (i - 64) * 8;
//                 g = 255 - (i - 64) * 8;
//                 b = 255 - (i - 64) * 4;
//             } else if (i < 128) {
//                 r = 0;
//                 g = 0;
//                 b = 127 - (i - 96) * 4;
//             } else if (i < 192) {
//                 r = 0;
//                 g = 0;
//                 b = (i - 128);
//             } else {
//                 r = 0;
//                 g = 0;
//                 b = 63 - (i - 192);
//             }
//             colours[i] = (r << 24) + (g << 16) + (b << 8);
//         }
//     }
// }
