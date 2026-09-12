const ADJECTIVES = [
  "Brave",
  "Bright",
  "Calm",
  "Clever",
  "Cosmic",
  "Curious",
  "Daring",
  "Eager",
  "Electric",
  "Fearless",
  "Gentle",
  "Golden",
  "Happy",
  "Hidden",
  "Jolly",
  "Lucky",
  "Mighty",
  "Noble",
  "Quick",
  "Quiet",
  "Royal",
  "Shiny",
  "Silent",
  "Silver",
  "Sneaky",
  "Speedy",
  "Sunny",
  "Swift",
  "Wild",
  "Wise",
]

const NOUNS = [
  "Badger",
  "Bison",
  "Comet",
  "Condor",
  "Dolphin",
  "Falcon",
  "Ferret",
  "Fox",
  "Gecko",
  "Heron",
  "Jaguar",
  "Koala",
  "Lemur",
  "Lynx",
  "Magpie",
  "Meerkat",
  "Narwhal",
  "Ocelot",
  "Otter",
  "Panda",
  "Panther",
  "Puffin",
  "Raccoon",
  "Raven",
  "Rocket",
  "Seal",
  "Tiger",
  "Turtle",
  "Walrus",
  "Wombat",
]

const MAX_ATTEMPTS = 50

const pick = (list: string[]): string =>
  list[Math.floor(Math.random() * list.length)]

const build = (): string => `${pick(ADJECTIVES)} ${pick(NOUNS)}`

export const createNickname = (taken: string[]): string => {
  const used = new Set(taken)

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = build()

    if (!used.has(candidate)) {
      return candidate
    }
  }

  const base = build()
  let suffix = 2

  while (used.has(`${base} ${suffix}`)) {
    suffix += 1
  }

  return `${base} ${suffix}`
}
