# Brief: adaptive-nutrition-loop

## Vấn đề

Target ban đầu chỉ là ước lượng. Nếu không dùng trend cân nặng và adherence, hệ thống không biết target có phù hợp với người dùng thực tế hay không.

## Hiện trạng

Ứng dụng có progress entries và analytics cơ bản nhưng chưa nối chúng với macro adherence, target versions hoặc quyết định điều chỉnh.

## Kết quả mong muốn

Sau đủ dữ liệu, hệ thống đề xuất thay đổi target nhỏ, giải thích bằng trend/adherence, yêu cầu xác nhận và theo dõi hiệu quả của thay đổi.

## Cách tiếp cận

Dùng rolling trend 14–21 ngày, minimum data threshold, adherence confidence và cooldown. Không tự động thay target; tạo proposal có audit trail.

## Phạm vi

- **Trong**: eligibility, trend, adherence score, adjustment proposal, guardrail, confirmation, experiment history và feedback.
- **Ngoài**: chẩn đoán sức khỏe, tự động thay target không xác nhận và wearable integration giai đoạn đầu.

## Ranh giới

- Analytics tạo evidence snapshot.
- Adjustment policy tạo proposal.
- Macro target engine validate và activate version mới.

## Tiêu chí chính

- Không đề xuất khi dữ liệu thiếu hoặc adherence thấp.
- Mỗi thay đổi nằm trong giới hạn nhỏ và có cooldown.
- Người dùng thấy rõ dữ liệu, lý do và tác động dự kiến.
- Có thể từ chối, trì hoãn hoặc rollback target.

## Phụ thuộc

- **Upstream**: daily-macro-checking, meal-plan-experience, progress tracking hiện tại.
- **Downstream**: không có trong roadmap hiện tại.

