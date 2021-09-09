import { Message } from 'element-ui'
import * as Cookies from 'js-cookie'

const whiteList = ['/login', '/register']

export default ({ app, store, req }) => {
  app.router.beforeEach((to, from, next) => {
    // const { token } = store.state.user
    // const token = Cookies.get('token')
    let token = ''
    if (process.server) {
      // 切分token
      const cookie = req.headers.cookie ? req.headers.cookie.split(';') : []
      const tk = 'token='
      // 遍历token，去的需要的值
      cookie.forEach((item) => {
        if (item.includes(tk)) {
          token = item.split(tk)[1]
        }
      })
    } else {
      token = Cookies.get('token')
    }
    // console.log('router=>token', token)
    // console.log('to.path', to.path)
    if (whiteList.includes(to.path)) {
      next()
    } else {
      // eslint-disable-next-line no-lonely-if
      if (token) {
        next()
      } else {
        Message.warning('登录已过期，请重新登录')
        next('/login')
      }
    }
  })
}
