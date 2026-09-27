# examples/

Sample code for demonstrating PhysicsReview.

## spring_mass_sim.py

A damped spring-mass oscillator with aerodynamic drag, integrated with classic 4th-order Runge–Kutta (RK4):

```
m x'' + b x' + k x + F_drag(v) = 0
```

The file contains **5 planted physics bugs**. None of them are marked in the code, so it reads like a real simulation. It runs cleanly with no errors or warnings, but several of the numbers it prints are wrong. PhysicsReview should catch all five.

Default parameters: `m = 1 kg`, `k = 40 N/m`, `b = 0.8 N·s/m`, `Cd = 1.05`, `A = 0.01 m²`, `P = 101325 Pa`, `T = 25 °C`, `dt = 0.25 s`, amplitude `0.1 m`, phase `30°`.

### Planted bugs

| # | Location | Bug | Correct version | Effect |
|---|---|---|---|---|
| 1 | `kinetic_energy()` | `m * v**2` | `0.5 * m * v**2` | Kinetic energy 2× too high, so total energy is not conserved even with exact dynamics |
| 2 | `simulate()` default | `dt = 0.25` s, but `T_n = 0.993` s, so `T_n / 10 = 0.099` s | `dt ≤ T_n / 10` | RK4 stays stable (`ω_n·dt = 1.58`, limit ≈ 2.83) but damps the solution numerically. With `b = 0` and no drag, it still loses **99.8%** of its energy in 10 s |
| 3 | `damping_ratio()` | Returns raw `b` | `b / (2 * sqrt(k * m))` | Reports `ζ = 0.800` instead of `0.063`, making the system look 12.6× more damped than it is |
| 4 | `air_density()` | Temperature in °C passed to `ρ = P / (R T)` | `temperature + 273.15` | Air density `14.12 kg/m³` instead of `1.18 kg/m³` (12× too high), so drag is 12× too strong |
| 5 | `initial_state()` | `np.cos(phase_deg)` / `np.sin(phase_deg)`: degrees where radians are expected | `np.radians(phase_deg)` | `x0 = 0.015 m` instead of `0.087 m`, and `v0 = +0.625 m/s` instead of `−0.316 m/s` (wrong sign) |

### Output

Running `python3 spring_mass_sim.py` prints:

```
Natural frequency : 6.325 rad/s
Natural period    : 0.993 s
Damping ratio     : 0.800
Response type     : underdamped
Air density       : 14.12 kg/m^3
Initial energy    : 0.39524 J
Final energy      : 0.00000 J
Final position    : -0.00009 m
```

Natural frequency and period are correct. They serve as the analytical benchmark. Damping ratio and air density are visibly wrong. The energy values are wrong because of bugs 1, 2 and 5 combined.

### Expected PhysicsReview output

**Findings**

- **Critical:** bug 1 (missing ½), bug 4 (Celsius instead of Kelvin), bug 5 (degrees instead of radians)
- **Warning:** bug 2 (time step too large for accurate RK4), bug 3 (raw `b` used as the damping ratio)

**Generated tests**

- **Analytical benchmark:** `ω_n = √(k/m) = 6.325 rad/s`, `T_n = 0.993 s`
- **Energy conservation:** with `b = 0` and `Cd = 0`, `½mv² + ½kx²` stays constant within a tolerance. It fails on this file. Bug 1 alone makes the computed energy swing by about 50%. With bug 1 fixed, `dt = 0.25 s` still loses 99.8% in 10 s, and `dt = 0.05 s` drifts only about 0.3%.
- **Unit consistency:** air density at 25 °C should be about `1.18 kg/m³`. A phase of 30° and `π/6` rad should give the same initial state.
- **Damping ratio:** `ζ = b / (2√(km)) = 0.063` for the default parameters.

**Law mappings**

| Function | Law ID | Notes |
|---|---|---|
| `natural_frequency`, `natural_period`, `damping_ratio`, `spring_potential_energy`, `rk4_step`, `simulate` | `spring-mass-oscillator` | |
| `acceleration` | `newton-second-law` | |
| `kinetic_energy`, `total_energy` | `work-energy-theorem` | |
| `air_density` | `ideal-gas-law` | Specific-gas-constant form, `ρ = P / (R_specific T)` |
| `drag_force` | none | Quadratic drag is not in the 14-law knowledge base, so this mapping may come back with low confidence |

Exact wording, severity and test count depend on the LLM provider and model tier.