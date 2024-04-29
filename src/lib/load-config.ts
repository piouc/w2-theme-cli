import fsp from 'fs/promises'
import Joi from 'joi'
import path from 'path'
import { packageDirectory } from 'pkg-dir'

type Config = {
  basicAuthUsername: string
  basicAuthPassword: string
  username: string
  password: string
  baseUrl: string
  themeDir: string
}

const rootDir = await packageDirectory()
if(!rootDir) throw new Error('Couldn\'t find w2.config.json')

const configPath = path.join(rootDir, 'w2.config.json')

const configJson = await fsp.readFile(configPath, 'utf8')

const configSchema = Joi.object<Config>({
  basicAuthUsername: Joi.string().required(),
  basicAuthPassword: Joi.string().required(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  baseUrl: Joi.string().required(),
  themeDir: Joi.string().required(),
})

const validated = configSchema.validate(JSON.parse(configJson))

if(validated.error){
  throw validated.error
}
if(validated.warning){
  console.warn(validated.warning)
}

const config: Config = validated.value
config.themeDir = path.resolve(rootDir, config.themeDir)

export {config}