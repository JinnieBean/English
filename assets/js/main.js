import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Sử dụng chung config
const firebaseConfig = {
    apiKey: "AIzaSyBiGp-ZZD0Yq-Tok2aAOwVbxXMmq7eRZuM",
    authDomain: "english-study-68459.firebaseapp.com",
    projectId: "english-study-68459",
    storageBucket: "english-study-68459.firebasestorage.app",
    messagingSenderId: "1048895043926",
    appId: "1:1048895043926:web:06c3c04a722e2f3f647ef7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async () => {
    
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggle && sidebar) {
        // Khôi phục trạng thái từ localStorage
        if (localStorage.getItem('sidebar-collapsed') === 'true') {
            sidebar.classList.add('collapsed');
            // Tắt transition tạm thời để tránh flash animation lúc mới load
            sidebar.style.transition = 'none';
            setTimeout(() => {
                sidebar.style.transition = '';
            }, 100);
        }

        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            // Lưu trạng thái vào localStorage
            localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        });
    }

    // Trang Units: Tải danh sách Units
    const unitsListContainer = document.getElementById('units-list-container');
    if (unitsListContainer) {
        unitsListContainer.innerHTML = '<p style="padding: 1rem 0;">Đang tải dữ liệu...</p>';
        try {
            const unitsSnapshot = await getDocs(collection(db, "units"));
            let units = unitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            units.sort((a,b) => a.order - b.order); // Sắp xếp theo order
            
            unitsListContainer.innerHTML = ''; // Xóa chữ loading
            
            if(units.length === 0) {
                unitsListContainer.innerHTML = '<p style="padding: 1rem 0;">Chưa có bài học nào được tạo.</p>';
            }
            
            units.forEach(unit => {
                unitsListContainer.innerHTML += `
                    <div class="unit-item">
                        <span class="unit-name">${unit.title}</span>
                        <a href="unit_detail.html?id=${unit.id}" class="btn-more">More</a>
                    </div>
                `;
            });
        } catch(e) {
            console.error(e);
            unitsListContainer.innerHTML = '<p style="color: red; padding: 1rem 0;">Lỗi tải dữ liệu. Hãy kiểm tra kết nối mạng hoặc Firebase.</p>';
        }
    }
    
    // Trang Unit Detail: Tải danh sách từ vựng thuộc Unit
    const vocabListContainer = document.getElementById('vocab-list-container');
    if (vocabListContainer) {
        // Lấy unit ID từ URL (vd: unit_detail.html?id=xxx)
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        
        if (!unitId) {
            vocabListContainer.innerHTML = '<p style="color: red;">Không tìm thấy Unit ID.</p>';
            return;
        }

        vocabListContainer.innerHTML = '<p>Đang tải từ vựng...</p>';
        
        try {
            // Lấy lại tên Unit (Tùy chọn: tối ưu hơn thì có thể lấy 1 doc thay vì getDocs toàn bộ)
            const unitsSnapshot = await getDocs(collection(db, "units"));
            const currentUnit = unitsSnapshot.docs.find(d => d.id === unitId)?.data();
            
            if (currentUnit) {
                const titleEl = document.querySelector('.unit-detail-title');
                if(titleEl) titleEl.innerText = currentUnit.title;
            }

            // Tải danh sách từ vựng
            const vocabSnapshot = await getDocs(collection(db, "vocabularies"));
            let vocabs = vocabSnapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(v => v.unitId === unitId); // Lọc những từ thuộc Unit này
            
            vocabListContainer.innerHTML = '';
            
            if(vocabs.length === 0) {
                vocabListContainer.innerHTML = '<p>Unit này chưa có từ vựng nào.</p>';
            }

            vocabs.forEach(v => {
                // Xử lý Audio (nếu ko có link thì ẩn thẻ source đi hoặc báo lỗi nhẹ)
                const audioHtml = v.audio 
                    ? `<audio controls class="vocab-audio-player"><source src="${v.audio}" type="audio/mpeg"></audio>`
                    : `<span style="font-size: 0.8rem; color: #888; font-style: italic;">No audio</span>`;

                vocabListContainer.innerHTML += `
                    <div class="vocab-item">
                        <div class="vocab-left">
                            <div class="vocab-word-group">
                                <span class="vocab-word">${v.word}</span>
                                <span class="vocab-pos">${v.pos}</span>
                            </div>
                            <div class="vocab-audio-group">
                                <span class="vocab-pronunciation">${v.pron}</span>
                                ${audioHtml}
                            </div>
                        </div>
                        <div class="vocab-right">
                            <p class="vocab-def">${v.def}</p>
                            <p class="vocab-example">${v.example}</p>
                        </div>
                    </div>
                `;
            });
        } catch(e) {
            console.error(e);
            vocabListContainer.innerHTML = '<p style="color: red;">Lỗi tải từ vựng.</p>';
        }
    }
});
