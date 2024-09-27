// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod commands;
use commands::read_image_files;
use commands::get_image_dimensions;
use commands::compress_image;
use libvips::VipsApp;

fn main() {
  let app = VipsApp::new("Test Libvips", false).expect("Cannot initialize libvips");
    //set number of threads in libvips's threadpool
    app.concurrency_set(2 * std::thread::available_parallelism().unwrap().get() as i32);
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            read_image_files,
            get_image_dimensions,
            compress_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
