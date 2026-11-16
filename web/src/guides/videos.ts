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
}

export const videoUrl = (id: string) => `https://youtu.be/${id}`

export const VIDEOS: Video[] = [
  {
    id: '9luyBtK2BJ0',
    topic: 'feeding',
    title: 'Feeding ball pythons: how much, how often and how to warm the meal',
    note: 'A breeder explains meal size, the schedule by age, thawing and warming prey, and two common myths, and compares how other species are fed.',
  },
  {
    id: 'qntZOBzzUtk',
    topic: 'bringing-home',
    title: 'What to do with your new ball python',
    note: 'A video to watch before and after your snake arrives. Pairs with the written first-two-weeks plan.',
  },
  {
    id: 'mP8bEsgT-k8',
    topic: 'enclosure',
    title: 'Best ball python enclosure setup',
    note: 'A video look at setting up a ball python enclosure. Compare it with the written setup checklist and layout.',
  },
  {
    id: 'wc1pICmlKAo',
    topic: 'body-language',
    title: 'The basics of snake behavior',
    note: 'A video introduction to how snakes behave. Pairs with the written guide and its pictures.',
  },
  {
    id: 'c09CxOOX7c0',
    topic: 'shedding',
    title: 'What to do when your snake is shedding',
    note: 'A video on caring for a snake during a shed. Compare it with the written shed cycle and the do and do-not list.',
  },
  {
    id: 'n2k09c15SaE',
    topic: 'shedding',
    title: 'How to remove stuck shed',
    note: 'A video on helping with a stuck shed. Go gently, and see a vet if eye caps or the tail tip will not come off.',
  },
  {
    id: 'ZEi7LqlIOs8',
    topic: 'mites',
    title: 'The new snake mite treatment that actually works',
    note: 'A video on treating mites. Check any treatment against your exotic vet\'s advice, and never use dog or cat flea products.',
  },
  {
    id: 'JVtmwg0JXJA',
    topic: 'cleaning',
    title: 'How to clean a snake enclosure',
    note: 'A video walk-through of cleaning an enclosure. Compare it with the written daily and monthly cleaning steps.',
  },
]

export const videosFor = (slug: string) => VIDEOS.filter((v) => v.topic === slug)
