import { useState } from 'react'
import { toast } from 'react-toastify'
import { Clock3, Mail, MapPin, Phone, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import PageHero from '@/components/Home/PageHero'
import { Reveal } from '@/components/Motion/Reveal'
import { BRAND } from '@/brand'

const contactInfo = [
  { icon: Mail, title: 'Email us', value: BRAND.email },
  { icon: Phone, title: 'Call us', value: BRAND.phone },
  { icon: MapPin, title: 'Visit us', value: BRAND.address },
  { icon: Clock3, title: 'Support hours', value: 'Mon – Sat, 9 AM – 8 PM' },
]

const emptyForm = { name: '', email: '', subject: '', message: '' }

function Contact() {
  const [form, setForm] = useState(emptyForm)

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // there is no contact endpoint yet, so the form only confirms and clears
  const handleSubmit = e => {
    e.preventDefault()
    toast.success("Thanks for reaching out! We'll get back to you soon.")
    setForm(emptyForm)
  }

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={<>We&apos;d love to <span className="gradient-text">hear from you</span></>}
        subtitle="Questions about bookings, payments or joining as a doctor? Send us a message."
      />
      <section className="pt-0">
        <div className="container grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {contactInfo.map(({ icon: Icon, title, value }, index) => (
              <Reveal key={title} delay={index * 0.06} className="card-surface card-hover flex items-center gap-4 p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <p className="font-semibold">{value}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="card-surface p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="form_label">Your name</label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Jane Doe" required />
              </div>
              <div>
                <label htmlFor="email" className="form_label">Your email</label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="subject" className="form_label">Subject</label>
                <Input id="subject" name="subject" value={form.subject} onChange={handleChange} placeholder="How can we help?" required />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="message" className="form_label">Message</label>
                <Textarea id="message" name="message" value={form.message} onChange={handleChange} placeholder="Tell us a little more…" rows={6} required />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full sm:w-auto">
                  Send message <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  )
}

export default Contact
