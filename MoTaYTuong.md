# 📚 Learning Support App - Product Specification

## 1. Overview
Ứng dụng hỗ trợ học tập tập trung vào việc xây dựng thói quen, tăng hiệu suất học và cá nhân hóa trải nghiệm thông qua gamification (phần thưởng), tracking và phân tích dữ liệu học tập.

---

## 2. Core Features

### 2.1 User Management
- Đăng ký / Đăng nhập (Email, Google, OAuth2)
- Quản lý hồ sơ cá nhân
- Phân quyền (user / admin)

### 2.2 Dashboard & Analytics
- So sánh hiệu suất học:
  - Hôm nay vs hôm qua
  - Tháng này vs tháng trước
- Heatmap ngày học (giống GitHub contribution)
- Tổng thời gian học
- Số lần hoàn thành session học
- Biểu đồ tiến độ (line chart, bar chart)

### 2.3 Streak System (Chuỗi học liên tục)
- Đếm số ngày học liên tiếp
- Cảnh báo khi sắp mất streak
- Phần thưởng khi đạt milestone (7 ngày, 30 ngày, 100 ngày)

### 2.4 Study Timer (Pomodoro nâng cao)
- Cài đặt:
  - Thời gian học
  - Thời gian nghỉ
- Chế độ:
  - Pomodoro (25-5)
  - Custom
- Tracking session

#### 🎁 Reward System (Gamification)
- Random reward sau mỗi session:
  - XP
  - Coin
  - Badge
  - Unlock content
- User có thể config:
  - Tỉ lệ xuất hiện reward
  - Loại reward
- Time-based reward:
  - Reward chỉ xuất hiện trong khung giờ (VD: 20h-22h)
  - Có thể:
    - Bắt buộc xuất hiện
    - Xuất hiện ngẫu nhiên trong khung giờ

### 2.5 Music Management
- Lưu playlist học tập:
  - Link YouTube
  - Spotify
  - File upload
- Phát nhạc trong app
- Gợi ý nhạc theo mood học

---

## 3. Learning Support Features

### 3.1 Flashcard System
- Tạo thẻ học (text, image)
- Phân loại theo:
  - Chủ đề
  - Tag
- Học theo:
  - Random
  - Spaced Repetition

### 3.2 Spaced Repetition (Ôn tập thông minh)
- Gợi ý thời gian ôn lại:
  - 1 ngày
  - 3 ngày
  - 7 ngày
- Thuật toán (có thể nâng cấp):
  - SM-2 (Anki algorithm)

### 3.3 Daily Learning Summary
- Tổng hợp:
  - Nội dung đã học
  - Thẻ đã tạo
  - Thời gian học
- Gợi ý kế hoạch hôm sau

### 3.4 Proof of Study
- Yêu cầu upload bằng chứng:
  - Ảnh
  - Screenshot
- Có thể bật/tắt
- AI future idea: kiểm tra nội dung ảnh

### 3.5 Statistics & Reports
- Số thẻ tạo theo ngày / tháng
- Biểu đồ tăng trưởng kiến thức
- Phân tích:
  - Tốc độ học
  - Độ retention

---

## 4. Advanced Features (Đề xuất thêm)

### 4.1 AI Assistant
- Gợi ý nội dung học
- Tạo flashcard tự động từ:
  - PDF
  - Văn bản
- Tóm tắt nội dung

### 4.2 Social / Community
- Kết bạn
- So sánh streak
- Leaderboard

### 4.3 Goal System
- Đặt mục tiêu:
  - Số giờ học/ngày
  - Số thẻ cần học
- Theo dõi tiến độ

### 4.4 Notification System
- Nhắc học
- Nhắc ôn bài
- Nhắc khi gần mất streak

### 4.5 Offline Mode
- Học offline
- Sync khi có mạng

---