export type DayOfWeek = "M" | "T" | "W" | "Th" | "F" | "S" | "Su"

export interface Event {
  id: number
  title: string
  day: DayOfWeek
  start: string
  end: string
  color: "blue" | "green" | "yellow" | "purple" | "red"
}
