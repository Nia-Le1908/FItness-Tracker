# Brief: daily-macro-checking

## Vấn đề

Người dùng hiện chỉ biết mục tiêu lý thuyết; họ không biết đã ăn bao nhiêu, còn bao nhiêu và nên điều chỉnh bữa tiếp theo thế nào.

## Hiện trạng

Không có nutrition day hoặc food log. Macro và meal plan là các snapshot rời rạc, chưa liên kết với ngày thực tế và timezone.

## Kết quả mong muốn

Người dùng log đồ ăn nhanh, xem consumed/remaining theo ngày, thấy mức ưu tiên protein/calorie, ngân sách còn lại và nhận correction cards có thể hành động.

## Cách tiếp cận

Xây daily ledger: entry mutation tạo totals server-side và summary deterministic. Quick log tối ưu số thao tác; correction engine ban đầu dùng rules rõ ràng.

## Phạm vi

- **Trong**: nutrition day, meal slots, quick add, quantity/serving, edit/delete/copy, daily summary, remaining macro, budget, warning và correction suggestions.
- **Ngoài**: full meal optimizer, photo recognition và adaptive target.

## Ranh giới

- Day snapshot giữ target/budget của ngày đó.
- Log entry giữ nutrient snapshot từ catalog.
- Summary được server tính lại, không lưu totals do client quyết định.

## Tiêu chí chính

- Mutation idempotent và ownership-safe.
- Totals reconcile chính xác qua add/edit/delete.
- Ngày được xác định theo timezone người dùng.
- Correction cards nêu lý do và không đề xuất món bị loại trừ.
- Mobile quick log đạt đường thao tác ngắn nhất có thể.

## Phụ thuộc

- **Upstream**: macro-target-engine-v2, nutrition-food-catalog.
- **Downstream**: constraint-aware-meal-generation, adaptive-nutrition-loop.

