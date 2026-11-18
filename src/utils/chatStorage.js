// keeps an assistant's conversation in this browser tab only (gone when the tab closes or on logout)
const PREFIX = "medora-chat:";
export const chatKey = (name, userId) => `${PREFIX}${name}:${userId || ""}`;
export const loadChat = key => {
  try {
    return JSON.parse(sessionStorage.getItem(key)) || null;
  } catch {
    return null;
  }
};
export const saveChat = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private window or full storage: the chat just isn't kept
  }
};
export const clearChat = key => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // nothing kept
  }
};

export const newId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

// on logout: every assistant conversation of this tab
export const clearChats = () => {
  try {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith(PREFIX))
      .forEach(key => sessionStorage.removeItem(key));
  } catch {
    // nothing kept
  }
};
