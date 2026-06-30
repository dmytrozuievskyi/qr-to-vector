# QR to Vector Converter

A lightweight web app that converts raster QR codes into clean, vector files (EPS, SVG) and high-resolution PNGs.

It was built to fix the problem of tracing raster QR codes, which usually results in rounded corners and messy paths. This tool recreates the exact square grid matrix as perfect vector polygons, making the output ideal for CNC milling, laser engraving, or making metal stamps.

## Features
- Runs completely offline in the browser.
- Automatically reverses perspective deformations from uploaded images.
- **Fallback generation:** If the image quality is too poor to trace, the tool can try to scan the QR code's data link and regenerate a brand new, perfect QR code from scratch.
- **Flexible manual grid:** The manual grid override isn't just for QR codes—you can use it to convert almost any regular square-based pattern (like pixel art) into a perfect vector grid.
- Exports to EPS, SVG, and high-res PNG.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
