import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'

function Contact() {
  return (
    <section>
      <div className='px-4 mx-auto max-w-screen-md'>
        <h2 className=' heading text-center'>Contact Us</h2>
        <p className='mb-8 lg:mb-16 font-light text-center text__para'>
          If you have any questions or would like to get in touch with us, please don't hesitate
          to reach out. We'd love to hear from you!
        </p>
        <form action="#" className='space-y-8'>
          <div>
            <label htmlFor="email" className='form_label'>Your Email</label>
            <Input
            type='email'
            id='email'
            placeholder='Enter your email'
            className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="subject" className='form_label'>Subject</label>
            <Input
            type='text'
            id='subject'
            placeholder='Let us know how we can help you'
            className="mt-1"
            />
          </div>

          <div className='sm:col-span-2'>
            <label htmlFor="message" className='form_label'>Your Message</label>
            <Textarea
            type='text'
            id='message'
            placeholder='Leave a comment...'
            className="mt-1"
            />
          </div>
          <Button type='submit'>Submit</Button>
        </form>

      </div>
    </section>
  )
}

export default Contact