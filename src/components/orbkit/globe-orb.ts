import type { OrbVariant } from './orbkit-core'
import { shdr14Orb } from './shdr-14'

// SHDR-14 has no fixed surface features, so its roll is invisible once the
// plasma is turned down. Add soft "continents" in the same rotating frame as
// the plasma so the spin reads like a turning globe.
const ANCHOR = 'lum = pow(clamp(lum * gainNow, 0.0, 1.0), uP_contrast);'

// The helpers only ship 2D fbm, so project it triplanar: blending the three
// axis-aligned planes by the normal avoids the seam a lon/lat mapping has.
const CONTINENTS = `
  vec3 landW = abs(sp);
  landW /= landW.x + landW.y + landW.z;
  vec3 landP = sp * uP_landScale;
  float landN = fbm(landP.yz + 3.1) * landW.x + fbm(landP.zx + 7.7) * landW.y + fbm(landP.xy + 1.3) * landW.z;
  float landMask = smoothstep(uP_landLevel, uP_landLevel + 0.08, landN);
  lum += uP_land * landMask * (0.15 + lambert);
  ${ANCHOR}`

if (!shdr14Orb.frag.includes(ANCHOR)) {
  throw new Error('globe-orb: SHDR-14 shader changed, continents anchor not found')
}

export const globeOrb: OrbVariant = {
  ...shdr14Orb,
  key: 'shdr-14-globe',
  frag: shdr14Orb.frag.replace(ANCHOR, CONTINENTS),
  params: [
    ...shdr14Orb.params,
    { key: 'land', label: 'Land amount', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'landScale', label: 'Land scale', min: 0.5, max: 8, step: 0.1, default: 2.2 },
    { key: 'landLevel', label: 'Land level', min: 0, max: 1, step: 0.01, default: 0.5 },
  ],
}
