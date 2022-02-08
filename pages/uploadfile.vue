<template>
  <div class="uploadfile-container">
    <div class="log-out-wrap">
      <el-button @click="handleLogOut">退出登录</el-button>
    </div>
    <h1>文件上传</h1>
    <div id="drag" ref="drag">
      <i class="el-icon-files" />
      <input type="file" name="file" @change="handleFilerChange">
    </div>
    <!-- <div>
      <el-progress :stroke-width="20" :text-inside="true" :percentage="uploadProgress" />
    </div> -->
    <div>
      <el-button :icon="loading ? 'el-icon-loading' : ''" type="primary" :disabled="loading" @click="uploadFile">
        上传
      </el-button>
    </div>
    <div>
      <p>计算hash的进度</p>
      <div>
        <el-progress :stroke-width="20" :text-inside="true" :percentage="hashProgress" />
      </div>
      <p>hash: {{ hash }}</p>
      <p>文件切割数：{{ chunks.length }}</p>
      <p>下载地址: {{ fileUrl }}</p>
    </div>
    <div>
      <!-- chunk.progress -->
      <!-- chunk.progress < 0 报错 显示红色 -->
      <!-- chunk.progress == 100 报错 成功 -->
      <!-- chunk.progress 别的数组 方块的高度 -->
      <!-- <div class="cube-container" :style="{width: cubWidth + 'px'}"> -->
      <div class="cube-container">
        <div v-for="chunk in chunks" :key="chunk.name" class="cube">
          <div
            :class="{
              'uploading': chunk.progress > 0 && chunk.progress < 100,
              'success': chunk.progress == 100,
              'error': chunk.progress < 0
            }"
            :style="{height: chunk.progress + '%'}"
          >
            <i v-if="chunk.progress < 100 && chunk.progress > 0" class="el-icon-loading" style="color: #f56c6c" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import sparkMD5 from 'spark-md5'
const CHUNK_SIZE = 0.5 * 1024 * 1024
export default {
  data () {
    return {
      // 存储文件
      file: null,
      // 进度条
      // uploadProgress: 0,
      // 计算hash进度
      hashProgress: 0,
      chunks: [],
      hash: '',
      fileUrl: '',
      loading: false
    }
  },
  computed: {
    cubWidth () {
      return Math.ceil(Math.sqrt(this.chunks.length)) * 52
    },
    uploadProgress () {
      if (!this.file || this.chunks.length) {
        return 0
      }
      const loaded = this.chunks.map(item => item.chunk.size * item.progress).reduce((acc, cur) => acc + cur, 0)
      return parseInt(((loaded * 100) / this.file.size).toFixed(2))
    }
  },
  mounted () {
    // this.$http.get('/user/info')
    // this.getUserInfo()
    this.bindEvents()
  },
  methods: {
    handleLogOut () {
      this.$store.dispatch('user/logout')
      this.$router.push({
        path: '/login',
        replace: true
      })
    },
    bindEvents () {
      const drag = this.$refs.drag
      drag.addEventListener('dragover', (ev) => {
        drag.style.borderColor = 'red'
        ev.preventDefault()
      })
      drag.addEventListener('dragleave', (ev) => {
        drag.style.borderColor = '#eee'
        ev.preventDefault()
      })
      drag.addEventListener('drop', (ev) => {
        drag.style.borderColor = '#eee'
        const fileList = ev.dataTransfer.files
        this.file = fileList[0]
        ev.preventDefault()
      })
    },
    // getUserInfo () {
    //   const token = localStorage.getItem('token')
    //   if (token) {
    //     this.$store.dispatch('user/detail')
    //   }
    // },
    blobToString (blob) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = function () {
          const ret = reader.result.split('')
            .map(res => res.charCodeAt())
            .map(res => res.toString(16).toUpperCase())
            .map(res => res.padStart(2, '0'))
            .join(' ')
          resolve(ret)
        }
        reader.readAsBinaryString(blob)
      })
    },
    async isGif (file) {
      // GIF89a 和 GIF87a
      // 前面6个十六进制 (47 49 46 38 39 61) || (47 49 46 38 37 61)
      // 十六进制的转换
      const ret = await this.blobToString(file.slice(0, 6))
      // eslint-disable-next-line eqeqeq
      const isGif = (ret == '47 49 46 38 39 61') || (ret == '47 49 46 38 37 61')
      // console.log('isGif', ret, isGif)
      return isGif
    },
    async isPng (file) {
      // 18-20 22-24
      // 前面8个十六进制 (89 50 4E 47 0D 0A 1A 0A)
      // 十六进制的转换
      const ret = await this.blobToString(file.slice(0, 8))
      // eslint-disable-next-line eqeqeq
      const isPng = (ret == '89 50 4E 47 0D 0A 1A 0A')
      // console.log('isPng', ret, isPng)
      return isPng
    },
    async isJpg (file) {
      // 18-20 22-24
      // 前面2个十六进制 (FF D8)
      // 后面2个十六进制 (FF D9)
      const len = file.size
      // 十六进制的转换
      const start = await this.blobToString(file.slice(0, 2))
      const end = await this.blobToString(file.slice(-2, len))
      // eslint-disable-next-line eqeqeq
      const isJpg = (start == 'FF D8') && (end == 'FF D9')
      // console.log('isJpg start', start, isJpg)
      // console.log('isJpg end', end, isJpg)
      return isJpg
    },
    async isImage (file) {
      // 通过文件流来判定
      return await this.isGif(file) || await this.isPng(file) || await this.isJpg(file)
    },
    createFileChunk (file, size = CHUNK_SIZE) {
      const chunks = []
      let cur = 0
      while (cur < file.size) {
        chunks.push({
          index: cur,
          file: file.slice(cur, cur + size)
        })
        cur += size
      }
      return chunks
    },
    calculateHashWorker (chunks) {
      return new Promise((resolve) => {
        this.worker = new Worker('/hash.js')
        this.worker.postMessage({
          chunks
        })
        this.worker.onmessage = (ev) => {
          const { progress, hash } = ev.data
          this.hashProgress = Number(progress.toFixed(2))
          if (hash) {
            resolve(hash)
          }
        }
      })
    },
    calculateHashIdle (chunks) {
      return new Promise((resolve) => {
        const spart = new sparkMD5.ArrayBuffer()
        let count = 0

        const appendToSpark = (file) => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsArrayBuffer(file)
            reader.onload = (ev) => {
              spart.append(ev.target.result)
              resolve()
            }
          })
        }
        const workLoop = async (deadline) => {
          while (count < chunks.length && deadline.timeRemaining() > 1) {
            await appendToSpark(chunks[count].file)
            count++
            if (count < chunks.length) {
              this.hashProgress = Number(
                ((100 * count) / chunks.length).toFixed(2)
              )
            } else {
              this.hashProgress = 100
              resolve(spart.end())
            }
          }
          window.requestIdleCallback(workLoop)
        }
        window.requestIdleCallback(workLoop)
      })
    },
    calculateHashSample () {
      // 布隆过滤器 判断一个数据存在与否
      // 1个G的文件，抽样后5M以内
      // hash一样，文件不一定一样
      // hash不一样，文件一定不一样
      return new Promise((resolve) => {
        const spark = new sparkMD5.ArrayBuffer()
        const reader = new FileReader()

        const file = this.file
        const size = file.size
        const offset = 2 * 1024 * 1024
        // 第一个2M，最后一个区块数据全要
        // eslint-disable-next-line prefer-const
        let chunks = [file.slice(0, offset)]
        let cur = offset
        while (cur < size) {
          if (cur + offset >= size) {
            // 最后一个区块
            chunks.push(file.slice(cur, cur + offset))
          } else {
            // 中间的区块
            const mid = cur + offset / 2
            const end = cur + offset
            chunks.push(file.slice(cur, cur + 2))
            chunks.push(file.slice(mid, cur + 2))
            chunks.push(file.slice(end - 2, end))
          }
          cur += offset
        }
        // 中间的，取前中后各两个字节
        reader.readAsArrayBuffer(new Blob(chunks))
        reader.onload = (ev) => {
          spark.append(ev.target.result)
          this.hashProgress = 100
          resolve(spark.end())
        }
      })
    },
    async uploadFile () {
      if (!this.file) {
        return this.$message.warning('请选择文件')
      }
      this.hashProgress = 0
      this.loading = true
      this.chunks = []
      this.hash = ''
      this.fileUrl = ''
      /* if (!await this.isImage(this.file)) {
        console.log('文件格式不正确')
        // return
      }else{
        console.log('文件格式正确')
      } */
      // 切片
      const chunks = this.createFileChunk(this.file)
      // 文件需要一个唯一的id值
      // 使用webWorker
      // const hash = await this.calculateHashWorker(chunks)
      // console.log('文件hash', hash)
      //
      // 使用时间切片
      const hash = await this.calculateHashIdle(chunks)
      // console.log('文件hash1', hash1)
      //
      // 抽样hash 不算全量
      // 布隆过滤器 损失一小部分的精度，换取效率
      // 计算文件md5值
      // const hash = await this.calculateHashSample()
      // console.log('文件hash2', hash2)
      // console.log('hash', hash)
      this.hash = hash
      // 查询文件是否上传过，如果没有，是否有存在的切片
      const uploadedData = await this.$http.post('/checkfile', {
        hash: this.hash,
        ext: this.file.name.split('.').pop()
      })
      if (!uploadedData.data) {
        return
      }
      const { url, uploaded, uploadedList } = uploadedData.data
      if (uploaded) {
        // 秒传
        this.loading = false
        this.fileUrl = url
        return this.$message.success('秒传成功！')
      }
      this.chunks = chunks.map((chunk, index) => {
        // 切片的名字 hash+index
        const name = hash + '-' + index
        return {
          hash,
          name,
          index,
          chunk: chunk.file,
          // 设置进度条，已经上传的，设为100
          progress: uploadedList.includes(name) ? 100 : 0
        }
      })
      await this.uploadChunks(uploadedList)
      this.loading = false
    },
    async uploadChunks (uploadedList) {
      const requests = this.chunks
        .filter(chunk => !uploadedList.includes(chunk.name))
        .map((chunk, index) => {
          // 转成Promise
          const form = new FormData()
          form.append('chunk', chunk.chunk)
          form.append('hash', chunk.hash)
          form.append('name', chunk.name)
          // form.append('index', chunk.index)

          return {
            form,
            index: chunk.index,
            error: 0
          }
        })
        /* .map(({ form, index }) => this.$http.post('/uploadfile', form, {
          onUploadProgress: (progress) => {
            // 不是整体的进度条了，而是每个区块有自己的进度条，整体的进度条需要计算出来
            this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
          }
        })) */
      // @todu 异步数量的并发量控制
      // 尝试申请的tcp链接过多，也会造成卡顿
      // 异步的并发数控制
      // await Promise.all(requests)
      await this.sendRequest(requests)

      await this.mergeRequest()
      // const form = new FormData()
      // form.append('name', 'file')
      // form.append('file', this.file)
      // const ret = await this.$http.post('/uploadfile', form, {
      //   onUploadProgress: (progress) => {
      //     this.uploadProgress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
      //   }
      // })
      // console.log('ret', ret)
    },
    // TCP慢启动，先上传一个厨师区块，比如10KB。更具上传成功实践，决定下一个区块是20KB，还是50KB，还是5KB
    // 继续上传 一样的逻辑 可能变成100KB，200KB，或者2KB
    // 上传可能报错
    // 报错之后，进度条变红，开始重试
    // 一个切片重试失败三次，整体全部终止
    sendRequest (chunks, limit = 3) {
      // limit并发数量
      // 一个数组，长度是Limit
      // [task1, task2, task3]
      return new Promise((resolve, reject) => {
        const len = chunks.length
        let count = 0
        // eslint-disable-next-line prefer-const
        let isStop = false
        const start = async () => {
          if (isStop) {
            return
          }
          const task = chunks.shift()
          if (task) {
            const { form, index } = task
            try {
              await this.$http.post('/uploadfile', form, {
                onUploadProgress: (progress) => {
                  // 不是整体的进度条了，而是每个区块有自己的进度条，整体的进度条需要计算出来
                  this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
                }
              })
              if (count === len - 1) {
                // 最后一个任务
                resolve()
              } else {
                count++
                // 启动下一个任务
                start()
              }
            } catch (error) {
              this.chunks[index].progress = -1
              if (task.error < 3) {
                task.error++
                chunks.unshift(task)
                start()
              } else {
                // 错误三次
                isStop = true
                // eslint-disable-next-line prefer-promise-reject-errors
                reject()
              }
            }
          }
        }

        while (limit > 0) {
          // 启动limit个任务
          // 模拟一下延迟
          setTimeout(() => start(), Math.random() * 2000)
          // start()
          limit -= 1
        }
      })
    },
    // 合并请求
    async mergeRequest () {
      // 合并之前再次查询是否已全部上传，
      const uploadedData = await this.$http.post('/checkfile', {
        hash: this.hash,
        ext: this.file.name.split('.').pop()
      })
      const { uploadedList } = uploadedData.data
      if (uploadedList.length !== this.chunks.length) {
        this.chunks = this.chunks.map((chunk) => {
          // 切片的名字 hash+index
          return {
            ...chunk,
            // 设置进度条，已经上传的，设为100
            progress: uploadedList.includes(chunk.name) ? 100 : -1
          }
        })
        await this.uploadChunks(uploadedList)
        return
      }

      this.$http.post('/mergefile', {
        ext: this.file.name.split('.').pop(),
        chuckSize: CHUNK_SIZE,
        hash: this.hash,
        fileName: this.file.name,
        fileSize: this.file.size
      }).then((res) => {
        if (res.code === 0) {
          this.fileUrl = res.data.url
          this.$message.success('上传成功！')
        }
      })
    },
    handleFilerChange (ev) {
      const [file] = ev.target.files
      if (!file) {
        return
      }
      this.file = file
    }
  }
}
</script>

<style lang="scss" scoped>
  .uploadfile-container {
    width: 80%;
    margin: 0 auto;
  }
  .log-out-wrap {
    text-align: right;
  }
  #drag {
    height: 100px;
    line-height: 100px;
    border: 2px dashed #eee;
    text-align: center;
    margin-bottom: 20px;
  }
  .cube-container {
    margin: 20px auto;
    .cube {
      width: 50px;
      height: 50px;
      line-height: 50px;
      text-align: center;
      font-size: 20px;
      border: 1px solid black;
      background: #eee;
      float: left;
      >.success {
        background: green;
      }
      >.uploading {
        background: blue;
      }
      >.error {
        background: red;
      }
    }
  }
</style>
