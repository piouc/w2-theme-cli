#! /usr/bin/env node

import { Command } from '@commander-js/extra-typings'
import { pull, sync, update, rm, mkdir } from './lib/api.js'
import { WebSocketServer } from 'ws'
import chokidar from 'chokidar'
import fsp from 'fs/promises'
import { parse, resolve } from 'path'
import { config } from './lib/load-config.js'
import open from 'open'
import pLimit from 'p-limit'
import { AxiosError } from 'axios'

const program = new Command()
program
  .command('pull')
  .action(async () => {
    await pull(config.themeDir)
  })

program
  .command('sync')
  .option('-w, --watch', 'watch files')
  .action(async (options) => {
    console.log('sync: uploading zip')
    await sync(config.themeDir)
    console.log('sync: complete')

    if(options.watch){
      const wss = new WebSocketServer({
        port: 8080
      })
      wss.on('connection', (ws, req) => {
        console.log(`connected ${req.socket.remoteAddress}`)
      })

      const limit = pLimit(1)
      
      const watcher = chokidar.watch(config.themeDir, {cwd: config.themeDir, ignoreInitial: true})
      watcher.on('all', (type, path, status) => limit(async () => {
        console.log(type, path)
        switch(type){
          case 'add':
          case 'change':
            await update(path, await fsp.readFile(resolve(config.themeDir, path)))
            console.log(`${type} ${path}`)
            break
          case 'unlink':
            await rm(path)
            console.log(`delete ${path}`)
            break
          case 'addDir':
            await mkdir(path)
            console.log(`add ${path}`)
            break
          case 'unlinkDir':
            await rm(`${path}/`)
            console.log(`delete ${path}`)
            break
        }
        wss.clients.forEach(ws => {
          ws.send(JSON.stringify({type: 'update'}))
        })
      }))
    }
  })

program
  .command('preview')
  .action(async () => {
    const url = new URL(config.baseUrl)
    url.username = config.basicAuthUsername
    url.password = config.basicAuthPassword
    await open(url.href)
  })

program
  .command('dashboard')
  .action(async () => {
    const url = new URL(config.baseUrl)
    url.username = config.basicAuthUsername
    url.password = config.basicAuthPassword
    url.pathname = '/_w2cmsManager/'
    await open(url.href)
  })

program
  .command('delete')
  .argument('[path...]', 'Path...')
  .action(async (path) => {
    for(const p of path){
      await rm(p)
    }
  })

program.parse()

process.on('uncaughtException', err => {
  if(err instanceof AxiosError){
    console.error(err.toJSON())
  }
})