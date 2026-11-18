// Cloudinary can resize and re-encode on the fly: ask for an image no wider than it's shown
// (twice that for sharp screens) in the best format the browser supports (WebP/AVIF).
// Other images (the bundled demo portraits) are returned as they are.
export const sizedImage = (url, width) => {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;
  // already has a transformation: leave it alone
  if (/\/upload\/[a-z]{1,3}_[^/]*\//.test(url)) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${Math.round(width)}/`);
};
