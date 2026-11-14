import type { Guide } from './types'
import { basics } from './content/basics'
import { shoppingList } from './content/shopping-list'
import { bringingHome } from './content/bringing-home'
import { enclosure } from './content/enclosure'
import { tempsHumidity } from './content/temps-humidity'
import { feeding } from './content/feeding'
import { weightCondition } from './content/weight-condition'
import { shedding } from './content/shedding'
import { handling } from './content/handling'
import { bodyLanguage } from './content/body-language'
import { bitesSafety } from './content/bites-safety'
import { health } from './content/health'
import { mites } from './content/mites'
import { cleaning } from './content/cleaning'
import { troubleshooting } from './content/troubleshooting'
import { cheatSheet } from './content/cheat-sheet'
import { glossary } from './content/glossary'

export type { Guide }

/** In reading order. The quick reference is shown first on the index. */
export const GUIDES: Guide[] = [
  basics, shoppingList, bringingHome, enclosure, tempsHumidity, feeding, weightCondition, shedding, handling,
  bodyLanguage, bitesSafety, health, mites, cleaning, troubleshooting, cheatSheet, glossary,
]

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug)
