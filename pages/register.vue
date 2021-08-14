<template>
  <div>
    <el-form :model="registerForm" ref="registerForm">
      <el-form-item label="账号" prop="username">
        <el-input v-model="registerForm.username" />
      </el-form-item>
      <el-form-item label="密码" prop="passwd">
        <el-input v-model="registerForm.passwd" />
      </el-form-item>
      <el-form-item label="验证码" prop="captcha">
        <el-input v-model="registerForm.captcha" />
        <img :src="captchaUrl" @click="updateCaptcha">
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleRegister('registerForm')">注册</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import md5 from 'md5'
export default {
  data () {
    return {
      registerForm: {
        username: '昵称',
        passwd: 'mima',
        captcha: '4569'
      },
      captchaUrl: '/api/captcha'
    }
  },
  methods: {
    handleRegister (formName) {
      this.$refs[formName].validate(async (valid) => {
        if (valid) {
          console.log('registerRorm', this.registerForm)
          const obj = {
            ...this.registerForm,
            passwd: md5(this.registerForm.passwd)
          }
          const ret = await this.$http.post('/user/register', obj)
          console.log(ret)
          if (ret.code === 0) {
            this.$alert('注册成功', '成功', {
              confirmButtonText: '去登录',
              callback: () => {
                this.$router.push('/login')
              }
            })
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

<style lang="scss" scoped>

</style>
