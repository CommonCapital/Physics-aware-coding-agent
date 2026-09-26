import {
  ArrowDownToLineIcon,
  ChevronsDownIcon,
  GitCompareArrowsIcon,
  SplineIcon,
} from "lucide-react"

/**
 * The starting points offered under the home page composer.
 *
 * The label is what the button says; the prompt is what is actually run. They
 * are deliberately different lengths — a button has room for two or three
 * words, and the agent needs a specification.
 *
 * Every one of these is a scenario the approved solvers in
 * `@/lib/games/runtime/simulation` can actually compute: projectile motion
 * without drag, and a simply supported Euler-Bernoulli beam under a central
 * point load or a uniform distributed load. Nothing here asks for CFD, a real
 * bridge, a safety verdict or coupled multiphysics, because none of those has
 * a validated solver behind it — a starter prompt that asked for one would
 * advertise a capability the product does not have.
 *
 * Each prompt carries every quantity the model needs, with its unit, so the
 * first turn can run instead of opening with a round of questions. They are
 * also ordinary sentences with the numbers in plain sight, which is what makes
 * them a starting point rather than a fixed demo: changing 40° to 55° before
 * sending is the obvious next thing to do with one.
 *
 * They stay in the user's voice rather than the agent's: nothing here names a
 * file, a solver function or a unit symbol the code uses internally. The system
 * prompt in `@/lib/games/instructions` already covers how a simulation is
 * built — these only have to settle what to simulate.
 */
export const suggestions = [
  {
    label: "Projectile motion",
    icon: SplineIcon,
    prompt:
      "An educational simulation of a projectile launched at 25 m/s at 40 " +
      "degrees above the horizontal, from 1.5 m above flat ground, with " +
      "gravitational acceleration 9.81 m/s^2 and no aerodynamic drag. Plot " +
      "height against horizontal distance, and report the flight time, the " +
      "horizontal range and the maximum height. Let me change the speed, the " +
      "angle and the release height and see the trajectory update.",
  },
  {
    label: "Launch angles",
    icon: GitCompareArrowsIcon,
    prompt:
      "Compare two launch angles for the same projectile: 20 m/s from ground " +
      "level with gravitational acceleration 9.81 m/s^2 and no drag, taking 30 " +
      "degrees as the baseline and 45 degrees as the variation. Draw both " +
      "trajectories on one plot, and put the horizontal range, flight time and " +
      "maximum height side by side with the difference between them. Let me " +
      "edit either angle and the speed.",
  },
  {
    label: "Beam, point load",
    icon: ArrowDownToLineIcon,
    prompt:
      "A preliminary estimate for a simply supported steel beam spanning 6 m " +
      "with a single 12 kN point load at midspan. Young's modulus is 210 GPa " +
      "and the second moment of area is 8500 cm^4. Show the shear force, " +
      "bending moment and deflection along the span, and report the support " +
      "reactions and the maximum deflection. Let me change the span, the load " +
      "and the section properties.",
  },
  {
    label: "Beam, distributed load",
    icon: ChevronsDownIcon,
    prompt:
      "A preliminary estimate for a simply supported timber beam spanning 4.5 " +
      "m under a uniform distributed load of 3.2 kN/m. Young's modulus is 11 " +
      "GPa and the second moment of area is 21000 cm^4. Plot the shear force, " +
      "bending moment and deflection along the span, and report the maximum " +
      "bending moment and the maximum deflection with the assumptions behind " +
      "them. Let me change the span, the load and the section properties.",
  },
]
