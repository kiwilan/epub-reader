import { it } from 'vitest'
import { Epub, Zip } from '../src'

it('example test', async () => {
  const url = 'https://github.com/kiwilan/php-ebook/raw/main/tests/media/epub.epub'
  const path = './tests/media/epub.epub'

  const zip = await Zip.make(url)
  const epub = await Epub.make(zip)
  // console.log(epub)
})
