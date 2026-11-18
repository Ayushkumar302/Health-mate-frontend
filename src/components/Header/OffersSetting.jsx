import { useContext, useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { toast } from "react-toastify";
import { SettingRow } from "@/components/Dashboard/DashboardUI";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";

// "Offers and tips": the upgrade suggestions in the notification centre (bell only), on or off
const OffersSetting = ({ text }) => {
  const { token } = useContext(authContext);
  const [on, setOn] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiRequest("/notifications", { token })
      .then(result => setOn(result.data.offers))
      .catch(() => setOn(null));
  }, [token]);

  const change = async value => {
    setBusy(true);
    try {
      const result = await apiRequest("/notifications/offers", { token, method: "PUT", body: { on: value } });
      setOn(value);
      toast.success(result.message);
    } catch (error) {
      toast.error(error.message);
    }
    setBusy(false);
  };

  if (on === null) return null;
  return (
    <SettingRow
      icon={Gift}
      title="Offers and tips"
      text={text || "A suggestion about a plan that could save you money, in your notifications only, at most once every 15 days. They pause on their own if you don't open them."}
      checked={on}
      busy={busy}
      onChange={change}
    />
  );
};

export default OffersSetting;
