import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import type { Express } from 'express'; // Import type to avoid TS errors for the file variable
import { UploadsService } from './uploads.service.js';
import { UploadChunkDto } from './dto/upload-chunk.dto.js';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    // 1. Configure storage destination
    storage: diskStorage({
      destination: (req, file, callback) => {
        const uploadPath = './public/uploads';
        // Automatically create the directory if it doesn't exist
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        callback(null, uploadPath);
      },
      filename: (req, file, callback) => {
        // Generate a random filename to prevent overwriting (e.g., 16999999-999999.jpg)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      }
    }),
    // 2. Validate to allow only image files
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new BadRequestException('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
    // 3. Limit maximum file size to 5MB
    limits: {
      fileSize: 5 * 1024 * 1024, 
    }
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    // Return the URL path for the frontend to access the image
    return {
      message: 'File uploaded successfully',
      url: `/uploads/${file.filename}`
    };
  }

  // This is the NEW API feature for chunked uploads
  @Post('chunk')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, callback) => {
        // Save incoming chunks temporarily in a 'chunks_temp' folder
        const uploadPath = './public/uploads/chunks_temp';
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        callback(null, uploadPath);
      },
      filename: (req, file, callback) => {
        // Generate a random temporary name for the chunk
        const randomName = Date.now() + '-' + Math.round(Math.random() * 1e9);
        callback(null, randomName);
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 } // Limit each chunk to 10MB
  }))
  uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadChunkDto // Extract chunk metadata from the form-data body
  ) {
    if (!file) {
      throw new BadRequestException('Chunk file is required');
    }
    
    return this.uploadsService.handleChunk(
      file,
      body.identifier,
      body.chunkIndex,
      body.totalChunks,
      body.originalname
    );
  }
}
