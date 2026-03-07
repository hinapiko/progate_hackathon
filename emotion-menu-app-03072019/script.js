const video = document.getElementById("video");
const overlay = document.getElementById("overlay");

function resizeCanvasToVideo() {
  if (!overlay || !video) return;
  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;
}

video.addEventListener("loadedmetadata", resizeCanvasToVideo);

navigator.mediaDevices.getUserMedia({video:true})
.then(stream=>{
video.srcObject=stream
})

const faceMesh = new FaceMesh({
locateFile:(file)=>{
return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
}
})

faceMesh.setOptions({
maxNumFaces:1,
refineLandmarks:true,
minDetectionConfidence:0.5,
minTrackingConfidence:0.5
})

// 判定ボタンイベント追加
const judgeBtn = document.getElementById("judgeBtn");
if (judgeBtn) {
  judgeBtn.addEventListener("click", () => {
    recommendMenu();
  });
}

faceMesh.onResults(results=>{
  if(results.multiFaceLandmarks){
    window.lastLandmarks = results.multiFaceLandmarks[0];
    drawFaceMesh(results);
  } else {
    clearOverlay();
  }
})

function drawFaceMesh(results) {
  const canvas = document.getElementById("overlay");
  const video = document.getElementById("video");
  if (!canvas || !video) return;
  canvas.width = video.clientWidth;
  canvas.height = video.clientHeight;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!results.multiFaceLandmarks) return;
  const landmarks = results.multiFaceLandmarks[0];
  ctx.fillStyle = "#00FF00";
  for (const pt of landmarks) {
    ctx.beginPath();
    ctx.arc(pt.x * canvas.width + 10, pt.y * canvas.height + 40, 2, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 1;
  const contourIdx = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
  ctx.beginPath();
  for (let i = 0; i < contourIdx.length; i++) {
    const idx = contourIdx[i];
    const pt = landmarks[idx];
    if (i === 0) ctx.moveTo(pt.x * canvas.width + 10, pt.y * canvas.height + 40);
    else ctx.lineTo(pt.x * canvas.width + 10, pt.y * canvas.height + 40);
  }
  ctx.closePath();
  ctx.stroke();
}

function clearOverlay() {
  const canvas = document.getElementById("overlay");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const camera = new Camera(video,{
onFrame:async()=>{
await faceMesh.send({image:video})
},
width:640,
height:480
})

camera.start()

function recommendMenu(){
let emotion = "neutral";
if (window.lastLandmarks) {
  const landmarks = window.lastLandmarks;
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const topMouth = landmarks[0];
  const bottomMouth = landmarks[17];
  const leftBrow = landmarks[70];
  const rightBrow = landmarks[300];
  const leftEyeTop = landmarks[159];
  const leftEyeBottom = landmarks[145];
  const rightEyeTop = landmarks[386];
  const rightEyeBottom = landmarks[374];

  const leftEyeOpen = Math.abs(leftEyeTop.y - leftEyeBottom.y);
  const rightEyeOpen = Math.abs(rightEyeTop.y - rightEyeBottom.y);
  const eyeOpenAvg = (leftEyeOpen + rightEyeOpen) / 2;
  const mouthOpen = Math.abs(bottomMouth.y - topMouth.y);

  // デバッグ用座標出力
  console.log('mouth:', leftMouth, rightMouth, topMouth, bottomMouth);
  console.log('brow:', leftBrow, rightBrow);
  console.log('eyeOpenAvg:', eyeOpenAvg);
  console.log('mouthOpen:', mouthOpen);

  // 判定順序と閾値調整
  if (mouthOpen > 0.07 && eyeOpenAvg > 0.045) {
    emotion = "surprised";
  } else if (
    leftMouth.y < topMouth.y - 0.001 && rightMouth.y < topMouth.y - 0.001
  ) {
    emotion = "happy";
  } else if (
    leftBrow.y > leftMouth.y || rightBrow.y > rightMouth.y
  ) {
    emotion = "angry";
  } else if (
    (leftMouth.y > topMouth.y + 0.01 && rightMouth.y > topMouth.y + 0.01) ||
    (leftBrow.y > leftMouth.y + 0.01 && rightBrow.y > rightMouth.y + 0.01 && eyeOpenAvg < 0.018)
  ) {
    emotion = "sad";
  } else if (eyeOpenAvg < 0.014) {
    emotion = "tired";
  } else {
    emotion = "neutral";
  }
}

let menu = "パンケーキ";
if (emotion === "happy") menu = "チョコレートドリンク";
else if (emotion === "surprised") menu = "コーヒー";
else if (emotion === "angry") menu = "辛いラーメン";

document.getElementById("menu").innerText = `おすすめ（${emotion}）：${menu}`
}