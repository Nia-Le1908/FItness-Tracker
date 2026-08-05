# Brief: constraint-aware-meal-generation

## Vấn đề

Generator hiện tại chọn food theo macro/giá và lặp lại qua các bữa, có thể tạo khẩu phần phi thực tế, không thỏa target hoặc không phù hợp khẩu vị.

## Hiện trạng

Heuristic chia đều target cho 3–5 bữa; không có meal composition, exclusions, variety, max serving, infeasibility reason hoặc quality score. Budget chỉ được kiểm tra sau khi sinh.

## Kết quả mong muốn

Sinh full-day plan hoặc phần còn lại của ngày, ưu tiên calorie/protein/budget, tôn trọng hard constraints, tối ưu soft preferences và giải thích khi không khả thi.

## Cách tiếp cận

Dùng deterministic constrained search/optimization với candidate pruning, hard/soft constraints và weighted score. Không phụ thuộc LLM cho toán dinh dưỡng; LLM chỉ có thể dùng về sau để diễn đạt.

## Phạm vi

- **Trong**: meal count, remaining targets, budget, exclusions, dietary mode, prep/time, variety, serving bounds, locked items, scoring, feasibility và reason codes.
- **Ngoài**: recipe prose bằng AI, grocery delivery và medical diets.

## Ranh giới

- Solver nhận snapshot input, không query database trực tiếp.
- Candidate builder lấy dữ liệu catalog và preference.
- Persistence lưu engine version, input policy và output score.

## Tiêu chí chính

- Calories ±5%, protein ≥95% khi feasible.
- Không vượt hard budget/exclusion.
- Không sinh grams ngoài serving bounds.
- Kết quả deterministic với cùng input/seed.
- Infeasible result có lý do và relaxation options.
- p95 generation đáp ứng budget thời gian đã chốt.

## Phụ thuộc

- **Upstream**: nutrition-food-catalog, daily-macro-checking.
- **Downstream**: meal-plan-experience.

