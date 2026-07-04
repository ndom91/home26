const eyebrowBarColors = [
  'bg-accent-100',
  'bg-accent-300',
  'bg-accent-500',
  'bg-accent-700',
  'bg-accent-900',
]

type EyebrowBarsProps = {
  /** Wrapper classes (spacing, alignment). */
  className?: string
  /** Per-bar sizing classes. Defaults to the interior-page size. */
  barClassName?: string
}

/**
 * The five stacked accent bars used as a section eyebrow across the home,
 * projects, and 404 pages. Colors and base bar styling live here so the
 * palette is defined once.
 */
export function EyebrowBars({
  className = '',
  barClassName = 'h-9 w-7 max-[520px]:h-6 max-[520px]:w-4',
}: EyebrowBarsProps) {
  return (
    <div className={`flex text-accent ${className}`} aria-hidden="true">
      {eyebrowBarColors.map((color) => (
        <span
          key={color}
          className={`block border-2 border-r-0 border-paper ${barClassName} ${color}`}
        />
      ))}
    </div>
  )
}
