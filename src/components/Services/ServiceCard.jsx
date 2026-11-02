import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const ServiceCard = ({ item }) => {
  const { name, desc, icon: Icon, accent, query, conditions, specialist } = item

  return (
    <Link
      to={`/doctors?query=${query}`}
      className="group card-surface card-hover relative flex h-full flex-col overflow-hidden p-6"
    >
      {/* large faded icon that drifts in on hover */}
      <Icon
        className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 text-foreground/[0.03] transition-all duration-500 group-hover:-translate-x-2 group-hover:-translate-y-2 group-hover:text-foreground/[0.06]"
        strokeWidth={1.2}
      />

      <div className="flex items-center gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${accent} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="text-lg font-bold text-foreground">{name}</h3>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">{desc}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {conditions.slice(0, 3).map(condition => (
          <span key={condition} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80">
            {condition}
          </span>
        ))}
      </div>

      <span className="mt-auto flex items-center justify-between pt-6 text-sm font-semibold text-primary">
        Find {specialist.toLowerCase()}
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  )
}

export default ServiceCard
