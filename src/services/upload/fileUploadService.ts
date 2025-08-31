/**
 * File Upload Service
 * Handles file validation, upload progress, and drag-and-drop functionality
 */

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    extension: string;
    readableSize: string;
  };
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'preparing' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';
  bytesUploaded: number;
  totalBytes: number;
  uploadSpeed?: number; // bytes per second
  timeRemaining?: number; // seconds
  error?: string;
}

export interface UploadConfig {
  maxFileSize: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  chunkSize: number;
  maxConcurrentUploads: number;
  retryAttempts: number;
}

class FileUploadService {
  private config: UploadConfig = {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedExtensions: ['.exe', '.dll', '.so', '.dylib', '.jar', '.class', '.elf'],
    allowedMimeTypes: [
      'application/x-msdownload',
      'application/x-executable',
      'application/octet-stream',
      'application/java-archive',
      'application/x-elf',
      'application/x-mach-binary',
      'application/vnd.microsoft.portable-executable'
    ],
    chunkSize: 1024 * 1024, // 1MB chunks
    maxConcurrentUploads: 3,
    retryAttempts: 3,
  };

  private activeUploads = new Map<string, UploadProgress>();
  private uploadQueue: File[] = [];
  private abortControllers = new Map<string, AbortController>();

  /**
   * Validate a file before upload
   */
  public validateFile(file: File): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract file info
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: this.getFileExtension(file.name),
      readableSize: this.formatFileSize(file.size),
    };

    // Size validation
    if (file.size === 0) {
      errors.push('File is empty');
    } else if (file.size > this.config.maxFileSize) {
      errors.push(`File size ${fileInfo.readableSize} exceeds maximum of ${this.formatFileSize(this.config.maxFileSize)}`);
    }

    // Extension validation
    const extension = fileInfo.extension.toLowerCase();
    if (extension && !this.config.allowedExtensions.includes(extension)) {
      errors.push(`File extension ${extension} is not supported. Allowed: ${this.config.allowedExtensions.join(', ')}`);
    }

    // MIME type validation (if available)
    if (file.type) {
      const isAllowedMimeType = this.config.allowedMimeTypes.some(allowed => 
        file.type.includes(allowed) || allowed.includes(file.type)
      );
      
      if (!isAllowedMimeType) {
        warnings.push(`File type ${file.type} may not be supported. Expected binary executable files.`);
      }
    } else {
      warnings.push('File type could not be determined. Ensure this is a binary executable file.');
    }

    // Name validation
    if (file.name.length > 255) {
      errors.push('File name is too long (maximum 255 characters)');
    }

    // Special characters check
    if (!/^[\w\-. ]+$/.test(file.name)) {
      warnings.push('File name contains special characters that may cause issues');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo,
    };
  }

  /**
   * Validate multiple files
   */
  public validateFiles(files: File[]): FileValidationResult[] {
    return files.map(file => this.validateFile(file));
  }

  /**
   * Check for duplicate files in upload queue
   */
  public checkDuplicates(newFiles: File[]): {
    duplicates: Array<{ newFile: File; existingFile: File }>;
    unique: File[];
  } {
    const duplicates: Array<{ newFile: File; existingFile: File }> = [];
    const unique: File[] = [];

    newFiles.forEach(newFile => {
      const existing = this.uploadQueue.find(existingFile => 
        existingFile.name === newFile.name && 
        existingFile.size === newFile.size &&
        Math.abs(existingFile.lastModified - newFile.lastModified) < 1000
      );

      if (existing) {
        duplicates.push({ newFile, existingFile: existing });
      } else {
        unique.push(newFile);
      }
    });

    return { duplicates, unique };
  }

  /**
   * Get current upload progress for all active uploads
   */
  public getUploadProgress(): UploadProgress[] {
    return Array.from(this.activeUploads.values());
  }

  /**
   * Get upload progress for specific file
   */
  public getFileProgress(fileId: string): UploadProgress | undefined {
    return this.activeUploads.get(fileId);
  }

  /**
   * Cancel upload for specific file
   */
  public cancelUpload(fileId: string): boolean {
    const controller = this.abortControllers.get(fileId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(fileId);
      
      const progress = this.activeUploads.get(fileId);
      if (progress) {
        progress.status = 'cancelled';
        progress.error = 'Upload cancelled by user';
      }
      
      return true;
    }
    return false;
  }

  /**
   * Cancel all active uploads
   */
  public cancelAllUploads(): number {
    let cancelled = 0;
    
    this.abortControllers.forEach((controller, fileId) => {
      controller.abort();
      cancelled++;
      
      const progress = this.activeUploads.get(fileId);
      if (progress) {
        progress.status = 'cancelled';
        progress.error = 'Upload cancelled by user';
      }
    });

    this.abortControllers.clear();
    return cancelled;
  }

  /**
   * Create file upload progress tracker
   */
  public createProgressTracker(file: File, onProgress?: (progress: UploadProgress) => void): {
    fileId: string;
    updateProgress: (bytesUploaded: number, status?: UploadProgress['status'], error?: string) => void;
    complete: () => void;
    error: (error: string) => void;
  } {
    const fileId = this.generateFileId(file);
    const startTime = Date.now();

    const initialProgress: UploadProgress = {
      fileId,
      fileName: file.name,
      progress: 0,
      status: 'preparing',
      bytesUploaded: 0,
      totalBytes: file.size,
    };

    this.activeUploads.set(fileId, initialProgress);

    const updateProgress = (
      bytesUploaded: number, 
      status: UploadProgress['status'] = 'uploading',
      error?: string
    ) => {
      const progress = this.activeUploads.get(fileId);
      if (!progress) return;

      const now = Date.now();
      const elapsedTime = (now - startTime) / 1000; // seconds
      
      progress.bytesUploaded = bytesUploaded;
      progress.progress = Math.round((bytesUploaded / file.size) * 100);
      progress.status = status;
      progress.error = error;

      // Calculate upload speed
      if (elapsedTime > 0) {
        progress.uploadSpeed = Math.round(bytesUploaded / elapsedTime);
        
        // Estimate remaining time
        if (progress.uploadSpeed > 0 && bytesUploaded > 0) {
          const remainingBytes = file.size - bytesUploaded;
          progress.timeRemaining = Math.round(remainingBytes / progress.uploadSpeed);
        }
      }

      if (onProgress) {
        onProgress({ ...progress });
      }
    };

    const complete = () => {
      updateProgress(file.size, 'completed');
      setTimeout(() => {
        this.activeUploads.delete(fileId);
      }, 5000); // Remove from active uploads after 5 seconds
    };

    const error = (errorMessage: string) => {
      updateProgress(0, 'error', errorMessage);
    };

    return { fileId, updateProgress, complete, error };
  }

  /**
   * Setup drag and drop handlers
   */
  public setupDragAndDrop(
    dropZone: HTMLElement,
    onFilesDropped: (files: File[]) => void,
    onDragStateChange?: (isDragging: boolean) => void
  ): () => void {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      dragCounter++;
      if (dragCounter === 1 && onDragStateChange) {
        onDragStateChange(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Set drop effect
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      dragCounter--;
      if (dragCounter === 0 && onDragStateChange) {
        onDragStateChange(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      dragCounter = 0;
      if (onDragStateChange) {
        onDragStateChange(false);
      }

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        onFilesDropped(fileArray);
      }
    };

    // Add event listeners
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    // Return cleanup function
    return () => {
      dropZone.removeEventListener('dragenter', handleDragEnter);
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('drop', handleDrop);
    };
  }

  /**
   * Get readable file extension
   */
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.slice(lastDot);
  }

  /**
   * Format file size in human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    
    return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  }

  /**
   * Generate unique file ID
   */
  private generateFileId(file: File): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const fileHash = this.simpleHash(file.name + file.size + file.lastModified);
    return `file_${timestamp}_${random}_${fileHash}`;
  }

  /**
   * Simple hash function for file identification
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<UploadConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): UploadConfig {
    return { ...this.config };
  }

  /**
   * Get upload statistics
   */
  public getStats(): {
    activeUploads: number;
    queuedFiles: number;
    totalBytesUploaded: number;
    totalBytesRemaining: number;
    averageSpeed: number;
  } {
    const uploads = Array.from(this.activeUploads.values());
    const totalBytesUploaded = uploads.reduce((sum, upload) => sum + upload.bytesUploaded, 0);
    const totalBytesRemaining = uploads.reduce((sum, upload) => sum + (upload.totalBytes - upload.bytesUploaded), 0);
    const validSpeeds = uploads.filter(u => u.uploadSpeed && u.uploadSpeed > 0).map(u => u.uploadSpeed!);
    const averageSpeed = validSpeeds.length > 0 
      ? validSpeeds.reduce((sum, speed) => sum + speed, 0) / validSpeeds.length 
      : 0;

    return {
      activeUploads: uploads.length,
      queuedFiles: this.uploadQueue.length,
      totalBytesUploaded,
      totalBytesRemaining,
      averageSpeed: Math.round(averageSpeed),
    };
  }

  /**
   * Clean up completed/cancelled uploads
   */
  public cleanup(): void {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    this.activeUploads.forEach((progress, fileId) => {
      if (['completed', 'cancelled', 'error'].includes(progress.status)) {
        // Remove uploads that finished more than 5 minutes ago
        // Note: This is a simple cleanup - in real implementation you'd track completion time
        this.activeUploads.delete(fileId);
      }
    });
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService();

// Export types for external use
export type { FileUploadService };