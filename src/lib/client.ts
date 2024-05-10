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
  jar,
  maxRedirects: 0
})

wrapper(client)
axiosRetry(client, {
  retryCondition: (err) => {
    return (err.status === 301 && /^\/_w2cmsManager\/\?LoginExpiredFlg/.test(err.response?.headers['Location'])) || err.status === 401
  },
  onRetry: async (count, err, requestConfig) => {
    await auth(client)
  }
})
await auth(client)
