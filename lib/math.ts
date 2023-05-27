export function clamp(value: number, a: number, b: number) {
  const min = Math.min(a, b)
  const max = Math.max(a, b)
  return Math.min(Math.max(value, min), max)
}

// write a function that does the same as "number.toFixed(n)"
// but omit the trailing zeros
export function toFixed(value: number, n = 1) {
  const str = value.toFixed(n)
  if (str.indexOf('.') !== -1) {
    return str.replace(/\.?0+$/, '')
  } else {
    return str
  }
}

export function prettifyNumber(n: number, inChinese = false): string {
  if (inChinese) {
    if (Math.abs(n) >= 100000000) {
      return toFixed(n / 100000000) + '亿'
    } else if (Math.abs(n) >= 10000) {
      return toFixed(n / 10000) + '万'
    } else {
      return Intl.NumberFormat('en-US').format(n)
    }
  }

  if (Math.abs(n) >= 1000000) {
    return toFixed(n / 1000000) + 'm'
  } else if (Math.abs(n) >= 1000) {
    return toFixed(n / 1000) + 'k'
  } else {
    return Intl.NumberFormat('en-US').format(n)
  }
}
