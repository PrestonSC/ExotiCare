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
import { whatToDo } from './content/what-to-do'
import { choosing } from './content/choosing'
import { morphs } from './content/morphs'
import { travelEmergencies } from './content/travel-emergencies'
import { lifeStages } from './content/life-stages'
import { breedingSeason } from './content/breeding-season'
import { videos } from './content/videos'
import { cheatSheet } from './content/cheat-sheet'
import { glossary } from './content/glossary'

export type { Guide }

/** In reading order. The quick reference is shown first on the index. */
export const GUIDES: Guide[] = [
  basics, choosing, morphs, shoppingList, bringingHome, enclosure, tempsHumidity, feeding, weightCondition, shedding, handling,
  lifeStages, breedingSeason, bodyLanguage, bitesSafety, health, mites, cleaning, whatToDo, troubleshooting, travelEmergencies, videos, cheatSheet, glossary,
]

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug)
