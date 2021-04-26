use math::FractalPoint;
use std::cmp::max;

pub trait ColorTransformation {

    fn determine_color(&self, point: &FractalPoint, max_iters: usize) -> (u8, u8, u8, u8);

    fn transform(&self, points: Vec<FractalPoint>, max_iters: usize) -> Vec<u8> {
        let mut image_data = Vec::with_capacity(4 * points.len());

        for point in points.iter() {

            let (r, g, b, a) = self.determine_color(point, max_iters);

            image_data.push(r);
            image_data.push(g);
            image_data.push(b);
            image_data.push(a);
        }

        return image_data;
    }
}

pub struct GrayscaleTransformation;

impl ColorTransformation for GrayscaleTransformation {
    fn determine_color(&self, point: &FractalPoint, max_iters: usize) -> (u8, u8, u8, u8) {
        let greyscale = ((point.iterations as f64 / max_iters as f64).floor() * 255.0) as u8;

        return (greyscale, greyscale, greyscale, greyscale)
    }
}
