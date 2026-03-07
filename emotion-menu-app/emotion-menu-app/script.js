const video = document.getElementById("video")

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

faceMesh.onResults(results=>{
if(results.multiFaceLandmarks){

recommendMenu()

}
})

const camera = new Camera(video,{
onFrame:async()=>{
await faceMesh.send({image:video})
},
width:640,
height:480
})

camera.start()

function recommendMenu(){

const menus=[
"パンケーキ",
"コーヒー",
"チョコレートドリンク",
"辛いラーメン"
]

const randomMenu=menus[Math.floor(Math.random()*menus.length)]

document.getElementById("menu").innerText=
"おすすめ："+randomMenu

}