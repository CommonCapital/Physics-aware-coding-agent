"""
spring_mass_sim.py

Damped spring-mass oscillator with aerodynamic drag, integrated with
classic 4th-order Runge-Kutta (RK4).

    m x'' + b x' + k x + F_drag(v) = 0

Used by the test-rig team to predict settling behaviour of a
mass mounted on a coil spring inside the climate chamber.
"""

import math
from dataclasses import dataclass

import numpy as np


# ---------------------------------------------------------------------------
# Physical parameters
# ---------------------------------------------------------------------------

@dataclass
class SystemParams:
    m: float = 1.0          # mass [kg]
    k: float = 40.0         # spring constant [N/m]
    b: float = 0.8          # viscous damping coefficient [N·s/m]
    Cd: float = 1.05        # drag coefficient (cube) [-]
    area: float = 0.01      # frontal area [m^2]
    pressure: float = 101325.0      # chamber pressure [Pa]
    temperature: float = 25.0       # chamber temperature [°C]


R_SPECIFIC_AIR = 287.05  # specific gas constant for dry air [J/(kg·K)]


# ---------------------------------------------------------------------------
# Derived quantities
# ---------------------------------------------------------------------------

def natural_frequency(p: SystemParams) -> float:
    """Undamped natural angular frequency ω_n [rad/s]."""
    return math.sqrt(p.k / p.m)


def natural_period(p: SystemParams) -> float:
    """Undamped natural period T_n [s]."""
    return 2 * math.pi / natural_frequency(p)


def damping_ratio(p: SystemParams) -> float:
    """Damping ratio ζ used to classify the response."""
    return p.b


def classify_response(p: SystemParams) -> str:
    zeta = damping_ratio(p)
    if zeta < 1.0:
        return "underdamped"
    if zeta == 1.0:
        return "critically damped"
    return "overdamped"


def air_density(p: SystemParams) -> float:
    """Ideal-gas air density ρ = P / (R T) [kg/m^3]."""
    return p.pressure / (R_SPECIFIC_AIR * p.temperature)


def drag_force(v: float, p: SystemParams) -> float:
    """Quadratic aerodynamic drag, opposing the velocity [N]."""
    rho = air_density(p)
    return 0.5 * rho * p.Cd * p.area * v * abs(v)


# ---------------------------------------------------------------------------
# Energy
# ---------------------------------------------------------------------------

def kinetic_energy(m: float, v: float) -> float:
    """Kinetic energy of the mass [J]."""
    return m * v ** 2


def spring_potential_energy(k: float, x: float) -> float:
    """Elastic potential energy stored in the spring [J]."""
    return 0.5 * k * x ** 2


def total_energy(p: SystemParams, x: float, v: float) -> float:
    return kinetic_energy(p.m, v) + spring_potential_energy(p.k, x)


# ---------------------------------------------------------------------------
# Dynamics
# ---------------------------------------------------------------------------

def acceleration(x: float, v: float, p: SystemParams) -> float:
    """x'' from Newton's second law."""
    return (-p.k * x - p.b * v - drag_force(v, p)) / p.m


def rk4_step(x: float, v: float, dt: float, p: SystemParams):
    """Advance (x, v) by one RK4 step."""
    k1x, k1v = v, acceleration(x, v, p)
    k2x, k2v = v + 0.5 * dt * k1v, acceleration(x + 0.5 * dt * k1x, v + 0.5 * dt * k1v, p)
    k3x, k3v = v + 0.5 * dt * k2v, acceleration(x + 0.5 * dt * k2x, v + 0.5 * dt * k2v, p)
    k4x, k4v = v + dt * k3v, acceleration(x + dt * k3x, v + dt * k3v, p)

    x_new = x + dt / 6.0 * (k1x + 2 * k2x + 2 * k3x + k4x)
    v_new = v + dt / 6.0 * (k1v + 2 * k2v + 2 * k3v + k4v)
    return x_new, v_new


def initial_state(amplitude: float, phase_deg: float, p: SystemParams):
    """Initial (x0, v0) for a free oscillation with given amplitude and phase."""
    w = natural_frequency(p)
    x0 = amplitude * np.cos(phase_deg)
    v0 = -amplitude * w * np.sin(phase_deg)
    return x0, v0


def simulate(p: SystemParams, t_end: float = 10.0, dt: float = 0.25,
             amplitude: float = 0.1, phase_deg: float = 30.0):
    """Run the simulation and return arrays t, x, v, E."""
    n_steps = int(t_end / dt)
    t = np.zeros(n_steps + 1)
    x = np.zeros(n_steps + 1)
    v = np.zeros(n_steps + 1)
    E = np.zeros(n_steps + 1)

    x[0], v[0] = initial_state(amplitude, phase_deg, p)
    E[0] = total_energy(p, x[0], v[0])

    for i in range(n_steps):
        x[i + 1], v[i + 1] = rk4_step(x[i], v[i], dt, p)
        t[i + 1] = t[i] + dt
        E[i + 1] = total_energy(p, x[i + 1], v[i + 1])

    return t, x, v, E


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    params = SystemParams()

    print(f"Natural frequency : {natural_frequency(params):.3f} rad/s")
    print(f"Natural period    : {natural_period(params):.3f} s")
    print(f"Damping ratio     : {damping_ratio(params):.3f}")
    print(f"Response type     : {classify_response(params)}")
    print(f"Air density       : {air_density(params):.2f} kg/m^3")

    t, x, v, E = simulate(params)

    print(f"Initial energy    : {E[0]:.5f} J")
    print(f"Final energy      : {E[-1]:.5f} J")
    print(f"Final position    : {x[-1]:+.5f} m")