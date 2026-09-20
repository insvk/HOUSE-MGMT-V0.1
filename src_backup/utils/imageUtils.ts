// Utility for Image Resizing, Canvas Compression & Avatar Presets
// Madura House Maintenance Management Platform (HMMP)

export const DEFAULT_AVATARS = [
  {
    id: 'avatar-1',
    label: 'Executive Man',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-2',
    label: 'Professional Man',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-3',
    label: 'Modern Woman',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-4',
    label: 'Classic Gentleman',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-5',
    label: 'Architect / Designer',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-6',
    label: 'Young Resident',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-7',
    label: 'Professional Woman',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-8',
    label: 'Senior Resident',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80',
  },
];

/**
 * Resizes and compresses an uploaded image file into a square Data URL.
 * Automatically crops the center to ensure 1:1 circular display without distortion.
 */
export async function compressAndResizeImage(
  file: File,
  maxSize: number = 256,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Basic validation
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Could not get canvas 2d context.'));
            return;
          }

          // Center crop calculation for perfect square
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSize, maxSize);

          // Export as optimized JPEG/WebP data URL
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Generates an SVG Data URI with the user initials as fallback.
 */
export function getInitialsAvatar(name: string, bg: string = '#405189'): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (name[0] || 'U').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" fill="${bg}" rx="50"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="700">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface ProcessedInvoiceFile {
  dataUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

/**
 * Reads and optimizes an uploaded invoice file (PDF or Image) into a persistent Data URL.
 */
export async function processInvoiceFile(file: File): Promise<ProcessedInvoiceFile> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/');

  if (!isPdf && !isImage) {
    throw new Error('Unsupported file format. Please upload a PDF or Image (JPG, PNG, WEBP).');
  }

  // Handle PDF: Read directly as base64 Data URL
  if (isPdf) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read PDF file.'));
      reader.onload = (e) => {
        resolve({
          dataUrl: e.target?.result as string,
          fileName: file.name,
          fileType: 'application/pdf',
          fileSize: file.size,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle Image: Optimize resolution if larger than 1600px while maintaining aspect ratio
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for optimization.'));
      img.onload = () => {
        try {
          const maxDimension = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to raw data url
            resolve({
              dataUrl: e.target?.result as string,
              fileName: file.name,
              fileType: file.type || 'image/jpeg',
              fileSize: file.size,
            });
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve({
            dataUrl,
            fileName: file.name,
            fileType: 'image/jpeg',
            fileSize: Math.round(dataUrl.length * 0.75),
          });
        } catch {
          resolve({
            dataUrl: e.target?.result as string,
            fileName: file.name,
            fileType: file.type || 'image/jpeg',
            fileSize: file.size,
          });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

