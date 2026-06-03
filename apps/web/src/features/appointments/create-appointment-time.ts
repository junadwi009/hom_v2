export const STUDIO_TIME_ZONE = "Asia/Jakarta";

const JAKARTA_UTC_OFFSET_HOURS = 7;
const DATE_TIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function toJakartaIsoTimestamp(value: string) {
  const match = DATE_TIME_LOCAL_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const timestamp = Date.UTC(
    year,
    month - 1,
    day,
    hour - JAKARTA_UTC_OFFSET_HOURS,
    minute,
  );
  const localTime = new Date(
    timestamp + JAKARTA_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );

  if (
    localTime.getUTCFullYear() !== year ||
    localTime.getUTCMonth() + 1 !== month ||
    localTime.getUTCDate() !== day ||
    localTime.getUTCHours() !== hour ||
    localTime.getUTCMinutes() !== minute
  ) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

export function toJakartaDateTimeLocalValue(date: Date) {
  const jakartaTime = new Date(
    date.getTime() + JAKARTA_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );

  return (
    [
      jakartaTime.getUTCFullYear(),
      padNumber(jakartaTime.getUTCMonth() + 1),
      padNumber(jakartaTime.getUTCDate()),
    ].join("-") +
    `T${padNumber(jakartaTime.getUTCHours())}:${padNumber(
      jakartaTime.getUTCMinutes(),
    )}`
  );
}

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}
