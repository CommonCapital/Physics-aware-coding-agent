# examples/

This directory contains sample code for demonstrating PhysicsReview.

## spring_mass_sim.py

A Python spring-mass RK4 integrator with **5 deliberately planted physics bugs**.
Upload this file to PhysicsReview to see all five caught automatically.

### Planted bugs

| # | Location | Bug | Effect |
|---|---|---|---|
| 1 | `natural_frequency()` | `k/m` instead of `sqrt(k/m)` | Frequency is 10× too large for k=100, m=1 |
| 2 | `kinetic_energy()` | `m * v**2` instead of `0.5 * m * v**2` | Energy is 2× too high |
| 3 | `projectile_range()` | Degrees passed to `sin()` | Range wrong by factor ~50 at 45° |
| 4 | `ideal_gas_pressure()` | Celsius used instead of Kelvin | Pressure off by factor T_C/T_K ≈ 0 at 0°C → division/zero |
| 5 | `simulate()` | `dt = T_n * 2` instead of `dt < T_n/10` | RK4 unstable — position diverges to inf |

### Expected PhysicsReview output

- **5 critical findings** (one per bug)
- **~8 generated tests** covering analytical benchmarks, conservation check, unit consistency
- **Law mappings**: spring-mass-oscillator, newton-second-law, projectile-motion-2d, ideal-gas-law, kinematics-1d-constant-acceleration
