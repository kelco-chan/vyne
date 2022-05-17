export function relativeTimestamp(timestamp: number | Date):string{
    return `<t:${Math.round(((typeof timestamp === "number") ? timestamp : timestamp.getTime()) / 1000)}:R>`
}