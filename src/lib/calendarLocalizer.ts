import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import { dateFnsLocalizer } from "react-big-calendar"

const locales = {
  "en-US": enUS,
}

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})
