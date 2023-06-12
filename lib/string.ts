export function parseDisplayName({
  firstName,
  lastName,
}: {
  readonly firstName?: string | null
  readonly lastName?: string | null
}) {
  if (firstName && lastName) {
    if (firstName === lastName) {
      return firstName
    }

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

export function truncate(str: string, maxLength = 50): string {
  if (str.length <= maxLength) {
    return str
  }

  const truncatedStr = str.slice(0, maxLength)
  return truncatedStr + '...'
}
