import { AxiosInstance, AxiosError } from 'axios'
import { config } from './load-config.js'
import querystring from 'querystring'

export const auth = async (client: AxiosInstance) => {
  await signIn(client)
  return client
}

const signIn = async (client: AxiosInstance) => {
  try {
    await client({
      method: 'post',
      url: '/_w2cmsManager/',
      data: querystring.encode({
        login_id: config.username,
        password: config.password,
        nextUrl: '',
        loginExpiredFlg: ''
      })
    })
  } catch(err){
    if(err instanceof AxiosError){
      console.error(err.code)
    } else {
      console.error(err)
    }
  }
  console.log('Signed in')
}