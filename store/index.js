export const actions = {
  nuxtServerInit ({ commit, store }, { req }) {
    // 切分token
    const cookie = req.headers.cookie ? req.headers.cookie.split(';') : []
    // 定义字符常量：需要从cookie中取出的值的名称
    const tk = 'token='
    // 需要持久化的值
    let token = ''
    // 遍历token，去的需要的值
    cookie.forEach((item) => {
      if (item.includes(tk)) {
        token = item.split(tk)[1]
      }
    })
    // 提交mutation
    commit('user/SET_TOKEN', token)
  }
}
