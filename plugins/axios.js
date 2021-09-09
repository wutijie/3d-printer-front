import Vue from 'vue'
import axios from 'axios'
import { Message } from 'element-ui'

const service = axios.create({
  // timeout: 5,
  baseURL: '/api'
})

export default ({ store, redirect }) => {
  // 请求拦截
  // 主要做token管理
  service.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.common.Authorization = 'Bearer ' + token
      }
      return config
    }
  )

  // 响应拦截
  service.interceptors.response.use(
    (response) => {
      const { data } = response

      if (data.code === -666) {
        Message.warning('登录已过期，请重新登录')
        localStorage.removeItem('token')
        redirect({ path: '/login' })
      }
      return data
    }
  )
}

Vue.prototype.$http = service

export const http = service
