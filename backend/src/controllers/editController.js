// backend/controllers/editController.js
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../utils/supabaseClient');
const { spawn } = require('child_process');

exports.processEditRequest = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Received file:', req.file);

    // Parse the request body
    const {
      videoUrl,
      trimStart,
      trimEnd,
      isMuted,
      overlayText,
      overlayPosition,
      overlayColor,
      overlaySize
    } = req.body;

    if (!videoUrl) {
      throw new Error('Video URL is required');
    }

    // Parse JSON strings back to objects
    const parsedOverlayPosition = overlayPosition ? JSON.parse(overlayPosition) : { x: 50, y: 50 };
    const parsedTrimStart = parseFloat(trimStart) || 0;
    const parsedTrimEnd = parseFloat(trimEnd) || 0;
    const parsedIsMuted = isMuted === 'true';
    const parsedOverlaySize = parseInt(overlaySize) || 24;

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true, mode: 0o755 });
    }

    // Ensure temp directory is writable
    try {
      fs.accessSync(tempDir, fs.constants.W_OK);
    } catch (err) {
      throw new Error(`Temp directory is not writable: ${tempDir}`);
    }

    // Step 1: Download the video
    const inputPath = path.join(tempDir, `input-${uuidv4()}.mp4`);
    const outputPath = path.join(tempDir, `output-${uuidv4()}.mp4`);
    
    // Normalize paths for FFmpeg
    const normalizedInputPath = inputPath.replace(/\\/g, '/');
    const normalizedOutputPath = outputPath.replace(/\\/g, '/');
    const writer = fs.createWriteStream(normalizedInputPath);
    const response = await axios.get(videoUrl, { responseType: 'stream' });
    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Handle thumbnail if provided
    let thumbnailUrl = null;
    if (req.file) {
      const thumbnailPath = req.file.path;
      const thumbnailFilename = `thumbnails/${uuidv4()}.jpg`;
      
      // Upload thumbnail to Supabase
      const thumbnailBuffer = fs.readFileSync(thumbnailPath);
      const { error: thumbnailError } = await supabase.storage
        .from('video')
        .upload(thumbnailFilename, thumbnailBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (thumbnailError) {
        throw thumbnailError;
      }

      const { data: { publicUrl } } = supabase
        .storage
        .from('video')
        .getPublicUrl(thumbnailFilename);

      thumbnailUrl = publicUrl;

      // Clean up thumbnail file
      try {
        fs.unlinkSync(thumbnailPath);
      } catch (cleanupError) {
        console.error('Thumbnail cleanup error:', cleanupError);
      }
    }

    // Step 2: Apply FFmpeg processing
    const duration = Math.max(0, parsedTrimEnd - parsedTrimStart);

    // Use absolute paths with forward slashes for FFmpeg
    const tempDirResolved = path.resolve(process.cwd(), 'temp').replace(/\\/g, '/');
    if (!fs.existsSync(tempDirResolved)) {
      fs.mkdirSync(tempDirResolved, { recursive: true, mode: 0o755 });
    }

    // Use simpler file names for FFmpeg
    const simpleInputPath = path.join(tempDirResolved, 'input.mp4').replace(/\\/g, '/');
    const simpleOutputPath = path.join(tempDirResolved, 'output.mp4').replace(/\\/g, '/');

    // Copy input file to simple name
    fs.copyFileSync(normalizedInputPath, simpleInputPath);

    // Ensure output directory exists and is writable
    const outputDir = path.dirname(simpleOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true, mode: 0o755 });
    }

    // Create an empty output file to ensure we have write permissions
    try {
      if (fs.existsSync(simpleOutputPath)) {
        fs.unlinkSync(simpleOutputPath);
      }
      fs.writeFileSync(simpleOutputPath, '');
      fs.unlinkSync(simpleOutputPath);
    } catch (err) {
      throw new Error(`Cannot write to output path: ${simpleOutputPath}. Error: ${err.message}`);
    }

    // Build the filter chain
    let filterChain = [];
    
    // Add text overlay if text is specified
    if (overlayText) {
      const fontPath = 'C:/Windows/Fonts/arial.ttf';
      if (!fs.existsSync(fontPath)) {
        throw new Error(`Font file not found: ${fontPath}`);
      }
      const fontSize = parsedOverlaySize;
      const fontColor = overlayColor.replace('#', '');
      
      // Calculate position based on percentage
      const xPos = `x=(w*${parsedOverlayPosition.x}/100)-text_w/2`;
      const yPos = `y=(h*${parsedOverlayPosition.y}/100)-text_h/2`;
      
      // Properly escape the text and font path for FFmpeg
      const escapedText = overlayText.replace(/'/g, "\\'").replace(/:/g, "\\:");
      const escapedFontPath = fontPath.replace(/\\/g, '/').replace(/:/g, "\\:");
      
      filterChain.push(`drawtext=fontfile='${escapedFontPath}':text='${escapedText}':fontcolor=${fontColor}:fontsize=${fontSize}:${xPos}:${yPos}`);
    }
    
    // Join all filters with commas
    const filterString = filterChain.join(',');
    
    const ffmpegArgs = [
      '-i', simpleInputPath
    ];
    
    // Add trim options if specified
    if (parsedTrimStart > 0) {
      ffmpegArgs.push('-ss', parsedTrimStart.toString());
    }
    
    if (parsedTrimEnd > parsedTrimStart) {
      const duration = parsedTrimEnd - parsedTrimStart;
      ffmpegArgs.push('-t', duration.toString());
    }
    
    // Add filter if we have any filters
    if (filterChain.length > 0) {
      ffmpegArgs.push('-vf', filterString);
    }
    
    // Add audio codec and output path
    ffmpegArgs.push('-codec:a', 'copy', simpleOutputPath);
    
    console.log('Running FFmpeg with args:', ffmpegArgs.join(' '));

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ffmpegArgs);

      ffmpeg.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      ffmpeg.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });
    });

    // Copy the processed file to the final location
    fs.copyFileSync(simpleOutputPath, normalizedOutputPath);
    // Clean up temporary files
    try {
      fs.unlinkSync(simpleInputPath);
      fs.unlinkSync(simpleOutputPath);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    // Step 3: Upload the processed video to Supabase
    const fileBuffer = fs.readFileSync(normalizedOutputPath);
    const outputFilename = `processed/${uuidv4()}.mp4`;

    const { error: uploadError } = await supabase.storage
      .from('video')
      .upload(outputFilename, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('video')
      .getPublicUrl(outputFilename);

    // Cleanup temp files
    try {
      fs.unlinkSync(normalizedOutputPath);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    // Step 4: Respond
    res.json({
      success: true,
      message: 'Video processed successfully',
      videoUrl: publicUrl,
      thumbnailUrl: thumbnailUrl
    });

  } catch (err) {
    console.error('Processing Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Video processing failed',
      error: err
    });
  }
};
