<template>
  <div class="login-container">
    <h1>登录</h1>
    <el-form ref="loginForm" :model="loginForm" label-width="80px">
      <el-form-item label="账号" prop="username">
        <el-input v-model="loginForm.username" />
      </el-form-item>
      <el-form-item label="密码" prop="passwd">
        <el-input v-model="loginForm.passwd" type="password" />
      </el-form-item>
      <el-form-item label="验证码" prop="captcha">
        <el-col :span="18">
          <el-input v-model="loginForm.captcha" />
        </el-col>
        <el-col :span="2">
          <img :src="captchaUrl" @click="updateCaptcha">
        </el-col>
      </el-form-item>
      <el-form-item>
        <el-button :disabled="loading" :icon="loading ? 'el-icon-loading' : ''" type="primary" @click="handleLogin('loginForm')">登录</el-button>
        <nuxt-link to="/register">
          <el-button type="warning">注册</el-button>
        </nuxt-link>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import md5 from 'md5'
import * as Cookies from 'js-cookie'
export default {
  data () {
    return {
      loginForm: {
        username: '',
        passwd: '',
        captcha: ''
      },
      captchaUrl: '/api/captcha?_t=' + new Date().getTime(),
      loading: false
    }
  },
  mounted () {
    localStorage.removeItem('token')
    Cookies.remove('token')
  },
  methods: {
    handleLogin (formName) {
      this.loading = true
      this.$refs[formName].validate(async (valid) => {
        if (valid) {
          const obj = {
            ...this.loginForm,
            passwd: md5(this.loginForm.passwd)
          }
          const ret = await this.$http.post('/user/login', obj)
          if (ret.code === 0) {
            localStorage.setItem('token', ret.data.token)
            this.$store.commit('user/SET_TOKEN', ret.data.token)
            Cookies.set('token', ret.data.token, {
              expires: 1
            })
            this.$message.success('登录成功')
            this.$router.push({
              path: '/uploadfile'
            })
          } else {
            this.loading = false
            this.$message.error(ret.message)
          }
        } else {
          this.loading = false
          return false
        }
      })
    },
    updateCaptcha () {
      this.captchaUrl = '/api/captcha?_t=' + new Date().getTime()
    }
  }
}
</script>

<style lang="scss" scoped>
  .login-container {
    width: 600px;
    padding-right: 80px;
    margin: 0 auto;
    h1 {
      text-align: center;
      margin: 100px 0;
    }
    form {
      padding-right: 80px;
    }
  }
</style>
