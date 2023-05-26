export interface EpubNcxHeadMeta {
  '@_name': string
  '@_content': string
}

export interface EpubNcxNavPoint {
  navLabel: {
    text: string
  }
  content: {
    '@_src': string
  }
  '@_id': string
  '@_playOrder': string
  '@_class': string
}

export interface EpubNcx {
  '?xml': {
    '@_version': string
    '@_encoding': string
  }
  ncx: {
    head: {
      meta: EpubNcxHeadMeta[]
    }
    docTitle: {
      text: string
    }
    navMap: {
      navPoint: EpubNcxNavPoint[]
    }
    '@_xmlns': string
    '@_version': string
    '@_xml:lang': string
  }
}
