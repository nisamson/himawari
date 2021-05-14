use std::process::Command;

fn main() {
    Command::new("yarn").args(&["build"])
        .current_dir(concat!(env!("CARGO_MANIFEST_DIR"), "/", "frontend"))
        .status().unwrap();
}