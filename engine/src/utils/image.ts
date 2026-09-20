/** Maps a generated-image MIME type to the matching S3 object extension. */
export function getImageExtension(contentType: string): string {
  switch (contentType.split(";", 1)[0]?.toLowerCase()) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error(
        `Unsupported generated image content type: ${contentType}`,
      );
  }
}
