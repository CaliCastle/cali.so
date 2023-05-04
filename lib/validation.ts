import { type ZodSchema } from 'zod'

export function withValidate<TData>(
  schema: ZodSchema<TData>,
  action: (data: TData) => void
) {
  return (formData: FormData) => {
    return action(schema.parse(Object.fromEntries(formData.entries())))
  }
}
