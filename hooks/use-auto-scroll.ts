import { useEffect, useLayoutEffect, useRef, useState } from "react"

// How many pixels from the bottom of the container to enable auto-scroll
const ACTIVATION_THRESHOLD = 50
// Minimum pixels of scroll-up movement required to disable auto-scroll
const MIN_SCROLL_UP_THRESHOLD = 10

export function useAutoScroll(dependencies: React.DependencyList) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const previousScrollTop = useRef<number | null>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const rafRef = useRef<number | null>(null)

  const scrollToBottom = () => {
    if (containerRef.current) {
      const el = containerRef.current
      // cancel any pending scroll to avoid piling up during fast streaming
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        // scrollHeight is the max scroll position anchor
        el.scrollTop = el.scrollHeight
      })
    }
  }

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current

      const distance = Math.abs(scrollHeight - scrollTop - clientHeight)

      const prev = previousScrollTop.current
      const isScrollingUp = prev !== null ? scrollTop < prev : false
      const scrollUpDistance = prev !== null ? prev - scrollTop : 0

      const isDeliberateScrollUp =
        isScrollingUp && scrollUpDistance > MIN_SCROLL_UP_THRESHOLD

      if (isDeliberateScrollUp) {
        setShouldAutoScroll(false)
      } else {
        const isScrolledToBottom = distance < ACTIVATION_THRESHOLD
        setShouldAutoScroll(isScrolledToBottom)
      }

      previousScrollTop.current = scrollTop
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return
    // user is scrolling up -> take control
    if (e.deltaY < 0) {
      setShouldAutoScroll(false)
    }
  }

  const handleTouchStart = () => {
    setShouldAutoScroll(false)
  }

  useEffect(() => {
    if (containerRef.current) {
      previousScrollTop.current = containerRef.current.scrollTop
    }
  }, [])

  // React state changes (messages/typing/etc)
  useLayoutEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  // Pure DOM growth (markdown layout, images, fonts, etc.) while streaming.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observed = el.firstElementChild as HTMLElement | null
    if (!observed) return

    const ro = new ResizeObserver(() => {
      if (!shouldAutoScroll) return
      scrollToBottom()
    })

    ro.observe(observed)
    return () => {
      ro.disconnect()
    }
  }, [shouldAutoScroll])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  return {
    containerRef,
    scrollToBottom,
    handleScroll,
    handleWheel,
    shouldAutoScroll,
    handleTouchStart,
  }
}
