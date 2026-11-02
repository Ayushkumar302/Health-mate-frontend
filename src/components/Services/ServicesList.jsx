import { services } from "../../assets/data/services";
import ServiceCard from "./ServiceCard";
import { Stagger, StaggerItem } from "../Motion/Reveal";

// limit: show only the first few services (used on the home page)
function ServicesList({ limit }) {
  const items = limit ? services.slice(0, limit) : services;

  return (
    <Stagger className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map(item => (
        <StaggerItem key={item.name}>
          <ServiceCard item={item} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export default ServicesList;
