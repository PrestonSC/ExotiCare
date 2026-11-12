export interface Guide {
  slug: string
  title: string
  emoji: string
  /** One or two sentences shown on the card and used by search. */
  blurb: string
  /** Markdown. `{{fig:name}}` on its own line inserts a figure; `[text](guide:slug)` and `[text](app:/path)` link inside the app. */
  body: string
}
