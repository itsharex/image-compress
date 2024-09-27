use std::fs;
use std::path::Path;
use std::ffi::OsStr;
use serde::Serialize;
use serde::Deserialize;
use imagesize;
use libvips::{ops, VipsImage, VipsApp};

#[derive(Serialize)]
pub struct ImageInfo {
    #[serde(rename = "fileName")]
    file_name: String,
    #[serde(rename = "filePath")]
    file_path: String,
    #[serde(rename = "fileExtension")]
    extension: String,
    #[serde(rename = "fileSize")]
    file_size: u64,
}

#[derive(Deserialize, Debug)]
pub struct CompressOptions {
    width: Option<u32>,
    height: Option<u32>,
    formats: Vec<String>,
    quality: Option<u8>,
    overwrite: Option<bool>,
}


// 受支持的图片格式列表
const SUPPORTED_IMAGE_FORMATS: &[&str] = &["png", "jpg", "jpeg", "svg", "webp"];


// 获取图片信息
fn get_image_info_from_path(path: &Path) -> Option<ImageInfo> {
    if let Ok(metadata) = fs::metadata(&path) {
        // 将后缀名转小写
        if let Some(extension) = path.extension().and_then(OsStr::to_str) {
          // 先判断文件类型是不是图片
          if !SUPPORTED_IMAGE_FORMATS.contains(&extension.to_lowercase().as_str()) {
            return None;
          }
                return Some(ImageInfo {
                    file_name: path.file_name().unwrap().to_string_lossy().to_string(),
                    file_path: path.to_string_lossy().to_string(),
                    extension: extension.to_string(),
                    file_size: metadata.len(),
                });
        }
    }
    None
}

fn read_directory(path: &Path) -> Vec<ImageInfo> {
    let mut image_files_info = Vec::new();
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries {
            if let Ok(entry) = entry {
                let entry_path = entry.path();
                if entry_path.is_file() {
                    if let Some(info) = get_image_info_from_path(&entry_path) {
                        image_files_info.push(info);
                    }
                } else if entry_path.is_dir() {
                    // 递归查找子目录
                    let sub_dir_files = read_directory(&entry_path);
                    image_files_info.extend(sub_dir_files);
                }
            }
        }
    }
    image_files_info
}

#[tauri::command]
pub fn read_image_files(file_paths: Vec<String>) -> Vec<ImageInfo> {
    let mut all_image_files_info = Vec::new();
    for file_path in file_paths {
        let path = Path::new(&file_path);
        if path.is_file() {
            if let Some(info) = get_image_info_from_path(&path) {
                all_image_files_info.push(info);
            }
        } else if path.is_dir() {
            let dir_files_info = read_directory(&path);
            all_image_files_info.extend(dir_files_info);
        }
    }
    all_image_files_info
}

#[tauri::command]
pub fn get_image_dimensions(file_path: String) -> Result<(usize, usize), String> {
    use std::time::Instant;

    let start_time = Instant::now();
    // 使用Image模块获取图片宽高
    let path = Path::new(&file_path);
    if path.is_file() {
        match imagesize::size(path) {
          Ok(size) => {
            let duration = start_time.elapsed().as_millis();
            println!("获取图片尺寸耗时: {}ms", duration);
            Ok((size.width, size.height))
          },
          Err(why) => Err(format!("Failed to open image: {}", why))
      }
    } else {
        Err("Provided path is not a file".to_string())
    }
}

#[tauri::command(async)]
pub fn compress_image(file_path: String, options: CompressOptions) -> Result<bool, String> {
  println!("compress_image: {:?}", options);
  let mut image = VipsImage::new_from_file(&file_path).unwrap();
  // 获取文件后缀
  let extension = Path::new(&file_path).extension().unwrap_or_default().to_string_lossy();
  // 如果传入了宽高，则启用调整尺寸
  if options.width.is_some() && options.height.is_some() {
    let width = options.width.unwrap();
    let height = options.height.unwrap();
    image = ops::thumbnail_image_with_opts(&image, width as i32, &ops::ThumbnailImageOptions{
      height: height as i32,
      ..ops::ThumbnailImageOptions::default()
    }).unwrap();
  }
  for format in options.formats {
    if format == "png" {
      match ops::pngsave_with_opts(&image, "a.png", &ops::PngsaveOptions{
        q: options.quality.unwrap_or(80) as i32,
        ..ops::PngsaveOptions::default()
      }) {
        Ok(_) => {
          println!("保存成功");
        },
        Err(why) => {
          println!("保存失败: {}", why);
        }
      }
    }
  }
    return Ok(true)
}
