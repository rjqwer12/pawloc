// Preview thumbnails may request a cropped image from Unsplash.
// Use an uncropped rendition in the viewer; uploaded photo URLs stay intact.
export function fullPhoto(src) {
  try {
    const url = new URL(src);
    if (url.hostname !== 'images.unsplash.com') return src;
    url.searchParams.delete('h');
    url.searchParams.delete('crop');
    url.searchParams.set('fit', 'max');
    url.searchParams.set('w', '1600');
    return url.href;
  } catch { return src; }
}
