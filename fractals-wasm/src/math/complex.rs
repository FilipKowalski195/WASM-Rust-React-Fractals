#[derive(Copy, Clone)]
pub struct ComplexF64 {
    re: f64,
    im: f64,
}

impl ComplexF64 {

    pub fn new(re: f64, im: f64) -> ComplexF64 {
        ComplexF64 {
            re, im
        }
    }

    pub fn re(&self) -> f64 {
        self.re
    }
    pub fn im(&self) -> f64 {
        self.im
    }
}