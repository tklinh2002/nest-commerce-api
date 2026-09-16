import { Injectable } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync } from 'node:fs';
import { extname, join } from 'node:path';

@Injectable()
export class UploadsService {
  handleChunk(file: Express.Multer.File, identifier: string, chunkIndex: number, totalChunks: number, originalname: string) {
    // 1. Create a temporary folder for this specific file identifier
    const tempDir = join('./public/uploads/temp', identifier);
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // 2. Move the chunk to the temp folder, naming it by its index (e.g., 0, 1, 2)
    const chunkPath = join(tempDir, chunkIndex.toString());
    const chunkData = readFileSync(file.path);
    appendFileSync(chunkPath, chunkData);
    
    // Remove the original temporary chunk created by Multer
    unlinkSync(file.path);

    // 3. Check if all chunks have been received
    const chunks = readdirSync(tempDir);
    if (chunks.length === totalChunks) {
      return this.mergeChunks(identifier, totalChunks, originalname, tempDir);
    }

    // If not complete, return the current progress
    return { 
      message: `Chunk ${chunkIndex} received`, 
      progress: `${chunks.length}/${totalChunks}` 
    };
  }

  private mergeChunks(identifier: string, totalChunks: number, originalname: string, tempDir: string) {
    const ext = extname(originalname);
    const finalFilename = `${identifier}${ext}`;
    const finalPath = join('./public/uploads', finalFilename);

    // Remove any existing file with the same name to prevent appending to garbage data
    if (existsSync(finalPath)) {
      unlinkSync(finalPath);
    }

    // 4. Merge all chunks in the correct order (0 to totalChunks - 1)
    Array.from({ length: totalChunks }).forEach((_, i) => {
      const chunkPath = join(tempDir, i.toString());
      const chunkData = readFileSync(chunkPath);
      appendFileSync(finalPath, chunkData);
    });

    // 5. Clean up: Delete the temporary folder
    rmSync(tempDir, { recursive: true, force: true });

    return {
      message: 'File uploaded and merged successfully',
      url: `/uploads/${finalFilename}`
    };
  }
}
