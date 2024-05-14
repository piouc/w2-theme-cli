import axios, { AxiosError } from 'axios';
import { config } from './load-config.js';
import { auth } from './auth.js';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import axiosRetry from 'axios-retry'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const isAuthError = (err: AxiosError) => {
  return err.status === 302 && /^\/_w2cmsManager\/\?LoginExpiredFlg/.test(err.response?.headers['Location']) || err.status === 401
}

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
    return isAuthError(err) || err.code === 'ETIMEDOUT'
  },
  onRetry: async (count, err, requestConfig) => {
    if(isAuthError(err)){
      await auth(client)
    }
  }
})
await auth(client)