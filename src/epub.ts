import { XMLParser } from 'fast-xml-parser'
import type Zip from './zip'
import type { Book, BookChapter, BookContent, EpubNcx, EpubOpf } from './types'

export default class Epub {
  private constructor(
    private readonly zip: Zip,
    private opf?: EpubOpf,
    private ncx?: EpubNcx,
    private book?: Book,
    private chapters?: BookChapter[],
    private pages?: BookContent[],
  ) {}

  public static async make(zip: Zip): Promise<Epub> {
    const parser = new Epub(zip)
    parser.opf = await parser.file<EpubOpf>('content.opf')
    parser.ncx = await parser.file<EpubNcx>('toc.ncx')
    parser.book = parser.setBook()
    parser.chapters = parser.setChapters()
    parser.pages = await parser.setPages()

    return parser
  }

  public getToc(): EpubNcx | undefined {
    return this.ncx
  }

  public getOpf(): EpubOpf | undefined {
    return this.opf
  }

  public getBook(): Book | undefined {
    return this.book
  }

  public getChapters(): BookChapter[] {
    return this.chapters || []
  }

  private async file<T>(name: string): Promise<T> {
    const file = await this.zip.getContent(name)

    const xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    })

    return xmlParser.parse(file) as T
  }

  private setBook(): Book | undefined {
    if (!this.opf)
      return

    const book: Book = {
      title: this.opf.package.metadata['dc:title'],
      contributor: this.opf.package.metadata['dc:contributor']?.['#text'],
      description: this.opf.package.metadata['dc:description'],
      publisher: this.opf.package.metadata['dc:publisher'],
      subjects: this.opf.package.metadata['dc:subject'],
      language: this.opf.package.metadata['dc:language'],
    }

    let authorsRaw = this.opf.package.metadata['dc:creator']
    if (!Array.isArray(authorsRaw))
      authorsRaw = [authorsRaw]
    book.authors = authorsRaw.map(author => author['#text'])

    let identifiersRaw = this.opf.package.metadata['dc:identifier']
    if (!Array.isArray(identifiersRaw))
      identifiersRaw = [identifiersRaw]
    book.identifiers = identifiersRaw.map((identifier) => {
      return {
        scheme: identifier['@_opf:scheme'],
        content: identifier['#text'],
      }
    })

    if (this.opf.package.metadata['dc:date']) {
      const dateRaw = this.opf.package.metadata['dc:date']
      book.date = new Date(dateRaw)
    }

    const meta = this.opf.package.metadata.meta
    if (meta) {
      meta.forEach((el) => {
        if (el['@_name'] === 'calibre:title_sort')
          book.titleSort = el['@_content']
        if (el['@_name'] === 'calibre:series')
          book.series = el['@_content']
        if (el['@_name'] === 'calibre:series_index')
          book.volume = Number(el['@_content'])
        if (el['@_name'] === 'calibre:timestamp')
          book.timestamp = new Date(el['@_content'])
        if (el['@_name'] === 'calibre:rating')
          book.rating = Number(el['@_content'])
      })
    }

    return book
  }

  private setChapters(): BookChapter[] {
    if (!this.ncx)
      return []

    let chapters: BookChapter[] = []
    this.ncx.ncx.navMap.navPoint.forEach((el) => {
      chapters.push({
        label: el.navLabel.text,
        content: el.content['@_src'],
        id: el['@_id'],
        order: Number(el['@_playOrder']) ?? 0,
      })
    })

    chapters = chapters.sort((a, b) => a.order - b.order)

    return chapters
  }

  private async setPages(): Promise<BookContent[]> {
    if (!this.opf)
      return []

    const pages: BookContent[] = []

    await Promise.all(
      this.opf.package.manifest.item.map(async (el) => {
        if (el['@_media-type'] === 'application/xhtml+xml') {
          const href = el['@_href']
          const content = await this.zip.getContent(href)
          const head = /<head.*?>([\s\S]*)<\/head>/.exec(content)?.[1] ?? ''
          const body = /<body.*?>([\s\S]*)<\/body>/.exec(content)?.[1] ?? ''
          pages.push({
            head,
            body,
          })
        }
      }),
    )

    console.log(pages)

    return pages
  }

  // extractFilesJsZip = async (url: string): Promise<ZipFile[]> => {
  //   return await new Promise(resolve =>
  //     JSZipUtils.getBinaryContent(url, async (err, data) => {
  //       if (err)
  //         throw err

  //       const entries = await JSZip.loadAsync(data)
  //       const zip: ZipFile[] = []

  //       const files = Object.entries(entries.files)
  //       for (const entry of files) {
  //         const name = entry[0]
  //         const file = entry[1]

  //         const findExt = file.name.split('.')
  //         const extension = findExt[findExt.length - 1]

  //         if (
  //           !file.dir
  //           && name !== 'mimetype'
  //           && !['ttf', 'css'].includes(extension)
  //         ) {
  //           const blob = new Blob([await file.async('blob')])
  //           const text = await new Response(blob).text()
  //           const zipFile = {
  //             name,
  //             file,
  //             extension,
  //             blob,
  //             text,
  //           }

  //           zip.push(zipFile)
  //         }
  //       }

  //       resolve(zip)
  //     }),
  //   )
  // }

  // extractFilesZipJs = async (url: string) => {
  //   const downloader = new Downloader(url, 'epub.zip')
  //   await downloader.download()
  //   if (downloader.blob) {
  //     // create a BlobReader to read with a ZipReader the zip from a Blob object
  //     const reader = new zip.ZipReader(new zip.BlobReader(downloader.blob))

  //     // get all entries from the zip
  //     const entries = await reader.getEntries()
  //     console.log(entries)

  //     const list: any[] = []
  //     if (entries.length) {
  //       // for (const file of files) {
  //       //   const contents = await fs.readFile(file, 'utf8');
  //       //   console.log(contents);
  //       // }

  //       await Promise.all(
  //         entries.map(async (entry) => {
  //           if (entry) {
  //             const writer = new zip.TextWriter()
  //             // @ts-expect-error
  //             const text = await entry.getData(writer!)
  //             list.push(text)
  //           }
  //         }),
  //       )
  //       // // get first entry content as text by using a TextWriter
  //       // const text = await entries[0].getData(new zip.TextWriter(), {
  //       //   onprogress: (index, max) => {
  //       //     // onprogress callback
  //       //     console.log(index)
  //       //   },
  //       // })
  //       // // text contains the entry data as a String
  //       // console.log(text)
  //     }
  //     console.log(list)

  //     // close the ZipReader
  //     await reader.close()
  //   }
  // }

  // measureText = (string: string, fontSize: number) => {
  //   const widths = [
  //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  //     0, 0, 0, 0, 0, 0, 0, 0.2796875, 0.2765625, 0.3546875, 0.5546875,
  //     0.5546875, 0.8890625, 0.665625, 0.190625, 0.3328125, 0.3328125, 0.3890625,
  //     0.5828125, 0.2765625, 0.3328125, 0.2765625, 0.3015625, 0.5546875,
  //     0.5546875, 0.5546875, 0.5546875, 0.5546875, 0.5546875, 0.5546875,
  //     0.5546875, 0.5546875, 0.5546875, 0.2765625, 0.2765625, 0.584375,
  //     0.5828125, 0.584375, 0.5546875, 1.0140625, 0.665625, 0.665625, 0.721875,
  //     0.721875, 0.665625, 0.609375, 0.7765625, 0.721875, 0.2765625, 0.5,
  //     0.665625, 0.5546875, 0.8328125, 0.721875, 0.7765625, 0.665625, 0.7765625,
  //     0.721875, 0.665625, 0.609375, 0.721875, 0.665625, 0.94375, 0.665625,
  //     0.665625, 0.609375, 0.2765625, 0.3546875, 0.2765625, 0.4765625, 0.5546875,
  //     0.3328125, 0.5546875, 0.5546875, 0.5, 0.5546875, 0.5546875, 0.2765625,
  //     0.5546875, 0.5546875, 0.221875, 0.240625, 0.5, 0.221875, 0.8328125,
  //     0.5546875, 0.5546875, 0.5546875, 0.5546875, 0.3328125, 0.5, 0.2765625,
  //     0.5546875, 0.5, 0.721875, 0.5, 0.5, 0.5, 0.3546875, 0.259375, 0.353125,
  //     0.5890625,
  //   ]
  //   const avg = 0.5279276315789471
  //   return (
  //     Array.from(string).reduce(
  //       (acc, cur) => acc + (widths[cur.charCodeAt(0)] ?? avg),
  //       0,
  //     ) * fontSize
  //   )
  // }

  // /**
  //  * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
  //  *
  //  * @param {String} text The text to be rendered.
  //  * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
  //  *
  //  * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
  //  */
  // getTextHeight = (text: string, font: string) => {
  //   const canvas = document.createElement('canvas')
  //   const context = canvas.getContext('2d')
  //   if (context) {
  //     context.font = font
  //     const metrics = context.measureText(text)
  //   }

  //   // return metrics.height
  // }

  // getTextWidth = (text, font) => {
  //   const canvas = document.createElement('canvas')
  //   const context = canvas.getContext('2d')
  //   if (context) {
  //     context.font = font
  //     const metrics = context.measureText(text)
  //     return metrics.width
  //   }
  // }

  // getCssStyle = (element, prop) => {
  //   return window.getComputedStyle(element, null).getPropertyValue(prop)
  // }

  // getCanvasFontSize = (el = document.body) => {
  //   const fontWeight = this.getCssStyle(el, 'font-weight') || 'normal'
  //   const fontSize = this.getCssStyle(el, 'font-size') || '16px'
  //   const fontFamily = this.getCssStyle(el, 'font-family') || 'Times New Roman'

  //   return `${fontWeight} ${fontSize} ${fontFamily}`
  // }

  // /**
  //  * Remove tags from HTML `string`, tags can be keep with `tags` `string[]`.
  //  * The `<head>` will be removed if `removeHead` is `true`.
  //  *
  //  * From https://stackoverflow.com/a/66772951/11008206
  //  */
  // stripTags = (html: string, tags: string[] = [], removeHead = false) => {
  //   if (removeHead) {
  //     const parser = new DOMParser()
  //     const xmlDoc = parser.parseFromString(html, 'text/xml')
  //     const document = xmlDoc.getElementsByTagName('body')[0]
  //     html = document.innerHTML
  //   }
  //   html = html
  //     .replace(/<(\/?)(\w+)[^>]*\/?>/g, (_, endMark, tag) =>
  //       tags.includes(tag) ? `<${endMark}${tag}>` : '',
  //     )
  //     .replace(/<!--.*?-->/g, '')
  //   html = html.replace(/>\s+</g, '><')

  //   return html
  // }

  // /**
  //  * Divide string into chunks
  //  */
  // chunkString = (str: string, length = 80) => {
  //   const input = str.trim().split(' ')
  //   let index = 0
  //   const output: string[] = []
  //   output[index] = ''
  //   input.forEach((word) => {
  //     const temp = `${output[index]} ${word}`.trim()
  //     if (temp.length <= length) {
  //       output[index] = temp
  //     }
  //     else {
  //       index++
  //       output[index] = word
  //     }
  //   })

  //   return output
  // }

  // splitString(str: string, n: number) {
  //   const arr = str?.split(' ')
  //   const result: string[] = []
  //   let subStr = arr[0]
  //   for (let i = 1; i < arr.length; i++) {
  //     const word = arr[i]
  //     if (subStr.length + word.length + 1 <= n) {
  //       subStr = `${subStr} ${word}`
  //     }
  //     else {
  //       result.push(subStr)
  //       subStr = word
  //     }
  //   }
  //   if (subStr.length)
  //     result.push(subStr)

  //   return result
  // }
}
