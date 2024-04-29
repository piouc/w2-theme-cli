import { client } from './client.js'
import querystring from 'querystring'
import fsp from 'fs/promises'
import fs from 'fs'
import tmp from 'tmp'
import extract from 'extract-zip'
import archiver from 'archiver'
import FormData from 'form-data'

export const sync = async (rootPath: string) => {
  await client({
    url: '/_w2cmsManager/ContentsManager/ContentsManager'
  })
  const archive = archiver('zip')
  const formData = new FormData()
  archive.directory(rootPath, false, {})
  archive.glob('**/*', {
    cwd: rootPath,
    ignore: ['Landing', 'SmartPhone/Landing']
  })
  formData.append('Input.UploadContents', archive, `theme.zip`)
  formData.append('Input.ZipDecompress', 'true')
  formData.append('Input.AutoResize', 'false')
  formData.append('Input.ImageSizeWidthS', '')
  formData.append('Input.ImageSizeWidthM', '')
  formData.append('Input.ImageSizeWidthL', '')
  formData.append('Input.ImageSizeWidthLL', '')
  formData.append('Input.ImageSizeHeightS', '')
  formData.append('Input.ImageSizeHeightM', '')
  formData.append('Input.ImageSizeHeightL', '')
  formData.append('Input.ImageSizeHeightLL', '')

  archive.finalize()

  await client({
    method: 'post',
    url: `/_w2cmsManager/ContentsManager/Upload`,
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

export const update = async (path: string, code: string) => {
  // await client({
  //   method: 'put',
  //   url: `/admin/themes/${config.themeId}/file/${path.replace(/^\//, '')}`,
  //   data: querystring.encode({
  //     code: code,
  //     prev_code: ''
  //   })
  // })
}

export const updateBinaryies = async (rootPath: string, paths: string[]) => {
  // const archive = archiver('zip')
  // const formData = new FormData()
  // paths.forEach(path => archive.file(path, {name: relative(rootPath, path)}))

  // formData.append('file', archive, `${config.themeId}.zip`)
  // archive.finalize()

  // await client({
  //   method: 'post',
  //   url: `/admin/themes/${config.themeId}/theme_zip_upload`,
  //   data: formData
  // })
}

export const del = async (path: string) => {
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
  }).then(res => res.data)
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