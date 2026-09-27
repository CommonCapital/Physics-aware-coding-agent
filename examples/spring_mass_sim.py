"""
spring_mass_sim.py — Spring-mass RK4 integrator

Demo file for PhysicsReview with 5 deliberately planted physics bugs.
Run `physicsreview` to find them all.
"""

import math

# ── Bug 1: wrong natural frequency (missing sqrt) ────────────────────────────
# Correct: omega_n = sqrt(k / m)
# Planted: omega_n = k / m  (missing the square root)
def natural_frequency(k, m):
    """Returns the natural frequency of a spring-mass system in rad/s."""
    return k / m  # BUG: should be math.sqrt(k / m)


# ── Bug 2: kinetic energy missing the ½ factor ────────────────────────────────
# Correct: KE = 0.5 * m * v**2
# Planted: KE = m * v**2  (off by factor of 2)
def kinetic_energy(m, v):
    """Returns kinetic energy in joules."""
    return m * v**2  # BUG: should be 0.5 * m * v**2


# ── Bug 3: angle in degrees passed to sin/cos ─────────────────────────────────
# Correct: use radians, or convert with math.radians(theta)
# Planted: raw degrees used directly
def projectile_range(v0, theta_deg, g=9.80665):
    """Returns horizontal range of a projectile in metres."""
    # BUG: sin and cos expect radians, not degrees
    return (v0**2 * math.sin(2 * theta_deg)) / g


# ── Bug 4: temperature in Celsius instead of Kelvin ──────────────────────────
# Correct: use absolute temperature T_kelvin = T_celsius + 273.15
# Planted: Celsius passed directly to PV = nRT
def ideal_gas_pressure(n, T_celsius, V, R=8.314):
    """Returns pressure in Pa using the ideal gas law PV = nRT."""
    return (n * R * T_celsius) / V  # BUG: should be T_celsius + 273.15


# ── Bug 5: RK4 time step too large ───────────────────────────────────────────
# Correct: dt should be < T_n / 10 for stability
# Planted: dt = T_n * 2 (guaranteed unstable)
def simulate(k=100.0, m=1.0, x0=0.1, v0=0.0, duration=2.0):
    """
    Simulates a spring-mass system using RK4.
    Returns list of (time, position, velocity) tuples.
    """
    omega_n = math.sqrt(k / m)
    T_n = 2 * math.pi / omega_n          # natural period ≈ 0.628 s

    dt = T_n * 2                          # BUG: dt must be < T_n/10 for RK4 stability
                                          # This value (≈1.26 s) will cause blow-up

    def derivatives(x, v):
        ax = -(k / m) * x
        return v, ax

    states = [(0.0, x0, v0)]
    t, x, v = 0.0, x0, v0

    while t < duration:
        v1, a1 = derivatives(x, v)
        v2, a2 = derivatives(x + 0.5*dt*v1, v + 0.5*dt*a1)
        v3, a3 = derivatives(x + 0.5*dt*v2, v + 0.5*dt*a2)
        v4, a4 = derivatives(x + dt*v3, v + dt*a3)

        x += (dt / 6) * (v1 + 2*v2 + 2*v3 + v4)
        v += (dt / 6) * (a1 + 2*a2 + 2*a3 + a4)
        t += dt

        states.append((round(t, 6), round(x, 6), round(v, 6)))

    return states


if __name__ == "__main__":
    # Demonstrate natural frequency (will be wrong due to Bug 1)
    k, m = 100.0, 1.0
    print(f"Natural frequency: {natural_frequency(k, m):.4f} rad/s")
    print(f"(correct value: {math.sqrt(k/m):.4f} rad/s)")

    # Demonstrate KE calculation (will be 2× too high due to Bug 2)
    print(f"\nKE(m=1, v=2): {kinetic_energy(1, 2):.2f} J")
    print(f"(correct value: 2.00 J)")

    # Demonstrate projectile range (will be wrong due to Bug 3)
    print(f"\nRange(v0=10, theta=45°): {projectile_range(10, 45):.4f} m")
    print(f"(correct value: 10.197 m)")

    # Demonstrate ideal gas pressure (will be wrong due to Bug 4)
    print(f"\nPressure(n=1, T=0°C, V=0.0224): {ideal_gas_pressure(1, 0, 0.0224):.2f} Pa")
    print(f"(correct value: ~101325 Pa)")

    # Demonstrate RK4 instability (will blow up due to Bug 5)
    print("\nSimulating spring-mass (expect NaN/inf due to unstable dt):")
    states = simulate()
    print(f"Final position: {states[-1][1]}")
