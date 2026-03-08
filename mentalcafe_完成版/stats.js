import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAcgNvtSQ-J--hsGhw-dgJquJp6JHFlXAc",
    authDomain: "hacktest-a8013.firebaseapp.com",
    projectId: "hacktest-a8013",
    storageBucket: "hacktest-a8013.firebasestorage.app",
    messagingSenderId: "624225445282",
    appId: "1:624225445282:web:23a92aec1e4a03a986befb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// お医者さんのセリフ集
const doctorMessages = {
    happy: "今日は待合室がパッと明るいですね。皆さんの笑顔が、私にとっても一番の処方箋になりますよ。",
    sad: "少ししんみりとした空気が流れていますね。無理に笑わなくて大丈夫。今は温かい飲み物でも飲んで、ゆっくりしましょう。",
    anxious: "そわそわとした波風を感じます。大丈夫、あなたは一人ではありません。深呼吸をして、心の高鳴りを落ち着かせましょうね。",
    neutral: "凪（なぎ）のような、静かな時間ですね。何気ない平穏こそが、心にとって一番の休息になることもあるのですよ。"
};

async function renderChart() {
    try {
        const querySnapshot = await getDocs(collection(db, "hackathon"));
        const counts = { happy: 0, sad: 0, anxious: 0, neutral: 0 }; 

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let emotion = (data.emotion || "").toLowerCase().trim();
            if (counts[emotion] !== undefined) {
                counts[emotion]++;
            }
        });

        // --- メッセージ更新ロジック ---
        // 最も多い感情を特定する
        const maxEmotion = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        const messageElement = document.getElementById('doctor-text');
        
        // データが一件もない場合の考慮
        const total = counts.happy + counts.sad + counts.anxious + counts.neutral;
        if (messageElement) {
            if (total === 0) {
                messageElement.innerText = "まだ待合室には誰もいないようです。あなたが最初の相談者になってみませんか？";
            } else {
                messageElement.innerText = doctorMessages[maxEmotion];
            }
        }
        // ---------------------------

        const ctx = document.getElementById('emotionChart');
        if (!ctx) return;

        if (window.myChart) { window.myChart.destroy(); }

        window.myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['喜び', '悲しみ', '不安', '無表情'],
                datasets: [{
                    data: [counts.happy, counts.sad, counts.anxious, counts.neutral],
                    // 世界観に合わせたパステルカラーに変更
                    backgroundColor: [
                        'rgba(255, 183, 178, 0.7)', // 喜び（淡いピンク）
                        'rgba(161, 196, 253, 0.7)', // 悲しみ（優しい青）
                        'rgba(200, 182, 255, 0.7)', // 不安（淡い紫）
                        'rgba(224, 224, 224, 0.7)'  // 無表情（グレー）
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            color: '#8fa0b3',
                            font: { size: 12 }
                        }
                    }
                },
                cutout: '65%' // ドーナツの穴を少し大きくしてスッキリさせる
            }
        });
    } catch (e) {
        console.error("Error:", e);
        const messageElement = document.getElementById('doctor-text');
        if (messageElement) messageElement.innerText = "おや、カルテの読み込みに失敗したようです。";
    }
}

renderChart();