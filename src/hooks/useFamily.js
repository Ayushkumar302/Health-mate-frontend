import { useContext, useEffect, useState } from "react";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";

// The patient's family members (Plus Family), loaded once and shared: the booking panel asks
// "who is this visit for?", the Family tab edits them. null while loading, and for doctors / visitors.
let cache = { token: null, value: null, loading: null };
const listeners = new Set();

const publish = value => {
  cache.value = value;
  listeners.forEach(listener => listener(value));
};

const load = token => {
  if (cache.loading && cache.token === token) return cache.loading;
  cache.token = token;
  cache.loading = apiRequest("/users/family", { token })
    .then(result => {
      if (cache.token === token) publish(result.data);
    })
    .catch(() => {})
    .finally(() => {
      if (cache.token === token) cache.loading = null;
    });
  return cache.loading;
};

// after a change the server sends the new list back; or load it again (after the plan changed)
export const setFamily = value => publish(value);
export const refreshFamily = token => load(token);

const useFamily = () => {
  const { token, role } = useContext(authContext);
  const isPatient = Boolean(token) && role === "patient";
  const [value, setValue] = useState(() => (isPatient && cache.token === token ? cache.value : null));

  useEffect(() => {
    if (!isPatient) {
      setValue(null);
      return undefined;
    }
    listeners.add(setValue);
    if (cache.token === token && cache.value) setValue(cache.value);
    else {
      if (cache.token !== token) cache = { token, value: null, loading: null };
      load(token);
    }
    return () => listeners.delete(setValue);
  }, [isPatient, token]);

  return value;
};

export default useFamily;
