import { assertFiniteNumber } from "./validation.js"

const unitDefinitions = {
  length: {
    mm: 1e-3,
    cm: 1e-2,
    m: 1,
    km: 1e3,
  },
  time: {
    ms: 1e-3,
    s: 1,
    min: 60,
    h: 3600,
  },
  mass: {
    mg: 1e-6,
    g: 1e-3,
    kg: 1,
  },
  force: {
    N: 1,
    kN: 1e3,
  },
  pressure: {
    Pa: 1,
    kPa: 1e3,
    MPa: 1e6,
    GPa: 1e9,
  },
  velocity: {
    "m/s": 1,
    "km/h": 1 / 3.6,
  },
  acceleration: {
    "m/s^2": 1,
    "km/s^2": 1e3,
  },
  forcePerLength: {
    "N/m": 1,
    "kN/m": 1e3,
  },
  secondMomentOfArea: {
    "mm^4": 1e-12,
    "cm^4": 1e-8,
    "m^4": 1,
  },
  angle: {
    rad: 1,
    deg: Math.PI / 180,
  },
}

export const SUPPORTED_UNITS = Object.freeze(
  Object.fromEntries(
    Object.entries(unitDefinitions).map(([quantity, units]) => [
      quantity,
      Object.freeze(Object.keys(units)),
    ])
  )
)

const unitsBySymbol = new Map()
for (const [quantity, units] of Object.entries(unitDefinitions)) {
  for (const [symbol, scaleToSi] of Object.entries(units)) {
    unitsBySymbol.set(symbol, { quantity, scaleToSi })
  }
}

function getUnit(symbol, field) {
  if (typeof symbol !== "string" || !unitsBySymbol.has(symbol)) {
    throw new RangeError(`${field} contains unsupported unit ${String(symbol)}`)
  }

  return unitsBySymbol.get(symbol)
}

export function convertUnit(value, fromUnit, toUnit) {
  assertFiniteNumber(value, "value")
  const source = getUnit(fromUnit, "fromUnit")
  const target = getUnit(toUnit, "toUnit")

  if (source.quantity !== target.quantity) {
    throw new RangeError(
      `fromUnit ${fromUnit} is incompatible with toUnit ${toUnit}`
    )
  }

  return (value * source.scaleToSi) / target.scaleToSi
}
