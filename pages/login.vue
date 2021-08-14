<template>
  <div>
    <el-form :model="loginForm" ref="loginForm">
      <el-form-item label="账号" prop="username">
        <el-input v-model="loginForm.username" />
      </el-form-item>
      <el-form-item label="密码" prop="passwd">
        <el-input v-model="loginForm.passwd" />
      </el-form-item>
      <el-form-item label="验证码" prop="captcha">
        <el-input v-model="loginForm.captcha" />
        <img :src="captchaUrl" @click="updateCaptcha">
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleLogin('loginForm')">登录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import md5 from 'md5'
export default {
  data () {
    return {
      loginForm: {
        username: '',
        passwd: '',
        captcha: ''
      },
      captchaUrl: '/api/captcha?_t=' + new Date().getTime()
    }
  },
  methods: {
    handleLogin (formName) {
      this.$refs[formName].validate(async (valid) => {
        if (valid) {
          console.log(this.loginForm)
          const obj = {
            ...this.loginForm,
            passwd: md5(this.loginForm.passwd)
          }
          const ret = await this.$http.post('/user/login', obj)
          if (ret.code === 0) {
            localStorage.setItem('token', ret.data.token)
            this.$message.success('登录成功')
          } else {
            this.$message.error(ret.message)
          }
        } else {
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

<style lang="scss" scoped></style>
