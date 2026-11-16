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
]

export const videosFor = (slug: string) => VIDEOS.filter((v) => v.topic === slug)
