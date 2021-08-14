<template>
  <div>用户中心</div>
</template>

<script>
export default {
  mounted () {
    this.$http.get('/user/info')
    this.getUserInfo()
  },
  methods: {
    getUserInfo () {
      const token = localStorage.getItem('token')
      if (token) {
        this.$store.dispatch('user/detail')
      }
    }
  }
}
</script>

<style lang="scss" scoped></style>
