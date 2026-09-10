# Kế hoạch cải thiện UX/UI — trang người dùng (Thor's Notes)

> Phạm vi: các trang learner (index, english, book, units, unit_*, grammar/pronunciation + lesson, basics, bookmarks, review, mylearning, search). Không đụng vào `/admin`.
> Bản sắc giữ nguyên: teal editorial (Playfair Display + Inter + Urbanist), cá tính "personal notebook". Không đổi màu chủ đạo, chỉ làm cho nhất quán và chuyên nghiệp hơn.

---

## 1. Mục tiêu

1. **Nhất quán** — một hệ token duy nhất điều khiển màu, spacing, bo góc, chuyển động; xoá giá trị hard-code rải rác.
2. **Chuyên nghiệp** — bỏ emoji làm icon cấu trúc, thay bằng inline SVG cùng stroke width.
3. **Học tốt hơn trên mobile** — touch target, subnav, flashcard thao tác một tay.
4. **Cảm giác nhanh** — giảm khoảng trống đầu trang, skeleton khớp layout, chuyển cảnh mượt.
5. **Accessible theo chuẩn** — contrast 4.5:1 cả 2 theme, reduced-motion, keyboard-only chạy được toàn bộ luồng.

---

## 2. Đánh giá hiện trạng

### Điểm mạnh — giữ nguyên, không phá
| Đã có | Bằng chứng |
|---|---|
| Design token màu light/dark + typography scale | `style.css` `:root` / `[data-theme="dark"]` |
| `:focus-visible` toàn cục | `style.css` ~dòng 700 |
| Skip link, breadcrumb có `aria-label`/`aria-current`/`aria-busy` | `ui.js` `renderBreadcrumb()` |
| Flashcard/Quiz: `role="dialog"`, focus trap, focus return, scroll lock | `ui.js` `closeFlashcards/closeQuiz` |
| Skeleton, empty/error state + nút retry | `style.css` §UX STATES |
| `prefers-reduced-motion` (2 khối) | `style.css` 288, 2700 |
| Audio player có aria-label đầy đủ | `ui.js` `buildCustomAudioPlayer()` |

### Lỗ hổng — căn cứ cụ thể trong code
| # | Vấn đề | Vị trí |
|---|---|---|
| G1 | **Emoji làm icon cấu trúc**: 🌙/☀️ (dark toggle), ☰ (mobile menu), ⏰ ↻ ✓ (stat cards review), 🔊 🔁 ⬇ (audio controls) | `style.css` 694–699; `index.html`, `review.html` (.stat-icon); `ui.js` 138/162/163 |
| G2 | **Breakpoint rời rạc**: 480 / 560 / 640 / 768 / 900 không theo scale nào | 16 khối `@media` trong `style.css` |
| G3 | **Thiếu token spacing / radius / duration / z-index**: border-radius 12/14/20/999, padding 2rem/4rem… hard-code | toàn bộ `style.css`, `courses.css` |
| G4 | **Header quá lớn trên trang nội dung**: padding-top 4rem + tiêu đề `--text-6xl` (4.5rem) lặp trên mọi trang, đẩy nội dung học xuống thấp | `style.css` `.main-header` |
| G5 | **Thiếu `color-scheme`** → scrollbar/input native còn sáng trong dark mode; `theme-color` chỉ có 1 giá trị | `<head>` mọi trang, `:root` |
| G6 | **Màu hard-code rải rác trong dark mode** (`#4ade80`, `rgba(13,156,170,.18)`…) khó bảo trì | `style.css` 1127, 2460… |
| G7 | **Empty state chỉ là chữ nghiêng**, không có icon/hành động hướng tiếp (ví dụ Review trống → CTA "Học unit đầu tiên") | `style.css` `.empty-state` + các nơi render |
| G8 | **Index hero yếu**: card "Coming soon" chiếm 50% chỗ đứng, resume-card ẩn | `index.html` |
| G9 | **Subnav unit tabs** chưa sticky, chưa có trạng thái scroll khi dài trên mobile | `renderUnitSubnav()` `main.js` + `.unit-subnav` |
| G10 | **Mobile menu button** dùng ký tự ☰, cần chắc chắn ≥44px và drawer khoá scroll + trả focus | `index.html` `.mobile-menu-btn`, `ui.js` 1648 |

---

## 3. Lộ trình thực hiện

### Giai đoạn 0 — Nền tảng token (½–1 buổi) · *bắt buộc làm trước* · ✅ **ĐÃ XONG**

| Hạng mục | File | Ghi chú |
|---|---|---|
| Thêm token vào `:root` | `style.css` | `--space-1..8` (4/8/12/16/24/32/48/64), `--radius-sm/md/lg/full`, `--dur-fast/base/slow` (150/250/350ms) + `--ease-out`, `--focus-ring`, `--z-header/drawer/modal/toast` |
| Thêm `color-scheme: light` / `[data-theme="dark"] { color-scheme: dark }` | `style.css` | Scrollbar + form control tự theo theme |
| `theme-color` 2 giá trị: `<meta name="theme-color" media="(prefers-color-scheme: light)"…>` + dark | 21 trang HTML | Lưu ý: trang tự set data-theme theo localStorage — nếu muốn chính xác tuyệt đối thì để ui.js cập nhật `meta[theme-color]` khi đổi theme |
| Chốt scale breakpoint: **480 / 768 / 1024 / 1440** | `style.css` | Refactor dần, không cần làm một lần |

**Xong khi nào:** mọi thay đổi sau này dùng token, không còn giá trị ma.

---

### Giai đoạn 1 — Quick wins, rủi ro thấp (1–2 buổi) · P0 · ✅ **ĐÃ XONG**

> Ghi chú thực thi: ngoài 4 hạng mục trong kế hoạch, đã phát hiện và thay thêm emoji màu ở các vị trí khác: 🎯 (nút Flashcards — main.js/bookmarks.js/content-tree.js), ❓ (nút Quiz ×4), ☁/💾 (ghi chú sync — review.js/mylearning.js), 🔥📚📖 (stat cards My Learning), 📚 (empty state Review), 📱 (offline.html). Các ký tự typographic đơn sắc được giữ cố ý: ★ ☆ ✓ ○ ► ▼ ← → ↗.

**1.1. Thay emoji bằng inline SVG (stroke 2px, 24 viewBox — trùng bộ đang dùng trong sidebar)**
- Dark toggle: xóa `.dm-icon::before`/`.dm-label::before` trong `style.css` (694–699), nhúng SVG moon/sun vào markup + đổi label bằng `data-theme` selector; giữ nguyên logic `initDarkMode()`.
- Mobile menu ☰ → SVG hamburger; `.mobile-menu-btn` đảm bảo min 44×44.
- Stat icons review/mylearning: ⏰ ↻ ✓ → SVG (clock, rotate-ccw, check) — sửa trong HTML của `review.html`, `mylearning.html`.
- Audio controls 🔊 🔁 ⬇ → SVG trong template `buildCustomAudioPlayer()` + TTS button + quiz replay (`ui.js`).
- ⚠️ Chỉ sửa 1 nguồn duy nhất mỗi icon (template trong ui.js hoặc CSS), tránh sửa tay 21 trang trừ khi bắt buộc.

**1.2. Focus & bàn phím**
- Rà các chỗ `outline: none` (nếu có) → thay bằng `:focus-visible` ring token.
- Drawer mobile: kiểm tra đóng bằng Esc đã có (`ui.js` 1657) — bổ sung **trả focus về nút ☰** sau khi đóng (hiện flashcard/quiz đã làm, drawer chưa).
- Quiz typing input: thêm `enterkeyhint="go"`, giữ `autocomplete="off"`.

**1.3. Header compact cho trang trong**
- Thêm modifier `.main-header.compact` (padding-top 1.5rem, title `--text-3xl`); áp dụng cho unit_*, lesson, units, bookmarks, review, mylearning, search. Trang index/english giữ nguyên hero lớn.
- Tác động: cần chỉnh **cả 6 trang unit_*** + 2 lesson page (gotcha "edit all six").

**1.4. Empty state có hướng hành động**
- Nâng `.empty-state`: icon SVG + tiêu đề + mô tả + nút CTA (props: icon/title/action). Áp dụng trước tiên cho Review trống ("Chưa có từ đến hạn — vào Vocabulary học unit đầu tiên" → nút sang `book.html`) và Bookmarks trống.

**Xong khi nào:** chạy tay qua 375px + dark mode, không còn emoji cấu trúc, mọi nút bấm được ≥44px.

---

### Giai đoạn 2 — Nhất quán hệ thống (2–3 buổi) · P1

**2.1. Refactor spacing + breakpoints bằng token**
- Thay thế giá trị spacing phổ biến trong `style.css`/`courses.css` bằng `--space-*`; gom media queries về 4 mốc chốt ở GĐ0. Ưu tiên các khối ảnh hưởng mobile (768/480) trước.

**2.2. Token hoá màu hard-code còn sót** (G6) — đưa `#4ade80` (success), màu src-tag, màu danger… vào `:root` với biến cho cả 2 theme; đo contrast từng cặp khi làm.

**2.3. Subnav & điều hướng unit (G9)**
- `.unit-subnav`: `position: sticky; top: 0` trong phạm vi main content, `overflow-x: auto` + fade cạnh phải khi tràn trên mobile, tab active rõ ràng (không chỉ dựa vào màu — thêm underline đậm/gạch chân).
- Unit pager (prev/next): style thống nhất, hiện tên unit rút gọn + phím tất cả unit_*/lesson pages đã có — chỉ cần CSS.

**2.4. Breadcrumb mobile (G8 phụ)**
- Giảm `padding-inline: 4rem` → `1rem` dưới 768px; thu gọn node giữa thành "…" khi > 3 cấp.

**2.5. Lesson content typography**
- Đã có dark override cho TinyMCE output; bổ sung style light/structural cho `.lesson-content`: heading hierarchy (h2/h3 có spacing token), bảng có viền + zebra, ul/ol indent, blockquote, code — để bài giảng đọc thoải mái như phần còn lại của site.

**Xong khi nào:** một nút/là một card nhìn giống nhau ở mọi trang; diff CSS giảm giá trị ma; đo đạc contrast pass cả 2 theme.

---

### Giai đoạn 3 — Nâng cao trải nghiệm học (2–4 buổi) · P2 (làm sau khi P0/P1 ổn)

**3.1. Flashcard**
- Flip 3D thật (`transform: rotateY` + `transform-style: preserve-3d`), thêm swipe trái/phải = "Chưa nhớ/Nhớ" — **chỉ trong overlay flashcard** (region cô lập, tránh xung đột với scroll dọc của trang, đúng nguyên tắc gesture conflict).
- Thống nhất duration flip với `--dur-slow`; respect reduced-motion (flip thành fade).
- Thanh tiến trình trong session + đếm "còn lại" đã có — giữ nguyên.

**3.2. Quiz**
- Kết thúc quiz: màn summary hiện danh sách câu sai + nút "Học lại các từ sai" (tạo session flashcard từ danh sách đó).
- Feedback đúng/sai dùng icon ✓/✗ SVG + màu từ token success/danger (không chỉ màu — thêm icon vì color-not-only-indicator).

**3.3. Review (SRS) & My Learning**
- Stat cards: chuyển sang icon SVG + số to bằng `--font-display`; thêm vòng "Đáo hạn trong 7 ngày tới" dùng dữ liệu forecast đã có của mylearning.
- Empty state CTA như 1.4.

**3.4. Index page (G8)**
- Đưa resume-card lên vị trí nổi bật hơn (ngay dưới hero, không ẩn khi có dữ liệu), card "Coming soon" thu nhỏ thành badge trên card English thay vì chiếm 50% grid.

**3.5. PWA / cảm giác nhanh**
- Skeleton: rà chiều cao skeleton khớp nội dung thật để giảm CLS (đặc biệt units list và lesson).
- `offline.html`: bổ sung link về trang chủ + danh sách trang đã cache.
- Bump `CACHE` const trong `sw.js` nếu đổi precache list (gotcha).

---

## 4. Checklist kiểm thử trước khi gỡ nhánh

- [ ] **375px dọc + ngang** cho: index, 1 unit page (vocab), 1 lesson grammar, review, flashcard overlay, quiz overlay, search, mobile drawer.
- [ ] **Dark mode**: từng trang một — không đoán từ light; scrollbar/input native theo theme; không còn chỗ "trắng lóa".
- [ ] **Keyboard-only**: skip link → menu → breadcrumb → content → toolbar flashcard/quiz; tab order khớp thị giác; focus visible mọi control; Esc đóng overlay và **trả focus**.
- [ ] **Reduced motion**: reveal/flip/không animation dịch chuyển.
- [ ] **Touch target** ≥44×44 cho mọi nút, gap ≥8px giữa các nút kề nhau.
- [ ] **Lighthouse** mobile: Accessibility ≥ 95, contrast pass cả 2 theme.
- [ ] **Regression 6 trang unit_*** sau mỗi thay đổi markup dùng chung (gotcha AGENTS.md).
- [ ] Không đổi: keys localStorage (`tn-store-v1`, `sidebar-collapsed`, `theme-dark`), inline script chống FOUC trong `<head>`, cấu trúc `registerLexicon`/`applyAudioVersion`.

## 5. Thứ tự đề xuất

1. GĐ0 (token) → 2. GĐ1 (1.1 → 1.2 → 1.4 → 1.3) → 3. GĐ2 (2.3 → 2.5 → 2.1 → 2.2 → 2.4) → 4. GĐ3 tùy chọn theo giá trị cảm nhận: 3.1 flashcard → 3.3 SRS → 3.4 index → 3.2 quiz → 3.5 PWA.

Mỗi giai đoạn commit riêng + tự chạy checklist mục 4 trước khi sang giai đoạn kế.
