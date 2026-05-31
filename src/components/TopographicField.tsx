import { TOPOGRAPHY_PATH } from './topography-path'

export function TopographicField() {
  return (
    <svg className="topographic-field" aria-hidden="true">
      <title>Decorative topographic contour lines</title>
      <defs>
        <pattern id="topographic-pattern" width="600" height="600" patternUnits="userSpaceOnUse">
          <path d={TOPOGRAPHY_PATH} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#topographic-pattern)" />
    </svg>
  )
}
