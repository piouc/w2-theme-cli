#! /usr/bin/env node

import { Command } from '@commander-js/extra-typings'
import { pull, sync, update, rm, mkdir } from './lib/api.js'
import { WebSocketServer } from 'ws'
import chokidar from 'chokidar'
import fsp from 'fs/promises'
import { parse, resolve } from 'path'
import { config } from './lib/load-config.js'
import open from 'open'

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
      
      const watcher = chokidar.watch(config.themeDir, {cwd: config.themeDir, ignoreInitial: true})
      watcher.on('all', async (type, path, status) => {
        console.log(type, path, status?.isDirectory())
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
      })
    }
  })

program
  .command('preview')
  .action(async () => {
    await open(config.baseUrl)
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