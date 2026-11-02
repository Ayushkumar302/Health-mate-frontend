// soft sky-blue and mint wash + faint dotted grid, used behind hero sections
function Aurora() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-primary/[0.14] blur-[120px] animate-aurora" />
      <div className="absolute right-1/4 top-1/3 h-[360px] w-[360px] rounded-full bg-highlight/[0.12] blur-[120px] animate-aurora [animation-delay:-7s]" />
      <div className="absolute -left-40 bottom-0 h-[420px] w-[420px] rounded-full bg-brand-cyan/[0.10] blur-[120px] animate-aurora [animation-delay:-13s]" />
    </div>
  );
}

export default Aurora;
