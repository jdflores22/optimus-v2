/** PNG profile photos get a white background so transparent areas remain visible. */
export function profilePhotoNeedsWhiteBackground(
  pathOrType?: string | null,
): boolean {
  if (!pathOrType) return false;
  return pathOrType === 'image/png' || /\.png(\?|$)/i.test(pathOrType);
}

export async function prepareProfilePhoto(file: File): Promise<File> {
  if (file.type !== 'image/png') {
    return file;
  }

  return flattenPngOnWhite(file);
}

function flattenPngOnWhite(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas is unavailable.'));
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not process PNG image.'));
            return;
          }
          resolve(new File([blob], file.name, { type: 'image/png', lastModified: Date.now() }));
        },
        'image/png',
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load PNG image.'));
    };

    img.src = url;
  });
}
