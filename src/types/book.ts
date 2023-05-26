export interface BookContent {
  head: string
  body: string
}

export interface BookChapter {
  label?: string
  content?: string
  id?: string
  order: number
}

export interface BookIdentifier {
  content?: string
  scheme?: string
}

export interface Book {
  title?: string
  authors?: string[]
  contributor?: string
  description?: string
  publisher?: string
  identifiers?: BookIdentifier[]
  date?: Date
  subjects?: string[]
  language?: string
  titleSort?: string
  series?: string
  volume?: number
  timestamp?: Date
  rating?: number
}
