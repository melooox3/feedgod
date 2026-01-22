'use client'

import { LucideProps } from 'lucide-react'
import { forwardRef } from 'react'

/**
 * X (formerly Twitter) logo icon component
 * Designed to match Lucide icon styling
 */
const XLogo = forwardRef<SVGSVGElement, LucideProps>(
  ({ className, size = 24, strokeWidth = 2, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {/* X logo path */}
        <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
      </svg>
    )
  }
)

XLogo.displayName = 'XLogo'

export default XLogo
