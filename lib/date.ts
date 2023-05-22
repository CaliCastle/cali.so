import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

export function getDate(timezone = 'Asia/Shanghai'): dayjs.Dayjs {
  return dayjs().tz(timezone)
}
