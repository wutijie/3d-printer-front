import { http } from '../plugins/axios'

const state = () => ({
  token: '',
  id: '',
  nickname: ''
})

const mutations = {
  SET_TOKEN (state, token) {
    state.token = token
  },
  SET_USER (state, user) {
    state.id = user.USER_ID || ''
    state.nickname = user.USER_NAME || ''
  }
}

const actions = {
  async detail ({ state, commit }, data) {
    const result = await http.get('/user/detail')
    return result
  },
  logout ({ commit }) {
    commit('SET_TOKEN', '')
    commit('SET_USER', {})
  }
}

export default {
  namespace: true,
  state,
  mutations,
  actions
}
