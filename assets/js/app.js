(() => {
  const video = document.getElementById('video')
  const canvas = document.getElementById('canvas')
  const captureBtn = document.getElementById('capture')
  const reloadBtn = document.getElementById('reload')
  const medias = {audio: false, video: {}}

  const ctx = canvas.getContext('2d')

  const lineSize = 30
  const baseColor = {
    r: 0,
    g: 0,
    b: 0
  }
  let isRun = false
  const threshold = 5

  let guideX, guideY
  let rectSize = {}
  

  navigator.mediaDevices.getUserMedia(medias)
    .then( mediaStreamSuccess )
    .catch( mediaStreamFailed )

  captureBtn.addEventListener('click', () => {
    isRun = true
    getSkinColor()
  }, false)

  reloadBtn.addEventListener('click', () => {
    window.location.reload()
  }, false)


  function mediaStreamSuccess(stream){
    video.srcObject = stream

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth      
      canvas.height = video.videoHeight
      // https://stackoverflow.com/questions/47742208/horizontally-flipping-getusermedias-webcam-image-stream
      ctx.translate(video.videoWidth, 0)
      ctx.scale(-1, 1)
      requestAnimationFrame( draw )
    }, false)
  }

  function mediaStreamFailed(err){
    console.log(err)
  }

  function draw(){
    drawCanvas()
    requestAnimationFrame( draw )
  }

  function drawCanvas(){
    ctx.drawImage(video, 0, 0)

    if(!isRun){
      drawGuide()
    }else{
      // tintColor()
      drawRect()
    }
  }

  /**
   * 初回ガイド描画
   */
  function drawGuide(){
    ctx.strokeStyle = '#f00'
    ctx.strokeWidth = 10
    if(!guideX && !guideY){
      guideX = Math.floor( (canvas.width - lineSize)/2 )
      guideY = Math.floor( (canvas.height - lineSize)/2 )
    }
    ctx.beginPath()
    ctx.arc(
      guideX + lineSize/2,
      guideY + lineSize/2,
      lineSize/2,
      0,
      2*Math.PI
    )
    ctx.stroke()
  }

  /**
   * ガイドエリアの色抽出
   */
  function getSkinColor(){
    let imgData = ctx.getImageData(guideX, guideY, lineSize, lineSize)
    let data = imgData.data
    let count = 0

    for(let i = 0, cnt = data.length; i < cnt; i+=4){
      if(data[i] !== 255 && data[i + 1] !== 0 && data[i + 2] !== 0){
        count++
        baseColor.r += data[i]
        baseColor.g += data[i + 1]
        baseColor.b += data[i + 2]
      }
    }
    baseColor.r = Math.floor(baseColor.r/count)
    baseColor.g = Math.floor(baseColor.g/count)
    baseColor.b = Math.floor(baseColor.b/count)
    // console.log(baseColor)

  }

  /**
   * 抽出した色に類似するピクセルを所定の色に変更
   */
  function tintColor(){
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let data = imgData.data

    for(let i = 0, cnt = data.length; i < cnt; i+=4){
      if(
        (data[i    ] >= baseColor.r - threshold && data[i    ] <= baseColor.r) &&
        (data[i + 1] >= baseColor.g - threshold && data[i + 1] <= baseColor.g) &&
        (data[i + 2] >= baseColor.b - threshold && data[i + 2] <= baseColor.b)
      ){
        data[i    ] = 0
        data[i + 1] = 255
        data[i + 2] = 0
      }
    }

    ctx.putImageData(imgData, 0, 0)

  }

  /**
   * 抽出した色に類似するピクセル範囲を枠で描画
   */
  function drawRect(){
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let data = imgData.data

    for(let i = 0, cnt = data.length; i < cnt; i+=4){
      if(
        (data[i    ] >= baseColor.r - threshold && data[i    ] <= baseColor.r + threshold) &&
        (data[i + 1] >= baseColor.g - threshold && data[i + 1] <= baseColor.g + threshold) &&
        (data[i + 2] >= baseColor.b - threshold && data[i + 2] <= baseColor.b + threshold)
      ){
        let _x = Math.floor(i/4%canvas.width)
        let _y = Math.floor(i/4/canvas.width)
        rectSize.minX = (rectSize.minX && rectSize.minX <= _x)? rectSize.minX: _x
        rectSize.minY = (rectSize.minY && rectSize.minY <= _y)? rectSize.minY: _y
        rectSize.maxX = (rectSize.maxX && rectSize.maxX >= _x)? rectSize.maxX: _x
        rectSize.maxY = (rectSize.maxY && rectSize.maxY >= _y)? rectSize.maxY: _y
      }
    }
    // console.log(rectSize)

    ctx.strokeStyle = '#0f0'
    ctx.strokeWidth = 30

    ctx.strokeRect(
      //rectSize.minX,
      (canvas.width - rectSize.minX - (rectSize.maxX - rectSize.minX)),
      rectSize.minY,
      (rectSize.maxX - rectSize.minX),
      (rectSize.maxY - rectSize.minY)
    )
    rectSize.minX = null
    rectSize.minY = null
    rectSize.maxX = null
    rectSize.maxY = null
  }

})()