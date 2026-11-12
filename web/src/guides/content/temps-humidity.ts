import type { Guide } from '../types'

export const tempsHumidity: Guide = {
  slug: 'temps-humidity',
  title: 'Temperature and humidity',
  emoji: '🌡️',
  blurb: 'The target numbers, safe heat sources, thermostats, how to measure, and how to fix problems.',
  body: `
## The numbers to aim for

Ball pythons are cold-blooded: they need to move between a warm spot and a cool spot to regulate their own body temperature. That is called a **gradient**. Measure the **surface the snake actually sits on**, not just the air.

{{fig:temp-ranges}}

| Zone | Target |
|---|---|
| **Warm spot** (surface under the heat) | **88 to 92 °F** (31 to 33 °C) |
| **Cool side** | **78 to 80 °F** (26 to 27 °C) |
| Night | May drop a few degrees. Keep the cool side **above about 75 °F** (24 °C) |
| **Danger: too hot** | Anywhere **above 95 °F** (35 °C) can burn or kill |
| **Danger: too cold** | Sustained **below about 75 °F** (24 °C) causes poor digestion, refusals and respiratory infections |

### Humidity

{{fig:humidity-ranges}}

| Situation | Target |
|---|---|
| Everyday | **55 to 65 %** (hatchlings and juveniles do well toward the upper end) |
| Shedding (see [Shedding](guide:shedding)) | **65 to 75 %** |
| Too low | **Under about 45 %**: stuck shed, dehydration, dry skin |
| Too high for too long | **Over about 80 %**: scale rot, respiratory infections, mould |

## Heat sources

| Heat source | Notes |
|---|---|
| **Heat tape or heat mat under a tub** | Good for racks and tubs. **Always** on a thermostat |
| **Radiant heat panel (overhead)** | Very safe and even, best for wooden or PVC vivariums. Does not dry the air much |
| **Ceramic heat emitter in a dome** | Good for glass tanks. Dries the air and needs a guard so the snake cannot touch it |
| **Heat rocks** | **Do not use.** They cause burns |
| **Bright heat lamps** | Dry the air, disturb sleep and burn easily. Not recommended as the main heat |

## A thermostat is mandatory

A thermostat reads a **probe** and switches the heater on and off to hold a set temperature. A heat source without a thermostat will eventually overheat and can kill a snake.

- **Dimming or pulse-proportional thermostats** give the smoothest, safest control. Simple on/off units also work but swing more.
- Set it for your **warm-spot target** (about 90 °F).
- **Put the probe where the snake sits**: on the substrate surface under the heat source or hide.
- Keep the heating element and probe **protected from the snake** so it cannot chew or move them.
- If you can, add a **second, independent high-limit thermostat** as a safety net.

## How to measure

- **Infrared temperature gun**: point it at the **substrate surface** in the warm spot and in the cool spot. This is what the snake feels.
- **Digital probe thermometers** on each side for continuous readings.
- **Digital hygrometer** for humidity. Stick-on dial gauges are often inaccurate.
- **Calibrate a hygrometer** with the salt test: a sealed bag with a bottle cap of damp table salt for 8 hours should read about **75 %**. If it reads 70 %, add 5 to its readings.
- Check **daily for the first two weeks**, then at least weekly.

## Raising humidity

- Add a **humid hide** with damp sphagnum moss. Re-wet it as needed.
- Use **deeper substrate** (3 to 4 inches), and pour a little water into a corner so the bottom layer stays damp.
- Move a **larger water bowl** close to (not on) the heat.
- On glass tanks, **cover part of the screen top** with foil or a sheet of acrylic to hold moisture in.
- Lightly **mist** the substrate. Do not soak it or spray the snake directly.

## Lowering humidity

- Add more **ventilation**.
- Let the substrate **dry out** between waterings.
- Use a smaller bowl and move it to the cool side.
- Make sure the enclosure is not sitting on a damp surface.

## Troubleshooting

| What you see | Likely cause | What to try |
|---|---|---|
| Snake stays on the cool side all the time | Warm side too hot | Lower the thermostat 2 to 3 °F, check the probe position |
| Snake lies stretched out on the heat | Too cold | Raise the thermostat, check room temperature |
| Sitting in the water bowl | Too hot, mites, or about to shed | Check temperatures, check for mites |
| Wheezing or bubbles at the nose | Infection (cold or damp) | See a vet. See [Health and illness](guide:health) |
| Stuck shed | Humidity too low | Raise humidity. See [Shedding](guide:shedding) |
| Mould or musty smell, wet belly | Humidity too high | Ventilate, dry the substrate |
| Humidity will not stay up | Too much ventilation, thin substrate | Deeper substrate, cover part of the top, humid hide |

> **Warning:** If a thermostat fails or the heat is stuck on, **unplug the heat source immediately** and move the snake to a safe container at room temperature. Overheating happens fast.
`,
}
