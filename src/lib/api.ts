import { client } from './client.js'
import querystring from 'querystring'
import fsp from 'fs/promises'
import fs from 'fs'
import tmp from 'tmp'
import extract from 'extract-zip'
import archiver from 'archiver'
import FormData from 'form-data'
import { parse } from 'path'

type FileOption = {
  isDirectory?: boolean
}

export const sync = async (rootPath: string) => {
  await client({
    url: '/_w2cmsManager/ContentsManager/ContentsManager'
  })
  const archive = archiver('zip')
  const files = [
    'Contents/images',
    'Css',
    'Form',
    'Js',
    'Page',
    'Default.aspx',
    'DefaultBrandTop.aspx'
  ]
  archive.glob('**/*', {
    cwd: rootPath,
    ignore: ['**/TwPelicanAllCvs.xml'],
    skip: ['Landing', 'SmartPhone/Landing', 'LandingPage', 'LP']
  })
  const formData = new FormData()
  formData.append('Input.ZipDecompress', 'true')
  formData.append('Input.AutoResize', 'false')
  formData.append('X-Requested-With', 'XMLHttpRequest')
  formData.append('Input.UploadContents', archive, `theme.zip`)

  archive.finalize()

  const res = await client({
    method: 'post',
    url: `/_w2cmsManager/ContentsManager/Upload?Length=15`,
    data: formData
  })
}

const waitClose = (stream: NodeJS.ReadableStream | NodeJS.WritableStream) => {
  return new Promise<void>((resolve, reject) => {
    stream.on('close', () => resolve())
  })
}

export const pull = async (rootPath: string) => {
  await client({
    url: '/_w2cmsManager/ContentsManager/ContentsManager'
  })
  const res = await client({
    url: '/_w2cmsManager/ContentsManager/Download',
    responseType: 'stream'
  })

  tmp.file(async (err, name, fd, cleanup) => {
    await waitClose(res.data.pipe(fs.createWriteStream(name)))
    await extract(name, {dir: rootPath})
    cleanup()

    console.log('complete')
  })
}

export const update = async (path: string, data: Buffer) => {
  const {dir, base} = parse(path)
  await client({
    url: '/_w2cmsManager/ContentsManager/ContentsManager'
  })
  await client({
    method: 'post',
    url: '/_w2cmsManager/ContentsManager/Click?Length=15',
    data: querystring.encode({
      openDirPathList: '：',
      clickPath: `${dir.replace(/^\/|\/$/, '').replace('/', '\\')}\\`,
      clickDir: 'False',
      comeFromShortCut: 'false',
      'X-Requested-With': 'XMLHttpRequest'
    })
  })
  console.log(dir.replace(/^\//, '').replace('/', '\\'))
  const formData = new FormData()
  formData.append('Input.ZipDecompress', 'false')
  formData.append('Input.AutoResize', 'false')
  formData.append('X-Requested-With', 'XMLHttpRequest')
  formData.append('Input.UploadContents', data, base)

  const res = await client({
    method: 'post',
    url: `/_w2cmsManager/ContentsManager/Upload?Length=15`,
    data: formData
  })
}

export const rm = async (path: string) => {
  await client({
    url: '/_w2cmsManager/ContentsManager/ContentsManager'
  })
  await client({
    method: 'post',
    url: '/_w2cmsManager/ContentsManager/Click?Length=15',
    data: querystring.encode({
      openDirPathList: '：',
      clickPath: path.replace('/', '\\'),
      clickDir: 'False',
      comeFromShortCut: 'false',
      'X-Requested-With': 'XMLHttpRequest'
    })
  })
  await client({
    method: 'post',
    url: '/_w2cmsManager/ContentsManager/Delete',
  }).then(res => console.log(res.data))
}

export const mkdir = async (path: string) => {
  await client({
    url: '/_w2cmsManager/ContentsManager/ContentsManager'
  })
  const [parent, newDir] = path.split(/\/[^\/]*$/)
  await client({
    method: 'post',
    url: '/_w2cmsManager/ContentsManager/Click?Length=15',
    data: querystring.encode({
      openDirPathList: '：',
      clickPath: newDir ? `${parent.replace('/', '\\')}\\` : '',
      clickDir: 'False',
      comeFromShortCut: 'false',
      'X-Requested-With': 'XMLHttpRequest'
    })
  })

  await client({
    method: 'post',
    url: '/_w2cmsManager/ContentsManager/MakeDirectory',
  }).then(res => console.log(res.data))

  await client({
    method: 'post',
    url: '/_w2cmsManager/ContentsManager/Click?Length=15',
    data: querystring.encode({
      openDirPathList: '：',
      clickPath: (newDir ? `${parent.replace('/', '\\')}\\` : '') + '_NewDirectory\\',
      clickDir: 'False',
      comeFromShortCut: 'false',
      'X-Requested-With': 'XMLHttpRequest'
    })
  })

  await client({
    method: 'post',
    url: '/_w2cmsManager/ContentsManager/Rename?Length=15',
    data: querystring.encode({
      rename: newDir ?? parent
    })
  }).then(res => console.log(res.data))
}

export const getPreviewUrl = async () => {
  // const res = await client<{'return_url': string}>({
  //   method: 'post',
  //   url: `/admin/previews`,
  //   data: querystring.encode({
  //     'source_id': themeId,
  //     'source_type': 'Theme'
  //   })
  // })
  // return new URL(res.data.return_url, config.baseUrl).href
}