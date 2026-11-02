import { Link } from 'react-router-dom'
import { Github, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react'
import Logo from '../Brand/Logo'
import { BRAND, DEMO_MODE } from '@/brand'

const socialLinks = [
  { href: "https://github.com/Ayushkumar302", label: "GitHub", icon: Github },
  { href: "https://instagram.com", label: "Instagram", icon: Instagram },
  { href: "https://linkedin.com", label: "LinkedIn", icon: Linkedin },
]

const linkGroups = [
  {
    title: "Explore",
    links: [
      { path: "/", display: "Home" },
      { path: "/services", display: "Services" },
      { path: "/contact", display: "Contact" },
    ],
  },
  {
    title: "Patients",
    links: [
      { path: "/doctors", display: "Find a Doctor" },
      { path: "/symptom-checker", display: "Symptom Checker" },
      { path: "/register", display: "Create an Account" },
    ],
  },
  {
    title: "Doctors",
    links: [
      { path: "/register", display: "Join as a Doctor" },
      { path: "/login", display: "Doctor Login" },
    ],
  },
]

// in the portfolio demo there is no sign-up page to link to
const visibleLinks = links => (DEMO_MODE ? links.filter(link => link.path !== "/register") : links)

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-10 border-t border-border bg-card/40">
      {/* soft glow along the top edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              {BRAND.tagline}. Find trusted doctors, pick a time that suits you and pay securely, all in one place.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {BRAND.email}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {BRAND.phone}</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {BRAND.address}</li>
            </ul>
          </div>

          {linkGroups.map(group => (
            <div key={group.title}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{group.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {visibleLinks(group.links).map(link => (
                  <li key={link.display}>
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.display}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col-reverse items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {year} {BRAND.name}. Built by Ayush Kumar.
          </p>
          <div className="flex items-center gap-2">
            {socialLinks.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
