const upload_preset = import.meta.env.VITE_UPLOAD_PRESET;
const cloud_name = import.meta.env.VITE_CLOUD_NAME;

// profile photos only: images up to 2 MB (the Cloudinary upload preset should enforce the same)
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const uploadImageToCloudinary = async file => {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Please choose a JPG or PNG photo");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Photos can be at most 2 MB");
  }
  const uploadData = new FormData();
  uploadData.append("file", file);
  uploadData.append("upload_preset", upload_preset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
    method: "POST",
    body: uploadData,
  });
  if (!res.ok) {
    throw new Error("The photo could not be uploaded, please try again");
  }
  return res.json();
};

export default uploadImageToCloudinary;
