import axios, { AxiosError } from 'axios';
import { config } from './load-config.js';
import { auth } from './auth.js';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

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

client.interceptors.response.use(res => {
  console.log(res.request._header)
  console.log(res.headers)
  console.log(res.status)
  return res
}, err => {
  console.error(err)
})

wrapper(client)
await auth(client)
