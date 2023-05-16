export function clamp(value: number, a: number, b: number) {
  const min = Math.min(a, b)
  const max = Math.max(a, b)
  return Math.min(Math.max(value, min), max)
}

export function prettifyNumber(n: number, inChinese = false): string {
  if (inChinese) {
    if (Math.abs(n) >= 100000000) {
      return (n / 100000000).toFixed(1) + '亿'
    } else if (Math.abs(n) >= 10000) {
      return (n / 10000).toFixed(1) + '万'
    } else {
      return Intl.NumberFormat('en-US').format(n)
    }
  }

  if (Math.abs(n) >= 1000000) {
    return (n / 1000000).toFixed(1) + 'm'
  } else if (Math.abs(n) >= 1000) {
    return (n / 1000).toFixed(1) + 'k'
  } else {
    return Intl.NumberFormat('en-US').format(n)
  }
}
