import { BASE_URL } from "@/config";

// files need the login token, so they are downloaded with fetch and opened from memory
export const openDocument = async (token, documentId) => {
  // open the tab right away (inside the click), otherwise the browser treats it as a pop-up
  const tab = window.open("", "_blank");
  try {
    const res = await fetch(`${BASE_URL}/documents/${documentId}/file`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      throw new Error(result.message || "Could not open the file");
    }
    const url = URL.createObjectURL(await res.blob());
    if (tab) tab.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    tab?.close();
    throw error;
  }
};

export const uploadDocument = async (token, { file, category, title, reportDate }) => {
  const form = new FormData();
  form.append("file", file);
  form.append("category", category);
  if (title) form.append("title", title);
  if (reportDate) form.append("reportDate", reportDate);
  const res = await fetch(`${BASE_URL}/documents`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(result.message || "Upload failed");
  return result.data;
};

export const formatSize = bytes => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export const CATEGORY_LABELS = {
  lab: "Lab report",
  imaging: "Scan / imaging",
  prescription: "Old prescription",
  other: "Other",
  registration: "Registration certificate",
  degree: "Degree certificate",
  "id-proof": "Government ID",
};
