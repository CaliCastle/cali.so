import { Card, Text, TextInput, Title } from '@tremor/react'
import { extendDateTime, parseDateTime } from '@zolplay/utils'
import { eq,lte } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import PQueue from 'p-queue'
import { z } from 'zod'

import { Button } from '~/components/ui/Button'
import { emailConfig } from '~/config/email'
import { db } from '~/db'
import { newsletters, subscribers } from '~/db/schema'
import NewslettersTemplate from '~/emails/NewslettersTemplate'
import { env } from '~/env.mjs'
import { url } from '~/lib'
import { resend } from '~/lib/mail'


extendDateTime({
  timezone: true,
})

const CreateNewsletterSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
})

const queue = new PQueue({
  concurrency: 10,
  interval: 1000,
  intervalCap: 2

})
export default function CreateNewsletterPage() {
  async function addNewsletter(formData: FormData) {
    'use server'

    const data = CreateNewsletterSchema.parse(
      Object.fromEntries(formData.entries())
    )

    const subs = await db
      .select({
        email: subscribers.email,
      })
      .from(subscribers)
      .where(lte(subscribers.subscribedAt, new Date()))
    
    const subscriberEmails = new Set([
      ...subs
        .filter((sub) => typeof sub.email === 'string' && sub.email.length > 0)
        .map((sub) => sub.email),
    ])

          
    // send notification if site_notification_email_to is set
    if(env.SITE_NOTIFICATION_EMAIL_TO)
      subscriberEmails.add(env.SITE_NOTIFICATION_EMAIL_TO)
    
    const sendEmail = async (email: string) => {
      const token = crypto.randomUUID()

      await resend.emails.send({
        subject: data.subject,
        from: emailConfig.from,
        to: email,
        reply_to: emailConfig.from,
        react: NewslettersTemplate({
          subject: data.subject,
          body: data.body,
          link: url(`unsubscribe/${token}`).href
        })
      });

      await db
      .update(subscribers)
      .set({ unsub_token: token, updatedAt: new Date() })
      .where(eq(subscribers.email, email))
    };

    //Resend api limit the rate of request to 2 per sec.
    const addToQueue = async () => {
        const Emails = Array.from(subscriberEmails)
        for (const email of Emails) {
          await queue.add(() => sendEmail(email));
        }
      
    }

    await addToQueue()
    
    await db.insert(newsletters).values({
      ...data,
      sentAt: parseDateTime({
        date: new Date(),
        timezone: 'Asia/Shanghai',
      })?.toDate(),
    })

    redirect('/admin/newsletters')
  }

  return (
    <>
      <Title>Create a newsletter</Title>

      <Card className="mt-6">
        <form className="flex flex-col gap-4" action={addNewsletter}>
          <div className="flex flex-col space-y-3">
            <Text>Subject</Text>
            <TextInput name="subject" required />
          </div>

          <div className="flex flex-col space-y-2">
            <label
              htmlFor="body"
              className="block text-sm font-medium leading-6 text-zinc-800 dark:text-zinc-200"
            >
              Body
            </label>
            <div className="mt-2">
              <textarea
                rows={20}
                name="body"
                id="body"
                className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-800 dark:text-zinc-100 dark:ring-zinc-700 sm:text-sm sm:leading-6"
                defaultValue={''}
              />
            </div>
          </div>

          <footer className="border-t border-gray-900/10 pt-6 dark:border-gray-100/10">
            <div className="flex justify-end">
              <Button type="submit" className="">
                Create
              </Button>
            </div>
          </footer>
        </form>
      </Card>
    </>
  )
}
