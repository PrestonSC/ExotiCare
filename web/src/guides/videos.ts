/**
 * Videos shown in the care guide. To add one: append an entry here (the id is the 11 characters after
 * youtu.be/ or v= in the link, with no extra parameters) and point `topic` at the guide it belongs to.
 * It then appears on the Videos page and at the bottom of that guide.
 */
export interface Video {
  /** YouTube video id, e.g. 9luyBtK2BJ0 */
  id: string
  title: string
  /** One line on what the video covers. */
  note: string
  /** Slug of the guide this video belongs with. */
  topic: string
  /** Creator credit, shown when known. */
  by?: string
}

export const videoUrl = (id: string) => `https://youtu.be/${id}`

export const VIDEOS: Video[] = [
  {
    id: '9luyBtK2BJ0',
    topic: 'feeding',
    title: 'Feeding ball pythons: how much, how often and how to warm the meal',
    note: 'Meal size, schedule by age, thawing and warming prey, two common myths, and how other species are fed.',
    by: 'The Green Room (Bob Bledsoe)',
  },
  {
    id: 'qntZOBzzUtk',
    topic: 'bringing-home',
    title: 'What to do with your new ball python',
    note: 'The first weeks: a quiet spot, no touching for the first days, the first meal, then short handling, plus quarantine.',
    by: 'The Green Room (Bob Bledsoe)',
  },
  {
    id: 'mP8bEsgT-k8',
    topic: 'enclosure',
    title: 'Best ball python enclosure setup',
    note: 'Three example setups, good, better and best, with their pros and cons.',
  },
  {
    id: 'wc1pICmlKAo',
    topic: 'body-language',
    title: 'The basics of snake behavior',
    note: 'Food mode versus thinking mode, stress signs, and why bumping and balling up do not mean what people think.',
    by: 'The Green Room (Bob Bledsoe)',
  },
  {
    id: 'c09CxOOX7c0',
    topic: 'shedding',
    title: 'What to do when your snake is shedding',
    note: 'The shed cycle, pink belly versus a burn, whether to feed, and checking the shed is complete.',
    by: 'The Green Room (Bob Bledsoe)',
  },
  {
    id: 'n2k09c15SaE',
    topic: 'shedding',
    title: 'How to remove stuck shed',
    note: 'Soaking, damp cloths and getting stuck shed and eye caps off gently. See a vet if it will not come off.',
  },
  {
    id: 'ZEi7LqlIOs8',
    topic: 'mites',
    title: 'The new snake mite treatment that actually works',
    note: 'How snakes get mites, treatment options and a vet-prescribed oral drug. Check any treatment with your exotic vet.',
    by: 'The Green Room (Bob Bledsoe)',
  },
  {
    id: 'JVtmwg0JXJA',
    topic: 'cleaning',
    title: 'How to clean a snake enclosure',
    note: 'Spot cleans, a full clean step by step, disinfectants and cleaning shy snakes\' enclosures.',
    by: 'The Green Room (Bob Bledsoe)',
  },
]

export const videosFor = (slug: string) => VIDEOS.filter((v) => v.topic === slug)
