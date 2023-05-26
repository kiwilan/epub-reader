import type { Entry } from '@zip.js/zip.js'
import { BlobReader, TextWriter, ZipReader } from '@zip.js/zip.js'

export default class Zip {
  private constructor(
    private readonly url: string,
    private entries: Entry[] = [],
    private comment?: string,
  ) {}

  public static async make(url: string): Promise<Zip> {
    const zip = new Zip(url)
    await zip.extract()

    return zip
  }

  public getEntries(): Entry[] {
    return this.entries
  }

  public getComment(): string | undefined {
    return this.comment
  }

  public getEntry(name: string): Entry | undefined {
    return this.entries.find(entry => entry.filename === name)
  }

  public getContent(name: string): Promise<string> {
    const entry = this.getEntry(name)

    if (!entry)
      throw new Error(`File ${name} not found in zip`)

    return this.getData(entry)
  }

  private async getData(entry: Entry): Promise<string> {
    const writer = new TextWriter()

    if (entry.getData)
      return await entry.getData(writer)

    return ''
  }

  private async extract() {
    const data = await fetch(this.url)
    const blob = await data.blob()

    const blobReader = new BlobReader(blob)
    const zipReader = new ZipReader(blobReader)

    this.entries = await zipReader.getEntries()
    this.comment = new TextDecoder().decode(zipReader.comment)

    await zipReader.close()
  }
}
