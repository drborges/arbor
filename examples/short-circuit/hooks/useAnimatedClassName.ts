import { useEffect, useState } from "react"

export function useAnimatedClassName(key: number) {
  const [className, setClassName] = useState("")

  useEffect(() => {
    setClassName("animate")
    const timeoutId = setTimeout(() => {
      setClassName("")
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [key])

  return className
}
