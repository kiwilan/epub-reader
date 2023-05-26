export interface EpubOpfIdentifier {
  '#text': string
  '@_id'?: string
  '@_opf:scheme': string
}

export interface EpubOpfMeta {
  '@_name': string
  '@_content': string
}

export interface EpubSpineItemref {
  '@_idref': string
}

export interface EpubManifestItem {
  '@_id': string
  '@_href': string
  '@_media-type': string
}

export interface EpubOpfCreator {
  '#text': string
  '@_opf:role': string
  '@_opf:file-as': string
}

export interface EpubOpf {
  '?xml': {
    '@_version': string
    '@_encoding': string
  }
  package: {
    metadata: {
      'dc:title': string
      'dc:creator': EpubOpfCreator | EpubOpfCreator[]
      'dc:contributor': {
        '#text': string
        '@_opf:role': string
      }
      'dc:description': string
      'dc:publisher': string
      'dc:identifier': EpubOpfIdentifier[]
      'dc:date': Date
      'dc:subject': string[]
      'dc:language': string
      meta: EpubOpfMeta[]
      '@_xmlns:opf': string
      '@_xmlns:dc': string
      '@_xmlns:dcterms': string
      '@_xmlns:xsi': string
      '@_xmlns:calibre': string
    }
    manifest: {
      item: EpubManifestItem[]
    }
    spine: {
      itemref: EpubSpineItemref[]
      '@_toc': string
    }
    guide: {
      reference: {
        '@_type': string
        '@_href': string
        '@_title': string
      }
    }
    '@_xmlns': string
    '@_version': string
    '@_unique-identifier': string
  }
}
