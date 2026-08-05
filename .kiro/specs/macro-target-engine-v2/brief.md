# Brief: macro-target-engine-v2

## Vấn đề

Người dùng cần mục tiêu calorie/macro đáng tin cậy nhưng calculator hiện bắt buộc body-fat, dùng multiplier cố định và không giải thích giả định. Một kết quả số đơn lẻ dễ tạo cảm giác chính xác giả và không có khái niệm target đang hiệu lực.

## Hiện trạng

`calculateMacroTargets` dùng Katch-McArdle, bốn activity factors, ba goal multipliers và chia 25% calorie cho fat. Kết quả được lưu thành JSON version nhưng validation cho phép nhiều giá trị 0 và chưa có effective date, confidence hay guardrail.

## Kết quả mong muốn

Tạo recommendation có method, assumptions, range, warning và confidence; hỗ trợ fallback khi không biết body-fat; người dùng xác nhận để tạo target version hiệu lực.

## Cách tiếp cận

Tách recommendation engine thuần khỏi persistence. Chọn công thức theo dữ liệu sẵn có, áp dụng goal rate/guardrail, trả calorie range và macro ranges trước khi người dùng activate.

## Phạm vi

- **Trong**: Katch-McArdle, Mifflin-St Jeor fallback, activity model, goal rate, calorie floor, protein/fat minimum, rounding, explanation, target activation/versioning.
- **Ngoài**: tự động điều chỉnh từ trend, clinical nutrition và workout calorie burn theo thời gian thực.

## Ranh giới

- Recommendation engine không truy cập database.
- Target repository sở hữu effective version và migration.
- UI sở hữu confirmation, không tự sửa kết quả server.

## Tiêu chí chính

- Không bắt buộc body-fat.
- Macro calories reconcile trong tolerance đã định.
- Mọi recommendation có method/assumptions/warnings.
- Không tạo target ngoài guardrail mà không trả validation error.
- Version cũ vẫn đọc được qua adapter.

## Phụ thuộc

- **Upstream**: user profile hiện tại.
- **Downstream**: daily-macro-checking, adaptive-nutrition-loop.

