/**
 * Physics Knowledge Base
 *
 * Structured definitions of physical laws derived from the validated solver
 * catalog. Each entry documents:
 *   - governing equations and their symbols
 *   - SI units for every quantity
 *   - validity range and applicability conditions
 *   - known failure modes and common developer bugs
 *   - test templates (what to check to catch wrong implementations)
 *
 * This is the ground truth the review agent consults when analysing
 * simulation code. It is intentionally separate from the browser solvers
 * so it can be imported in Node.js / Trigger.dev worker context.
 */

export interface PhysicsQuantity {
  symbol: string
  description: string
  siUnit: string
}

export interface ValidityRange {
  condition: string
  reason: string
}

export interface TestTemplate {
  id: string
  kind:
    | "analytical_benchmark"  // compare to closed-form reference value
    | "conservation_check"     // energy/momentum/mass must be conserved
    | "unit_consistency"       // dimensional analysis on inputs/outputs
    | "validity_range"         // detect out-of-range usage
    | "sign_convention"        // sign errors produce plausible but wrong results
    | "symmetry"               // symmetric input → symmetric output
  description: string
  /** What to assert (human-readable) */
  assertion: string
  /** Code pattern that signals a possible bug */
  bugPattern?: string
}

export interface PhysicsLaw {
  /** Unique kebab-case ID matching the solver catalog */
  id: string
  name: string
  domain:
    | "classical-mechanics"
    | "fluid-mechanics"
    | "thermodynamics"
    | "circuits"
    | "electromagnetism"
    | "modern-physics"
  /** Primary governing equations */
  equations: string[]
  /** Input/output quantities */
  quantities: PhysicsQuantity[]
  /** Assumptions the law relies on */
  assumptions: string[]
  /** Conditions under which the law breaks down */
  validityRanges: ValidityRange[]
  /** Common developer mistakes when implementing this law */
  commonBugs: string[]
  /** Templates for generating tests */
  testTemplates: TestTemplate[]
  /** Solver function names in the physics catalog */
  solverFunctions: string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Classical Mechanics
// ─────────────────────────────────────────────────────────────────────────────

const SUVAT: PhysicsLaw = {
  id: "kinematics-1d-constant-acceleration",
  name: "1-D Kinematics — Constant Acceleration (SUVAT)",
  domain: "classical-mechanics",
  equations: ["v = u + a·t", "s = u·t + ½·a·t²", "v² = u² + 2·a·s", "s = ½·(u+v)·t"],
  quantities: [
    { symbol: "s", description: "displacement", siUnit: "m" },
    { symbol: "u", description: "initial velocity", siUnit: "m/s" },
    { symbol: "v", description: "final velocity", siUnit: "m/s" },
    { symbol: "a", description: "acceleration", siUnit: "m/s²" },
    { symbol: "t", description: "time interval", siUnit: "s" },
  ],
  assumptions: [
    "constant acceleration throughout the interval",
    "straight-line (1-D) motion",
    "no relativistic effects",
  ],
  validityRanges: [
    { condition: "t ≥ 0", reason: "time must be non-negative for forward integration" },
    { condition: "a is truly constant", reason: "SUVAT fails for variable-force problems" },
    { condition: "v ≪ c", reason: "non-relativistic only" },
  ],
  commonBugs: [
    "mixing km/h and m/s without conversion",
    "forgetting the ½ factor in s = ½·a·t²",
    "applying SUVAT when acceleration varies (e.g. drag, gravity near Earth's surface at large altitudes)",
    "sign error: setting a = +9.8 for a falling object then expecting downward displacement to be positive",
  ],
  testTemplates: [
    {
      id: "suvat-free-fall-benchmark",
      kind: "analytical_benchmark",
      description: "Free fall from rest: after 2 s, displacement = ½·9.80665·4 = 19.613 m",
      assertion: "displacement(u=0, a=9.80665, t=2) ≈ 19.613 m ± 0.001 m",
      bugPattern: "result ≈ 39.226 (missing ½) or −19.613 (sign error)",
    },
    {
      id: "suvat-time-reversal",
      kind: "symmetry",
      description: "Running SUVAT forward then backward must return the initial conditions",
      assertion: "suvat(u, a, t) then suvat(v_final, -a, t) returns u",
    },
    {
      id: "suvat-unit-consistency",
      kind: "unit_consistency",
      description: "Input in km/h should match same input in m/s after conversion",
      assertion: "suvat(72 km/h) === suvat(20 m/s)",
    },
  ],
  solverFunctions: ["solveKinematics1D"],
}

const NEWTON_SECOND_LAW: PhysicsLaw = {
  id: "newton-second-law",
  name: "Newton's Second Law — F = ma",
  domain: "classical-mechanics",
  equations: ["F_net = m·a", "W = m·g", "g_std = 9.80665 m/s²"],
  quantities: [
    { symbol: "F", description: "net force", siUnit: "N" },
    { symbol: "m", description: "mass", siUnit: "kg" },
    { symbol: "a", description: "acceleration", siUnit: "m/s²" },
    { symbol: "W", description: "weight", siUnit: "N" },
    { symbol: "g", description: "gravitational acceleration", siUnit: "m/s²" },
  ],
  assumptions: [
    "inertial reference frame",
    "non-relativistic (v ≪ c)",
    "point mass or rigid body",
  ],
  validityRanges: [
    { condition: "m > 0", reason: "zero mass is unphysical in classical mechanics" },
    { condition: "v ≪ c", reason: "relativistic mass correction required otherwise" },
  ],
  commonBugs: [
    "using g = 10 m/s² (off by ~2% — matters for precision work)",
    "using g = 9.8 instead of 9.80665 (standard gravity)",
    "confusing weight (N) and mass (kg)",
    "forgetting to sum all forces before applying F=ma",
  ],
  testTemplates: [
    {
      id: "f-equals-ma-benchmark",
      kind: "analytical_benchmark",
      description: "1 kg mass under 10 N force: a = 10 m/s²",
      assertion: "acceleration(F=10 N, m=1 kg) = 10.0 m/s²",
    },
    {
      id: "weight-from-mass",
      kind: "analytical_benchmark",
      description: "Weight of 1 kg at standard gravity = 9.80665 N",
      assertion: "weight(m=1 kg) = 9.80665 N ± 0.0001 N",
    },
    {
      id: "f-ma-unit-consistency",
      kind: "unit_consistency",
      description: "Force in kN should produce correct acceleration",
      assertion: "acceleration(F=0.01 kN, m=1 kg) = 10 m/s²",
    },
  ],
  solverFunctions: ["solveNewtonSecondLaw"],
}

const PROJECTILE_MOTION: PhysicsLaw = {
  id: "projectile-motion-2d",
  name: "2-D Projectile Motion (no drag)",
  domain: "classical-mechanics",
  equations: [
    "x(t) = v₀·cos(θ)·t",
    "y(t) = v₀·sin(θ)·t − ½·g·t²",
    "R = v₀²·sin(2θ) / g",
    "H = v₀²·sin²(θ) / (2g)",
    "T = 2·v₀·sin(θ) / g",
  ],
  quantities: [
    { symbol: "v₀", description: "initial speed", siUnit: "m/s" },
    { symbol: "θ", description: "launch angle", siUnit: "rad" },
    { symbol: "R", description: "horizontal range", siUnit: "m" },
    { symbol: "H", description: "maximum height", siUnit: "m" },
    { symbol: "T", description: "time of flight", siUnit: "s" },
    { symbol: "g", description: "gravitational acceleration", siUnit: "m/s²" },
  ],
  assumptions: [
    "no air resistance",
    "flat Earth (constant g)",
    "launch from ground level",
  ],
  validityRanges: [
    { condition: "0° < θ < 90°", reason: "outside this range, no upward component" },
    { condition: "range ≪ Earth's radius", reason: "curvature becomes non-negligible at ~1000 km" },
  ],
  commonBugs: [
    "passing angle in degrees when radians expected (sin/cos will be wrong)",
    "sign error on g — using positive g with y increasing upward and forgetting the minus",
    "computing range using sin(2θ) without the 2 (off by factor ~2)",
    "ignoring drag for high-speed / long-range projectiles",
  ],
  testTemplates: [
    {
      id: "projectile-45-degree",
      kind: "analytical_benchmark",
      description: "θ=45°, v₀=10 m/s → R = v₀²/g = 10²/9.80665 = 10.197 m",
      assertion: "range(v0=10, theta=45°) ≈ 10.197 m ± 0.001 m",
    },
    {
      id: "projectile-angle-unit",
      kind: "unit_consistency",
      description: "Same launch at 45° and π/4 rad must give same range",
      assertion: "range(theta_deg=45) === range(theta_rad=π/4)",
      bugPattern: "result differs by factor sin(45°)/sin(π/4) ≈ 0.0137 (degrees passed to sin)",
    },
    {
      id: "projectile-symmetry",
      kind: "symmetry",
      description: "Complementary angles produce equal range: R(30°) = R(60°)",
      assertion: "range(30°) ≈ range(60°)",
    },
    {
      id: "projectile-energy-conservation",
      kind: "conservation_check",
      description: "Total mechanical energy at apex = total energy at launch",
      assertion: "½m·v₀² = ½m·vx² + m·g·H",
    },
  ],
  solverFunctions: ["solveProjectileMotion"],
}

const WORK_ENERGY: PhysicsLaw = {
  id: "work-energy-theorem",
  name: "Work-Energy Theorem",
  domain: "classical-mechanics",
  equations: [
    "W = F·d·cos(φ)",
    "KE = ½·m·v²",
    "PE_grav = m·g·h",
    "PE_spring = ½·k·x²",
    "W_net = ΔKE",
    "P = W / t = F·v",
  ],
  quantities: [
    { symbol: "W", description: "work done", siUnit: "J" },
    { symbol: "KE", description: "kinetic energy", siUnit: "J" },
    { symbol: "PE", description: "potential energy", siUnit: "J" },
    { symbol: "P", description: "power", siUnit: "W" },
    { symbol: "F", description: "force", siUnit: "N" },
    { symbol: "d", description: "displacement", siUnit: "m" },
    { symbol: "φ", description: "angle between F and d", siUnit: "rad" },
  ],
  assumptions: [
    "conservative forces for PE calculation",
    "no energy dissipation unless explicitly modelled",
  ],
  validityRanges: [
    { condition: "v ≪ c", reason: "relativistic KE = (γ−1)mc² at high speeds" },
    { condition: "spring within elastic limit", reason: "Hooke's law breaks down beyond elastic limit" },
  ],
  commonBugs: [
    "forgetting the ½ factor in KE = ½mv²",
    "forgetting the ½ factor in PE_spring = ½kx²",
    "using scalar distance instead of displacement dot product",
    "mixing KE (joules) with momentum (kg·m/s)",
  ],
  testTemplates: [
    {
      id: "ke-benchmark",
      kind: "analytical_benchmark",
      description: "2 kg at 3 m/s: KE = ½·2·9 = 9 J",
      assertion: "KE(m=2 kg, v=3 m/s) = 9.0 J",
      bugPattern: "result ≈ 18 J (missing ½)",
    },
    {
      id: "energy-conservation-fall",
      kind: "conservation_check",
      description: "Object dropped from height h: KE at bottom = PE at top",
      assertion: "½·m·v_final² ≈ m·g·h (to within numerical tolerance)",
    },
  ],
  solverFunctions: ["solveWorkEnergy"],
}

const CIRCULAR_MOTION: PhysicsLaw = {
  id: "circular-motion",
  name: "Uniform Circular Motion",
  domain: "classical-mechanics",
  equations: [
    "a_c = v²/r = ω²·r",
    "F_c = m·v²/r",
    "ω = 2π/T = 2π·f",
    "v = ω·r",
  ],
  quantities: [
    { symbol: "a_c", description: "centripetal acceleration", siUnit: "m/s²" },
    { symbol: "F_c", description: "centripetal force", siUnit: "N" },
    { symbol: "v", description: "tangential speed", siUnit: "m/s" },
    { symbol: "r", description: "radius", siUnit: "m" },
    { symbol: "ω", description: "angular velocity", siUnit: "rad/s" },
    { symbol: "T", description: "period", siUnit: "s" },
  ],
  assumptions: [
    "uniform (constant speed) circular motion",
    "2-D motion in a plane",
    "rigid constraint (no spring effects)",
  ],
  validityRanges: [
    { condition: "r > 0", reason: "zero radius is unphysical" },
    { condition: "constant speed", reason: "non-uniform requires tangential acceleration term" },
  ],
  commonBugs: [
    "using diameter instead of radius in v²/r",
    "confusing centripetal (inward) and centrifugal (fictitious outward) force",
    "using rpm instead of rad/s without converting",
  ],
  testTemplates: [
    {
      id: "circular-acceleration-benchmark",
      kind: "analytical_benchmark",
      description: "r=1m, v=2 m/s → a_c = 4 m/s²",
      assertion: "centripetal_acceleration(r=1, v=2) = 4.0 m/s²",
    },
    {
      id: "circular-period-frequency",
      kind: "unit_consistency",
      description: "ω=2π rad/s → T=1s, f=1Hz",
      assertion: "period(omega=2π) = 1.0 s and freq(omega=2π) = 1.0 Hz",
    },
  ],
  solverFunctions: ["solveCircularMotion"],
}

const SPRING_MASS: PhysicsLaw = {
  id: "spring-mass-oscillator",
  name: "Spring-Mass Oscillator (1-DOF)",
  domain: "classical-mechanics",
  equations: [
    "m·ẍ + b·ẋ + k·x = F₀·cos(ω_d·t)",
    "ω_n = √(k/m)",
    "ζ = b / (2·√(k·m))",
    "ω_d = ω_n·√(1−ζ²)  (underdamped, ζ<1)",
  ],
  quantities: [
    { symbol: "k", description: "spring constant", siUnit: "N/m" },
    { symbol: "m", description: "mass", siUnit: "kg" },
    { symbol: "b", description: "damping coefficient", siUnit: "N·s/m" },
    { symbol: "ω_n", description: "natural frequency", siUnit: "rad/s" },
    { symbol: "ζ", description: "damping ratio", siUnit: "dimensionless" },
    { symbol: "x", description: "displacement", siUnit: "m" },
  ],
  assumptions: [
    "linear spring (Hooke's law)",
    "linear viscous damping",
    "1 degree of freedom",
    "constant coefficients",
  ],
  validityRanges: [
    { condition: "k > 0", reason: "negative stiffness is unstable" },
    { condition: "m > 0", reason: "zero mass is unphysical" },
    { condition: "|x| within elastic limit", reason: "Hooke's law breaks beyond elastic limit" },
    { condition: "ζ < 1 for oscillation", reason: "critically or over-damped produces exponential decay, not oscillation" },
  ],
  commonBugs: [
    "forgetting to divide b by 2√(km) to get ζ — using raw b as damping ratio",
    "using ω_d (damped) for resonance frequency instead of ω_n",
    "timestep too large for RK4 stability: dt must be ≪ T_n = 2π/ω_n",
    "initial condition displacement in mm when solver expects m",
  ],
  testTemplates: [
    {
      id: "spring-natural-frequency",
      kind: "analytical_benchmark",
      description: "k=100 N/m, m=1 kg → ω_n = 10 rad/s, T_n = 0.6283 s",
      assertion: "natural_frequency(k=100, m=1) = 10.0 rad/s ± 0.001",
    },
    {
      id: "spring-energy-conservation-undamped",
      kind: "conservation_check",
      description: "Undamped oscillator: total energy = KE + PE = ½kA² (constant)",
      assertion: "max(½m·ẋ² + ½k·x²) ≈ min(½m·ẋ² + ½k·x²) ± 0.1%",
    },
    {
      id: "spring-timestep-stability",
      kind: "validity_range",
      description: "RK4 becomes unstable when dt > T_n/10",
      assertion: "decreasing dt by 10× changes amplitude by < 0.1%",
    },
  ],
  solverFunctions: ["solveSpringMass"],
}

// ─────────────────────────────────────────────────────────────────────────────
// Fluid Mechanics
// ─────────────────────────────────────────────────────────────────────────────

const BERNOULLI: PhysicsLaw = {
  id: "bernoulli-equation",
  name: "Bernoulli's Equation",
  domain: "fluid-mechanics",
  equations: [
    "p + ½·ρ·v² + ρ·g·h = constant",
    "p₁ + ½·ρ·v₁² + ρ·g·h₁ = p₂ + ½·ρ·v₂² + ρ·g·h₂",
  ],
  quantities: [
    { symbol: "p", description: "static pressure", siUnit: "Pa" },
    { symbol: "ρ", description: "fluid density", siUnit: "kg/m³" },
    { symbol: "v", description: "flow velocity", siUnit: "m/s" },
    { symbol: "h", description: "elevation", siUnit: "m" },
  ],
  assumptions: [
    "inviscid (no viscosity) flow",
    "steady (time-independent) flow",
    "incompressible fluid",
    "flow along a single streamline",
    "no work added by pumps or extracted by turbines (unless accounted)",
  ],
  validityRanges: [
    { condition: "Re ≫ 1 (viscosity negligible)", reason: "viscous losses invalidate Bernoulli; use Darcy-Weisbach for pipe flow" },
    { condition: "Ma < 0.3 (incompressible)", reason: "compressibility effects require full gas dynamics at Ma > 0.3" },
    { condition: "no phase change", reason: "cavitation violates incompressibility assumption" },
  ],
  commonBugs: [
    "applying Bernoulli to viscous pipe flow without Darcy-Weisbach head loss correction",
    "using gage pressure on one side and absolute on the other",
    "forgetting ½ factor in dynamic pressure term",
    "applying across streamlines (Bernoulli only applies along a streamline)",
  ],
  testTemplates: [
    {
      id: "bernoulli-pipe-constriction",
      kind: "analytical_benchmark",
      description: "Venturi: v₁=1 m/s, A₁=0.01 m², A₂=0.005 m² → v₂=2 m/s by continuity",
      assertion: "v₂ = 2·v₁ when A₂ = A₁/2",
    },
    {
      id: "bernoulli-pressure-recovery",
      kind: "conservation_check",
      description: "Pressure + dynamic pressure conserved along streamline",
      assertion: "p₁ + ½ρv₁² = p₂ + ½ρv₂² (horizontal flow, same elevation)",
    },
    {
      id: "bernoulli-unit-pressure",
      kind: "unit_consistency",
      description: "Input pressure in bar and Pa must give same velocity",
      assertion: "v(p=1 bar) = v(p=100000 Pa)",
    },
  ],
  solverFunctions: ["solveBernoulli"],
}

const REYNOLDS_NUMBER: PhysicsLaw = {
  id: "reynolds-number",
  name: "Reynolds Number",
  domain: "fluid-mechanics",
  equations: [
    "Re = ρ·v·L / μ = v·L / ν",
    "Laminar: Re < 2300 (pipe)",
    "Turbulent: Re > 4000 (pipe)",
  ],
  quantities: [
    { symbol: "Re", description: "Reynolds number", siUnit: "dimensionless" },
    { symbol: "ρ", description: "fluid density", siUnit: "kg/m³" },
    { symbol: "v", description: "characteristic velocity", siUnit: "m/s" },
    { symbol: "L", description: "characteristic length", siUnit: "m" },
    { symbol: "μ", description: "dynamic viscosity", siUnit: "Pa·s" },
    { symbol: "ν", description: "kinematic viscosity", siUnit: "m²/s" },
  ],
  assumptions: [
    "Newtonian fluid",
    "single-phase flow",
    "internal pipe flow for the 2300/4000 transition thresholds",
  ],
  validityRanges: [
    { condition: "L = hydraulic diameter for pipes", reason: "using geometric diameter for non-circular ducts causes Re error" },
    { condition: "steady fully-developed flow", reason: "entrance effects and pulsation shift the critical Re" },
  ],
  commonBugs: [
    "using dynamic viscosity μ where kinematic viscosity ν = μ/ρ is expected (off by density factor)",
    "using diameter instead of hydraulic diameter for non-circular cross-sections",
    "confusing laminar/turbulent thresholds for external vs pipe flow",
  ],
  testTemplates: [
    {
      id: "re-water-pipe",
      kind: "analytical_benchmark",
      description: "Water (μ=0.001 Pa·s, ρ=1000) at v=1 m/s, D=0.01 m → Re = 10000",
      assertion: "Re(rho=1000, v=1, L=0.01, mu=0.001) = 10000",
    },
    {
      id: "re-dimensionless",
      kind: "unit_consistency",
      description: "Re must be dimensionless: check ρ·v·L / μ has units that cancel",
      assertion: "[kg/m³ · m/s · m / (Pa·s)] = [kg/m³ · m/s · m · m·s/kg] = dimensionless",
    },
  ],
  solverFunctions: ["solveReynoldsNumber"],
}

// ─────────────────────────────────────────────────────────────────────────────
// Thermodynamics
// ─────────────────────────────────────────────────────────────────────────────

const IDEAL_GAS: PhysicsLaw = {
  id: "ideal-gas-law",
  name: "Ideal Gas Law — PV = nRT",
  domain: "thermodynamics",
  equations: [
    "PV = nRT",
    "R = 8.314 J/(mol·K)",
    "Isothermal: P₁V₁ = P₂V₂",
    "Isobaric: V₁/T₁ = V₂/T₂",
    "Isochoric: P₁/T₁ = P₂/T₂",
    "Adiabatic: PV^γ = constant",
  ],
  quantities: [
    { symbol: "P", description: "absolute pressure", siUnit: "Pa" },
    { symbol: "V", description: "volume", siUnit: "m³" },
    { symbol: "n", description: "amount of substance", siUnit: "mol" },
    { symbol: "T", description: "absolute temperature", siUnit: "K" },
    { symbol: "R", description: "universal gas constant", siUnit: "J/(mol·K)" },
  ],
  assumptions: [
    "ideal gas (no intermolecular forces, point-mass molecules)",
    "temperature in Kelvin (absolute scale)",
    "pressure is absolute (not gauge)",
  ],
  validityRanges: [
    { condition: "T ≫ T_condensation", reason: "real gas behaviour near condensation" },
    { condition: "P ≪ critical pressure", reason: "van der Waals corrections at high pressure" },
  ],
  commonBugs: [
    "temperature in Celsius instead of Kelvin (off by 273.15 K)",
    "using gauge pressure instead of absolute pressure",
    "using R = 8.314 with inconsistent units (e.g. litres instead of m³)",
    "wrong γ (ratio of specific heats) for the gas species",
  ],
  testTemplates: [
    {
      id: "ideal-gas-stp",
      kind: "analytical_benchmark",
      description: "1 mol at STP (T=273.15 K, P=101325 Pa): V = 22.414 L",
      assertion: "volume(n=1, T=273.15 K, P=101325 Pa) ≈ 0.022414 m³",
    },
    {
      id: "ideal-gas-temperature-unit",
      kind: "unit_consistency",
      description: "0°C and 273.15 K must give the same pressure",
      assertion: "P(T=0°C) === P(T=273.15 K)",
      bugPattern: "result off by ~273/273.15 ≈ 0.9995 factor or wildly different (T=0 → P=0)",
    },
    {
      id: "ideal-gas-isothermal",
      kind: "conservation_check",
      description: "Isothermal: P₁V₁ = P₂V₂",
      assertion: "P₁·V₁ = P₂·V₂ after isothermal compression",
    },
  ],
  solverFunctions: ["solveIdealGasProcess"],
}

// ─────────────────────────────────────────────────────────────────────────────
// Circuits
// ─────────────────────────────────────────────────────────────────────────────

const OHM_LAW: PhysicsLaw = {
  id: "ohm-law",
  name: "Ohm's Law — V = IR",
  domain: "circuits",
  equations: ["V = I·R", "P = I·V = I²·R = V²/R", "R_series = ΣRᵢ", "1/R_parallel = Σ(1/Rᵢ)"],
  quantities: [
    { symbol: "V", description: "voltage", siUnit: "V" },
    { symbol: "I", description: "current", siUnit: "A" },
    { symbol: "R", description: "resistance", siUnit: "Ω" },
    { symbol: "P", description: "power dissipated", siUnit: "W" },
  ],
  assumptions: [
    "linear (Ohmic) resistor — resistance independent of voltage/current",
    "DC steady state or low-frequency AC",
    "no temperature dependence of resistance",
  ],
  validityRanges: [
    { condition: "R > 0", reason: "superconductors and short circuits violate Ohm's law" },
    { condition: "temperature stable", reason: "resistance is temperature-dependent for real conductors" },
  ],
  commonBugs: [
    "adding resistances in parallel using series formula (R_parallel ≠ ΣRᵢ)",
    "forgetting reciprocal: 1/R_parallel = Σ(1/Rᵢ) — not R_parallel = Σ(1/Rᵢ)",
    "confusing voltage divider (series) and current divider (parallel) ratios",
  ],
  testTemplates: [
    {
      id: "ohm-benchmark",
      kind: "analytical_benchmark",
      description: "V=12V, R=4Ω → I=3A, P=36W",
      assertion: "current(V=12, R=4) = 3.0 A and power = 36.0 W",
    },
    {
      id: "parallel-resistance",
      kind: "analytical_benchmark",
      description: "Two equal R in parallel → R/2",
      assertion: "R_parallel(R, R) = R/2",
      bugPattern: "result = 2R (series formula applied by mistake)",
    },
  ],
  solverFunctions: ["solveOhmLaw"],
}

const RC_CIRCUIT: PhysicsLaw = {
  id: "rc-circuit-transient",
  name: "RC Circuit — Transient Response",
  domain: "circuits",
  equations: [
    "V_C(t) = V_s·(1 − e^(−t/τ))  [charging]",
    "V_C(t) = V_0·e^(−t/τ)         [discharging]",
    "τ = R·C",
    "t₁/₂ = τ·ln(2) ≈ 0.693·τ",
  ],
  quantities: [
    { symbol: "V_C", description: "capacitor voltage", siUnit: "V" },
    { symbol: "τ", description: "time constant", siUnit: "s" },
    { symbol: "R", description: "resistance", siUnit: "Ω" },
    { symbol: "C", description: "capacitance", siUnit: "F" },
  ],
  assumptions: [
    "ideal capacitor (no ESR)",
    "ideal resistor",
    "step voltage source",
    "initial charge either zero (charge) or V₀ (discharge)",
  ],
  validityRanges: [
    { condition: "t ≥ 0", reason: "causal system" },
    { condition: "R·C > 0", reason: "negative time constant diverges" },
  ],
  commonBugs: [
    "τ in ms but t in s — curve appears 1000× too slow",
    "using (1 − e^(t/τ)) without the minus in exponent (exponential growth, not charging curve)",
    "initial condition V₀ = 0 when capacitor was pre-charged",
  ],
  testTemplates: [
    {
      id: "rc-half-life",
      kind: "analytical_benchmark",
      description: "At t = τ, V_C = V_s·(1−1/e) ≈ 0.632·V_s",
      assertion: "V_C(t=τ) / V_s ≈ 0.6321 ± 0.0001",
    },
    {
      id: "rc-charge-discharge-inverse",
      kind: "symmetry",
      description: "Discharge from V₀ is mirror of charge to V₀",
      assertion: "V_discharge(t) + V_charge(t) = V₀ for all t",
    },
  ],
  solverFunctions: ["solveRCCircuit"],
}

// ─────────────────────────────────────────────────────────────────────────────
// Electromagnetism
// ─────────────────────────────────────────────────────────────────────────────

const COULOMBS_LAW: PhysicsLaw = {
  id: "coulombs-law",
  name: "Coulomb's Law — Electrostatic Force",
  domain: "electromagnetism",
  equations: [
    "F = k_e·q₁·q₂ / r²",
    "k_e = 8.98755 × 10⁹ N·m²/C²",
    "E = k_e·q / r²",
    "V = k_e·q / r",
  ],
  quantities: [
    { symbol: "F", description: "electrostatic force", siUnit: "N" },
    { symbol: "q₁, q₂", description: "point charges", siUnit: "C" },
    { symbol: "r", description: "separation", siUnit: "m" },
    { symbol: "k_e", description: "Coulomb constant", siUnit: "N·m²/C²" },
    { symbol: "E", description: "electric field", siUnit: "N/C = V/m" },
    { symbol: "V", description: "electric potential", siUnit: "V" },
  ],
  assumptions: [
    "point charges (dimensionless)",
    "static charges (no magnetic effects)",
    "vacuum (ε = ε₀)",
  ],
  validityRanges: [
    { condition: "r > 0 (non-overlapping charges)", reason: "1/r² diverges at r=0" },
    { condition: "charges static", reason: "moving charges produce magnetic fields (Biot-Savart)" },
  ],
  commonBugs: [
    "using k_e = 9×10⁹ (approximate) when precision matters",
    "forgetting sign: opposite charges attract (negative F), same repel (positive F)",
    "using distance in cm without converting to metres (off by 10⁻⁴ in F)",
  ],
  testTemplates: [
    {
      id: "coulomb-force-benchmark",
      kind: "analytical_benchmark",
      description: "q₁=q₂=1μC, r=1m → F = 8.988 mN",
      assertion: "F(q1=1e-6, q2=1e-6, r=1) ≈ 8.98755e-3 N",
    },
    {
      id: "coulomb-inverse-square",
      kind: "analytical_benchmark",
      description: "Doubling separation quarters force",
      assertion: "F(r=2) = F(r=1)/4",
    },
  ],
  solverFunctions: ["solveCoulombsLaw"],
}

// ─────────────────────────────────────────────────────────────────────────────
// Modern Physics
// ─────────────────────────────────────────────────────────────────────────────

const SPECIAL_RELATIVITY: PhysicsLaw = {
  id: "special-relativity",
  name: "Special Relativity — Lorentz Factor",
  domain: "modern-physics",
  equations: [
    "γ = 1 / √(1 − β²)",
    "β = v/c",
    "t' = γ·t  (time dilation)",
    "L' = L/γ  (length contraction)",
    "p = γ·m·v",
    "E_total = γ·m·c²",
    "E_rest = m·c²",
    "KE = (γ−1)·m·c²",
  ],
  quantities: [
    { symbol: "γ", description: "Lorentz factor", siUnit: "dimensionless" },
    { symbol: "β", description: "velocity as fraction of c", siUnit: "dimensionless" },
    { symbol: "v", description: "object velocity", siUnit: "m/s" },
    { symbol: "c", description: "speed of light", siUnit: "m/s" },
    { symbol: "m", description: "rest mass", siUnit: "kg" },
  ],
  assumptions: [
    "inertial reference frame",
    "rest mass is constant (no matter-energy conversion reactions)",
  ],
  validityRanges: [
    { condition: "0 ≤ v < c", reason: "v ≥ c produces imaginary γ; unphysical" },
    { condition: "β ≪ 1 for Newtonian approximation", reason: "classical mechanics valid only when β < 0.1 (γ within ~0.5% of 1)" },
  ],
  commonBugs: [
    "using v = c in the formula (division by zero / NaN)",
    "computing γ incorrectly: 1/(1−β²) instead of 1/√(1−β²)",
    "applying classical KE = ½mv² when v > 0.1c (error > 1%)",
  ],
  testTemplates: [
    {
      id: "lorentz-low-velocity",
      kind: "analytical_benchmark",
      description: "v=0 → γ=1, β=0 (rest frame)",
      assertion: "gamma(v=0) = 1.0 exactly",
    },
    {
      id: "lorentz-half-c",
      kind: "analytical_benchmark",
      description: "v=0.5c → γ = 1/√0.75 ≈ 1.1547",
      assertion: "gamma(v=0.5c) ≈ 1.1547 ± 0.0001",
    },
    {
      id: "relativistic-energy-mass",
      kind: "conservation_check",
      description: "E_total² = (pc)² + (mc²)² (four-momentum magnitude)",
      assertion: "E_total² = (p·c)² + (m·c²)²",
    },
  ],
  solverFunctions: ["solveSpecialRelativity"],
}

const RADIOACTIVE_DECAY: PhysicsLaw = {
  id: "radioactive-decay",
  name: "Radioactive Decay — Exponential",
  domain: "modern-physics",
  equations: [
    "N(t) = N₀·e^(−λt)",
    "A(t) = λ·N(t)",
    "t₁/₂ = ln(2)/λ ≈ 0.6931/λ",
    "τ = 1/λ  (mean lifetime)",
  ],
  quantities: [
    { symbol: "N", description: "number of undecayed nuclei", siUnit: "dimensionless" },
    { symbol: "N₀", description: "initial count", siUnit: "dimensionless" },
    { symbol: "λ", description: "decay constant", siUnit: "s⁻¹" },
    { symbol: "A", description: "activity", siUnit: "Bq = s⁻¹" },
    { symbol: "t₁/₂", description: "half-life", siUnit: "s" },
  ],
  assumptions: [
    "each decay event is independent",
    "constant decay rate (no induced fission, no neutron activation)",
    "single decay channel",
  ],
  validityRanges: [
    { condition: "N₀ ≫ 1", reason: "deterministic exponential breaks down for very small samples (stochastic effects dominate)" },
  ],
  commonBugs: [
    "confusing λ (decay constant, s⁻¹) with t₁/₂ (half-life, s)",
    "half-life in years but λ computed from seconds (unit mismatch)",
    "using N(t) = N₀·(1/2)^(t/t₁/₂) but computing t/t₁/₂ in wrong units",
  ],
  testTemplates: [
    {
      id: "decay-half-life-check",
      kind: "analytical_benchmark",
      description: "At t = t₁/₂, N = N₀/2",
      assertion: "N(t=t_half) = 0.5·N₀ ± 0.001%",
    },
    {
      id: "decay-two-half-lives",
      kind: "analytical_benchmark",
      description: "At t = 2·t₁/₂, N = N₀/4",
      assertion: "N(t=2·t_half) = 0.25·N₀",
    },
  ],
  solverFunctions: ["solveRadioactiveDecay"],
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export const PHYSICS_LAWS: PhysicsLaw[] = [
  // Classical mechanics
  SUVAT,
  NEWTON_SECOND_LAW,
  PROJECTILE_MOTION,
  WORK_ENERGY,
  CIRCULAR_MOTION,
  SPRING_MASS,
  // Fluid mechanics
  BERNOULLI,
  REYNOLDS_NUMBER,
  // Thermodynamics
  IDEAL_GAS,
  // Circuits
  OHM_LAW,
  RC_CIRCUIT,
  // Electromagnetism
  COULOMBS_LAW,
  // Modern physics
  SPECIAL_RELATIVITY,
  RADIOACTIVE_DECAY,
]

/** Look up a law by its canonical id */
export function getLaw(id: string): PhysicsLaw | undefined {
  return PHYSICS_LAWS.find((law) => law.id === id)
}

/** Get all laws for a domain */
export function getLawsByDomain(
  domain: PhysicsLaw["domain"]
): PhysicsLaw[] {
  return PHYSICS_LAWS.filter((law) => law.domain === domain)
}

/** All law IDs, for use in prompts and validation */
export const LAW_IDS = PHYSICS_LAWS.map((l) => l.id)

/** Serialise the knowledge base as a compact string for LLM context injection */
export function serializeKnowledgeBase(): string {
  return PHYSICS_LAWS.map((law) => {
    const lines: string[] = [
      `## ${law.name}  [id: ${law.id}]`,
      `Domain: ${law.domain}`,
      `Governing equations: ${law.equations.join(" | ")}`,
      `Key quantities: ${law.quantities.map((q) => `${q.symbol} (${q.description}, SI: ${q.siUnit})`).join(", ")}`,
      `Assumptions: ${law.assumptions.join("; ")}`,
      `Validity: ${law.validityRanges.map((v) => `${v.condition} — ${v.reason}`).join("; ")}`,
      `Common bugs: ${law.commonBugs.join("; ")}`,
      `Solver functions: ${law.solverFunctions.join(", ")}`,
    ]
    return lines.join("\n")
  }).join("\n\n")
}
