import type { Guide } from '../types'

export const feeding: Guide = {
  slug: 'feeding',
  title: 'Feeding: what, how big, how often',
  emoji: '🐭',
  blurb: 'Frozen-thawed prey, matching the meal to the snake, a schedule by size, thawing steps, refusals and regurgitation.',
  body: `
## What to feed

Feed **whole, frozen-thawed rodents**: mice for small snakes, rats for most juveniles and adults. African soft-furred rats are a good fallback for picky eaters.

- **Frozen-thawed is the safe choice.** A live rodent can bite and claw a snake badly or even kill it, and a snake is easily injured while you are not watching.
- Buy from a reputable supplier that raises rodents for reptiles. Do not feed wild-caught rodents (parasites, poison).
- Keep them frozen until you thaw them, and **never refreeze** a thawed one.

## How big should the meal be?

Two easy rules, use either:

1. **Width**: the prey should be about the same width as the **widest part of the snake's body**, or slightly smaller.
2. **Weight**: the prey should weigh about **10 to 15 %** of the snake's body weight.

{{fig:prey-size}}

| Snake weight | Target prey weight | Typical item |
|---|---|---|
| 50 to 100 g | 5 to 15 g | Fuzzy or hopper mouse |
| 100 to 250 g | 12 to 35 g | Hopper or adult mouse, small rat pup |
| 250 to 600 g | 30 to 80 g | Weaned rat |
| 600 to 1,200 g | 70 to 170 g | Small rat |
| 1,200 to 2,000 g | 120 to 280 g | Medium rat |
| 2,000 g and up | 200 to 300+ g | Medium to large rat |

Sizes and names vary between suppliers, so **weigh the rodent** on a kitchen scale when you can. The app has a "prey weight" field when you log a feeding, which lets you check the 10 to 15 % rule over time.

## How often?

Young snakes eat more often because they are growing. Adults need far less. **Overfeeding is the most common mistake** and leads to obesity and liver disease.

| Snake | How often |
|---|---|
| Hatchling (under about 150 g) | Every **5 to 7 days** |
| Juvenile (about 150 to 600 g) | Every **7 to 10 days** |
| Sub-adult (about 600 to 1,500 g) | Every **10 to 14 days** |
| Adult (over about 1,500 g) | Every **14 to 21 days** |

Set each animal's **"Feed every (days)"** in the app to match. The app plans feedings on a fixed schedule: if one slips a day, it stays due until done, but the next one stays on its planned day.

## How to thaw and offer a meal

1. **Thaw in the fridge** overnight (or in a sealed bag in cool water).
2. Seal the rodent in a **zip bag** and warm it in a bowl of **hot tap water** for 10 to 20 minutes until it feels **warm to the touch** (about 100 °F / 38 °C). Do not microwave it: it heats unevenly and can burst.
3. **Pat it dry**.
4. **Use long tongs or hemostats.** Never feed by hand.
5. In the evening, open the enclosure slowly, hold the rodent by the tail or hind legs, and bring it near the snake's head **from the side**, wiggling it slightly like prey.
6. Back away and **give the snake privacy**. Many ball pythons will not eat while watched.
7. If it has not eaten after a few hours, leave the rodent in the enclosure. **Remove it by the next day** at the latest so it does not rot.
8. **Do not handle for 48 hours after a meal.**

> **Tip:** Feeding in the enclosure is fine for ball pythons and is less stressful than moving them to a separate container.

> **Tip:** **Weigh before feeding**, not after, so the numbers are comparable week to week.

## Why is my snake refusing food?

Ball pythons are famous for turning down meals. It is **usually not an emergency**, especially in healthy adults. Common causes:

- **Wrong temperatures or humidity.** Check the basics first. See [Temperature and humidity](guide:temps-humidity).
- **Shedding** or about to shed (blue eyes). Do not feed in blue.
- **Breeding season**, roughly October to March, especially in adult males, who may skip meals for months.
- **Stress**: a recent move, too much handling, an exposed enclosure, noise, other pets.
- **The wrong prey**: too big, too small, or a different type or colour than they are used to.
- **Illness or mites.** See [Health and illness](guide:health) and [Mites](guide:mites).

### What to do

1. Check temperatures and humidity.
2. Do not handle until it eats again.
3. Offer again in 7 days, in the evening, with a smaller or warmer rodent, or a different kind.
4. Leave it alone and keep the enclosure quiet and dark.
5. **Weigh weekly.** If weight is stable and the snake looks plump, you can wait.
6. **See a vet** if it has lost **10 % or more** of its weight, looks thin, shows other symptoms, or if a **hatchling** has refused for several weeks. The app flags a snake that has refused **three feedings in a row** and a **10 % weight drop**.

## Regurgitation

If the snake brings its meal back up:

- **Do not feed again for 14 days** (the app pauses the schedule after a logged regurgitation).
- Offer a **smaller meal** next, then build back up.
- Common causes: meal too big, handling too soon, temperatures too low, stress, or being disturbed.
- **See a vet** if it happens more than once, or if it comes with weight loss, a slimy mouth, or lumps along the body. See [Health and illness](guide:health).

## Signs you are overfeeding

- Fat rolls and visible skin between the scales.
- A very wide, rounded back and a heavy, lazy snake.
- Weight climbing much faster than the growth band in [Weight and body condition](guide:weight-condition).

Stretch the interval and use a smaller prey item, do not starve the snake.

## Quick reference

- **Frozen-thawed, warm, with tongs, in the evening.**
- **Meal width about equal to the snake's widest part.**
- **Hatchlings weekly, adults every 2 to 3 weeks.**
- **No handling for 48 hours after.**
- **Refusal alone is not an emergency; weight loss is.**
`,
}
