export type Tier = 'essential' | 'recommended' | 'nice'

export interface ShopItem {
  /** Stable id: ticked items are remembered by id, so never reuse or rename one. */
  id: string
  name: string
  note: string
  tier: Tier
}

export interface ShopGroup {
  id: string
  title: string
  items: ShopItem[]
}

export const TIER_LABEL: Record<Tier, string> = {
  essential: 'Essential',
  recommended: 'Recommended',
  nice: 'Nice to have',
}

/** What a new ball python keeper needs, grouped by where it gets used. */
export const SHOPPING: ShopGroup[] = [
  {
    id: 'enclosure',
    title: 'Enclosure and setup',
    items: [
      { id: 'enclosure', tier: 'essential', name: 'Enclosure sized for the snake', note: 'A small tub or rack tub for a baby. For an adult, a 66 qt tub at minimum or about 4 x 2 x 2 ft. See Enclosure setup.' },
      { id: 'lid', tier: 'essential', name: 'Secure locking lid or latches', note: 'Ball pythons are strong escape artists. Close every gap.' },
      { id: 'substrate', tier: 'essential', name: 'Substrate: cypress mulch or coco fibre', note: '2 to 3 inches deep. Never cedar or pine, and no sand.' },
      { id: 'paper-towels', tier: 'essential', name: 'Paper towels for quarantine and sick snakes', note: 'They make mites and droppings easy to spot.' },
      { id: 'hides', tier: 'essential', name: 'Two snug hides, warm side and cool side', note: 'Same style, so the snake never has to choose between warm and safe.' },
      { id: 'humid-hide', tier: 'essential', name: 'A humid hide with sphagnum moss', note: 'A small hide with damp moss. Helps humidity and shedding.' },
      { id: 'bowl', tier: 'essential', name: 'Heavy water bowl, big enough to soak in', note: 'Heavy ceramic so it cannot tip.' },
      { id: 'decor', tier: 'recommended', name: 'Fake plants, cork bark and a low sturdy branch', note: 'Cover and clutter help a shy snake feel safe, which helps it eat.' },
      { id: 'backdrop', tier: 'nice', name: 'Opaque cover for the sides', note: 'A backdrop or paper on the outside for privacy.' },
    ],
  },
  {
    id: 'climate',
    title: 'Heat and humidity',
    items: [
      { id: 'heat', tier: 'essential', name: 'Heat source', note: 'Heat tape or mat for tubs, a radiant heat panel for vivariums, or a ceramic heat emitter with a guard. Never a heat rock.' },
      { id: 'thermostat', tier: 'essential', name: 'Thermostat for the heat source', note: 'Required. Dimming or pulse-proportional is best. A heater without one can overheat and kill a snake.' },
      { id: 'temp-gun', tier: 'essential', name: 'Infrared temperature gun', note: 'Reads the surface the snake actually sits on.' },
      { id: 'probes', tier: 'essential', name: 'Digital probe thermometers for the warm and cool sides', note: 'Constant readings. Stick-on dial gauges are often wrong.' },
      { id: 'hygrometer', tier: 'essential', name: 'Digital hygrometer', note: 'Measures humidity. Put it in the middle of the enclosure.' },
      { id: 'high-limit', tier: 'recommended', name: 'Second, independent high-limit thermostat', note: 'A safety net if the main thermostat fails.' },
      { id: 'spray', tier: 'recommended', name: 'Spray bottle', note: 'For lightly misting the substrate and rewetting the moss.' },
      { id: 'salt', tier: 'nice', name: 'Table salt for calibrating the hygrometer', note: 'The salt test is in Temperature and humidity.' },
      { id: 'timer', tier: 'nice', name: 'Timer, if you use a light', note: 'Keeps a steady day and night cycle.' },
    ],
  },
  {
    id: 'feeding',
    title: 'Feeding',
    items: [
      { id: 'prey', tier: 'essential', name: 'Frozen mice or rats in the right size', note: 'About as wide as the snake at its widest. Start with a few, not a freezer full.' },
      { id: 'tongs', tier: 'essential', name: 'Long feeding tongs or hemostats', note: 'Never feed by hand.' },
      { id: 'thaw', tier: 'essential', name: 'Zip bags and a bowl for thawing', note: 'Keep them just for rodents.' },
      { id: 'scale', tier: 'essential', name: 'Kitchen scale that reads in grams', note: 'To weigh the snake and the prey.' },
      { id: 'weigh-tub', tier: 'recommended', name: 'Lidded container for weighing the snake', note: 'Zero the scale with the container on it.' },
      { id: 'freezer', tier: 'recommended', name: 'Freezer space or a sealed bin for the prey', note: 'Keep it separate from human food.' },
      { id: 'asf', tier: 'nice', name: 'A second prey type for picky eaters', note: 'For example African soft-furred rats.' },
    ],
  },
  {
    id: 'cleaning',
    title: 'Cleaning',
    items: [
      { id: 'disinfectant', tier: 'essential', name: 'Reptile-safe disinfectant', note: 'F10 or chlorhexidine. Never phenol or essential-oil cleaners.' },
      { id: 'gloves', tier: 'essential', name: 'Disposable gloves', note: 'For spot cleaning and cleaning day.' },
      { id: 'bucket', tier: 'essential', name: 'A bucket, sponge and brush just for the snake', note: 'Not from the kitchen.' },
      { id: 'temp-tub', tier: 'essential', name: 'Temporary lidded tub for cleaning day', note: 'A safe, warm place for the snake while you do the monthly full clean.' },
      { id: 'trash', tier: 'recommended', name: 'Trash bags and spare paper towels', note: 'For dirty substrate and spills.' },
      { id: 'scoop', tier: 'recommended', name: 'Scoop or small trowel', note: 'For daily spot cleaning.' },
      { id: 'sanitiser', tier: 'recommended', name: 'Hand sanitiser by the enclosure', note: 'Wash your hands after every touch. Reptiles carry Salmonella.' },
      { id: 'spares', tier: 'recommended', name: 'Spare substrate and a spare water bowl', note: 'So a full clean never waits for a shopping trip.' },
    ],
  },
  {
    id: 'handling',
    title: 'Handling and transport',
    items: [
      { id: 'carrier', tier: 'recommended', name: 'Small secure container or cloth bag', note: 'For vet visits and moving the snake.' },
      { id: 'heat-pack', tier: 'nice', name: 'Heat pack for winter transport', note: 'Keep it outside the bag, never touching the snake.' },
      { id: 'hook', tier: 'nice', name: 'Snake hook', note: 'Optional. Some keepers use one to signal and move a large or nervous snake.' },
    ],
  },
  {
    id: 'health',
    title: 'Health and vet',
    items: [
      { id: 'vet', tier: 'essential', name: 'An exotic-animal vet, found before you need one', note: 'Save their number. Book a first check-up and a stool test.' },
      { id: 'stool', tier: 'recommended', name: 'Small containers or bags for stool samples', note: 'For parasite tests.' },
      { id: 'first-aid', tier: 'recommended', name: 'Antiseptic and bandages', note: 'For bites and scratches.' },
      { id: 'mite-plan', tier: 'recommended', name: 'A mite plan chosen with your vet', note: 'Know what you would use. Never use dog or cat flea products.' },
      { id: 'quarantine', tier: 'recommended', name: 'A quarantine setup, if you keep other reptiles', note: 'Separate room, tools and bowls for at least 90 days. See Bringing your snake home.' },
    ],
  },
  {
    id: 'records',
    title: 'Records and the app',
    items: [
      { id: 'app-add', tier: 'essential', name: 'Add the snake to ExotiCare and set its schedules', note: 'Feeding interval, plus spot and full clean schedules for its enclosure.' },
      { id: 'arrival-weight', tier: 'essential', name: 'Log the arrival weight', note: 'Your starting point for every chart.' },
      { id: 'qr', tier: 'recommended', name: 'Print and attach its QR label', note: 'From Settings, Open label sheet.' },
      { id: 'label-cover', tier: 'nice', name: 'Clear tape or laminating pouch for the label', note: 'Reptile rooms are humid.' },
    ],
  },
]

export const allItems = () => SHOPPING.flatMap((g) => g.items)
