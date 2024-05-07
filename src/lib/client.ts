import axios, { AxiosError } from 'axios';
import { config } from './load-config.js';
import { auth } from './auth.js';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import axiosRetry from 'axios-retry'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

export const jar = new CookieJar()

export const client = axios.create({
  baseURL: config.baseUrl,
  auth: {
    username: config.basicAuthUsername,
    password: config.basicAuthPassword
  },
  jar
})

wrapper(client)
axiosRetry(client, {
  onRetry: async (count, err, requestConfig) => {
    if(err instanceof AxiosError){
      err.status === 401
      await auth(client)
    }
  }
})
await auth(client)
