import { useEffect } from 'react'

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return
    const scrollY = window.scrollY
    const body = document.body
    const prevOverflow = body.style.overflow
    const prevPosition = body.style.position
    const prevTop = body.style.top
    const prevWidth = body.style.width

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'

    return () => {
      body.style.overflow = prevOverflow
      body.style.position = prevPosition
      body.style.top = prevTop
      body.style.width = prevWidth
      window.scrollTo(0, scrollY)
    }
  }, [isLocked])
}
