export function parseDisplayName({
  firstName,
  lastName,
}: {
  readonly firstName?: string | null
  readonly lastName?: string | null
}) {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  }

  if (firstName) {
    return firstName
  }
  if (lastName) {
    return lastName
  }

  return '匿名用户'
}
