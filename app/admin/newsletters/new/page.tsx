import { Card, Text, TextInput, Title } from '@tremor/react'

export default function CreateNewsletterPage() {
  return (
    <>
      <Title>Create a newsletter</Title>

      <Card className="mt-6">
        <form>
          <div className="flex flex-col space-y-3">
            <Text>Subject</Text>
            <TextInput name="subject" required />
          </div>
          <div className="flex flex-col space-y-3">
            <Text>Sent at</Text>
            <input type="datetime-local" name="sent_at" required />
          </div>
          <div className="flex flex-col space-y-3">
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
                className="block w-full rounded-md border-0 py-1.5 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:text-zinc-100 dark:ring-zinc-700 sm:text-sm sm:leading-6"
                defaultValue={''}
              />
            </div>
          </div>
        </form>
      </Card>
    </>
  )
}
