export default function proxiable(value: any): boolean {
  return (
    typeof value === "object" &&
    value?.constructor != null &&
    value.constructor.name !== "Date"
  )
}
