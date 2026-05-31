import { TOPOGRAPHY_PATH } from './topography-path'

export function TopographicField() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 size-full text-topographic [mask-image:linear-gradient(90deg,#000_0_64%,transparent_84%)] [-webkit-mask-image:linear-gradient(90deg,#000_0_64%,transparent_84%)]"
      aria-hidden="true"
    >
      <title>Decorative topographic contour lines</title>
      <defs>
        <pattern
          id="topographic-pattern"
          width="600"
          height="600"
          patternUnits="userSpaceOnUse"
          patternTransform="scale(1.25)"
        >
          <path className="fill-current" d={TOPOGRAPHY_PATH} />
        </pattern>
      </defs>
      <rect className="size-full" width="100%" height="100%" fill="url(#topographic-pattern)" />
    </svg>
  )
}
