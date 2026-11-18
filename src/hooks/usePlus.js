import { useContext, useEffect, useState } from "react";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";

// The patient's Medora Plus membership, loaded once and shared by every component that asks
// (booking cards, the booking panel, the Plus tab). null while loading, and for doctors / visitors.
let cache = { token: null, value: null, loading: null };
const listeners = new Set();

const load = token => {
  if (cache.loading && cache.token === token) return cache.loading;
  cache.token = token;
  cache.loading = apiRequest("/plus", { token })
    .then(result => {
      if (cache.token !== token) return;
      cache.value = result.data;
      listeners.forEach(listener => listener(result.data));
    })
    .catch(() => {})
    .finally(() => {
      if (cache.token === token) cache.loading = null;
    });
  return cache.loading;
};

// load it again (after buying Plus or switching auto-renew)
export const refreshPlus = token => load(token);

const usePlus = () => {
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

export default usePlus;

// the plan the patient is on ({ id, label, refund, reschedules, ... }); null for "no limit" values, see the server's tiers
export const currentTier = data => data?.details?.tiers?.find(tier => tier.id === (data.tier || "free")) || null;
export const tierById = (data, id) => data?.details?.tiers?.find(tier => tier.id === id) || null;
