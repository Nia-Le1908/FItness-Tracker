# Brief: meal-plan-experience

## Vấn đề

Một plan tốt vẫn vô dụng nếu người dùng không thể thay món, khóa lựa chọn, chỉnh khẩu phần và xem tác động lên target/ngân sách ngay lập tức.

## Hiện trạng

UI meal planner là một component lớn; custom entry thiếu macro đầy đủ, logic tính lại nằm ở client và history dựa trên snapshot JSON chưa được validate sâu.

## Kết quả mong muốn

Người dùng có thể chỉnh plan an toàn, swap một món/bữa, lock phần muốn giữ, regenerate phần còn lại, so sánh version và tạo shopping list.

## Cách tiếp cận

Tách state/domain calculations khỏi component. Mọi edit gọi server recalculation hoặc dùng shared pure engine đã kiểm chứng; versioning có schema version và payload bounds.

## Phạm vi

- **Trong**: plan editor, swap, lock, partial regenerate, undo/version restore, comparison, shopping list, mobile UX, accessibility.
- **Ngoài**: collaborative planning, retailer checkout và recipe media.

## Ranh giới

- Meal generation sở hữu candidate/score.
- Experience sở hữu interaction và mutation intent.
- Shopping list tổng hợp từ normalized servings, không từ chuỗi tên tự do.

## Tiêu chí chính

- Swap không làm thay đổi slot đã khóa.
- Totals luôn reconcile sau mọi edit.
- Undo/restore không ghi đè version cũ.
- Shopping list gộp đúng đơn vị và hiển thị giá là estimate.
- Component được chia theo hook/domain/view có test riêng.

## Phụ thuộc

- **Upstream**: constraint-aware-meal-generation.
- **Downstream**: adaptive-nutrition-loop.

