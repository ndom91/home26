import type { OrbVariant } from './orbkit-core'
import { shdr14Orb } from './shdr-14'

// SHDR-14 has no fixed surface features, so its roll is invisible once the
// plasma is turned down. Layer a planet surface into the same rotating frame
// as the plasma: continents with relief and detail, darker oceans, and a cloud
// shell that turns at its own rate so the two layers parallax.
const MAIN_ANCHOR = 'void main() {'
const LUM_ANCHOR = 'lum = pow(clamp(lum * gainNow, 0.0, 1.0), uP_contrast);'

// The helpers only ship 2D fbm, so project it triplanar: blending the three
// axis-aligned planes by the normal avoids the seam a lon/lat mapping has.
const HELPERS = `
float sphereFbm(vec3 p, vec3 w) {
  return fbm(p.yz + 3.1) * w.x + fbm(p.zx + 7.7) * w.y + fbm(p.xy + 1.3) * w.z;
}

${MAIN_ANCHOR}`

// Locals are prefixed because SHDR-14 declares short names (q, v, f) later in
// main, and a clash fails the shader compile.
const SURFACE = `
  vec3 surfW = abs(sp);
  surfW /= surfW.x + surfW.y + surfW.z;
  vec3 surfP = sp * uP_landScale;
  float surfH = sphereFbm(surfP, surfW);
  float landMask = smoothstep(uP_landLevel, uP_landLevel + 0.06, surfH);

  // Relief: re-sample the height nudged toward the key light (rotated into
  // the surface frame) and shade by the difference, an emboss that makes
  // the land read as raised.
  vec3 surfL = normalize(vec3(-0.45, 0.55, 0.7));
  surfL = vec3(surfL.x * cr - surfL.z * sr, surfL.y, surfL.x * sr + surfL.z * cr);
  float surfH2 = sphereFbm(surfP + surfL * 0.06, surfW);
  float relief = clamp((surfH - surfH2) * 12.0, -1.0, 1.0);

  // Fine detail so land masses are not flat fills.
  float detail = sphereFbm(sp * uP_landScale * 4.0 + 5.0, surfW);

  lum += uP_land * landMask * (0.15 + lambert) * (0.6 + 0.8 * detail);
  lum += uP_relief * relief * landMask * lambert;
  lum -= uP_ocean * (1.0 - landMask) * (0.4 + 0.6 * lambert);

  // Clouds turn on their own clock, so they drift over the land.
  float cloudC = cos(uP_cloudSpin);
  float cloudS = sin(uP_cloudSpin);
  vec3 cloudP = vec3(n.x * cloudC - n.z * cloudS, n.y, n.x * cloudS + n.z * cloudC);
  vec3 cloudW = abs(cloudP);
  cloudW /= cloudW.x + cloudW.y + cloudW.z;
  // Higher frequency on y squashes the noise into latitude bands.
  float cloudN = sphereFbm(cloudP * vec3(3.0, 6.0, 3.0) + 9.0, cloudW);
  float cloudMask = smoothstep(0.52, 0.68, cloudN);
  lum = mix(lum, 0.25 + lambert, uP_clouds * cloudMask);
  ${LUM_ANCHOR}`

for (const anchor of [MAIN_ANCHOR, LUM_ANCHOR]) {
  if (!shdr14Orb.frag.includes(anchor)) {
    throw new Error(`globe-orb: SHDR-14 shader changed, anchor not found: ${anchor}`)
  }
}

export const globeOrb: OrbVariant = {
  ...shdr14Orb,
  key: 'shdr-14-globe',
  frag: shdr14Orb.frag.replace(MAIN_ANCHOR, HELPERS).replace(LUM_ANCHOR, SURFACE),
  params: [
    ...shdr14Orb.params,
    { key: 'land', label: 'Land amount', min: 0, max: 1, step: 0.01, default: 0.3 },
    { key: 'landScale', label: 'Land scale', min: 0.5, max: 8, step: 0.1, default: 2.2 },
    { key: 'landLevel', label: 'Land level', min: 0, max: 1, step: 0.01, default: 0.47 },
    { key: 'relief', label: 'Relief', min: 0, max: 1, step: 0.01, default: 0.25 },
    { key: 'ocean', label: 'Ocean depth', min: 0, max: 0.5, step: 0.01, default: 0.12 },
    { key: 'clouds', label: 'Clouds', min: 0, max: 1, step: 0.01, default: 0.45 },
    {
      key: 'cloudSpin',
      label: 'Cloud drift',
      min: 0,
      max: 2,
      step: 0.01,
      default: 0.2,
      integrate: true,
    },
  ],
}
