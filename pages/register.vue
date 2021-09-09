<template>
  <div class="register-container">
    <h1>注册</h1>
    <el-form ref="registerForm" :model="registerForm" label-width="80px">
      <el-form-item label="账号" prop="username">
        <el-input v-model="registerForm.username" />
      </el-form-item>
      <el-form-item label="密码" prop="passwd">
        <el-input v-model="registerForm.passwd" type="password" />
      </el-form-item>
      <el-form-item label="验证码" prop="captcha">
        <el-col :span="18">
          <el-input v-model="registerForm.captcha" />
        </el-col>
        <el-col :span="2">
          <img :src="captchaUrl" @click="updateCaptcha">
        </el-col>
      </el-form-item>
      <el-form-item>
        <el-button :icon="loading ? 'el-icon-loading' : ''" type="primary" @click="handleRegister('registerForm')">注册</el-button>
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
        username: '',
        passwd: '',
        captcha: ''
      },
      captchaUrl: '/api/captcha',
      loading: false
    }
  },
  methods: {
    handleRegister (formName) {
      this.loading = true
      this.$refs[formName].validate(async (valid) => {
        if (valid) {
          const obj = {
            ...this.registerForm,
            passwd: md5(this.registerForm.passwd)
          }
          const ret = await this.$http.post('/user/register', obj)
          this.loading = false
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
  .register-container {
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
