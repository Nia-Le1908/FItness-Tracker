# Roadmap: Macro Checking và Meal Generation

## Tổng quan

Mục tiêu sản phẩm là chuyển FitBudget từ một bộ công cụ tính toán rời rạc thành trợ lý dinh dưỡng theo ngày: người dùng biết mục tiêu hiện tại, ghi nhận những gì đã ăn, thấy phần macro/ngân sách còn lại và nhận được đề xuất bữa tiếp theo có thể thực hiện trong bối cảnh Việt Nam.

Hướng triển khai là xây theo lát cắt giá trị. Daily Macro Checking là vòng lặp cốt lõi; Meal Generation là một bộ máy đề xuất sử dụng trạng thái còn lại của ngày, food catalog và các constraint cá nhân. Workout không thuộc roadmap này, chỉ có thể cung cấp tín hiệu activity trong tương lai.

## Quyết định hướng tiếp cận

- **Đã chọn**: Nutrition operating loop — Target → Log → Check → Correct → Learn.
- **Lý do**: tạo thói quen sử dụng hằng ngày, giải quyết một câu hỏi cụ thể sau mỗi lần ăn và cho Meal Generator dữ liệu thực tế để sinh phương án hữu ích.
- **Không chọn**: chỉ làm calculator đẹp hơn; giá trị dùng lại thấp và không đo được độ tuân thủ.
- **Không chọn**: đưa LLM vào sinh thực đơn ngay; dữ liệu và constraint hiện chưa đủ để kiểm chứng tính đúng, chi phí và an toàn.
- **Không chọn**: làm meal planner thủ công trước; không tạo được vòng phản hồi để cải thiện đề xuất.

## Hiện trạng kỹ thuật

- Macro engine dùng Katch-McArdle, bắt buộc body-fat, bốn mức activity và multiplier cố định cho cut/maintain/bulk.
- Macro target được lưu dưới dạng versioned JSON nhưng chưa có khái niệm target hiệu lực theo ngày hoặc lý do thay đổi.
- Meal Generator chọn một nguồn protein, carb và fat theo tỷ lệ macro/giá, chia đều cho 3–5 bữa và lặp lại lựa chọn.
- Food catalog runtime chỉ có 5 thực phẩm hard-code; chưa có serving, category chuẩn, dietary flags, giá theo vùng/thời điểm hoặc mức tin cậy dữ liệu.
- Meal plan có thể chỉnh sửa nhưng macro của entry không đầy đủ, dễ mất tính đúng sau khi sửa grams.
- Chưa có daily food log, consumed/remaining macro, meal substitution, feasibility explanation, shopping list hoặc adaptive target.
- API validation mới kiểm tra số dương; chưa có schema hợp đồng sâu, idempotency hay giới hạn kích thước snapshot.

## Phạm vi

- **Trong phạm vi**: macro target đáng tin cậy, food catalog chuẩn hóa, logging theo ngày, remaining-macro engine, corrective suggestions, meal solver có constraint, chỉnh sửa/thay thế, shopping list, lịch sử và adaptive feedback.
- **Ngoài phạm vi**: workout planning, nhận diện món từ ảnh trong giai đoạn đầu, tư vấn y khoa, bệnh lý chuyên biệt, thực phẩm bổ sung, thanh toán và social/community.

## Nguyên tắc sản phẩm

1. Mỗi màn hình phải trả lời một quyết định: hôm nay còn gì, bữa tới ăn gì, cần sửa gì.
2. Protein và calorie là constraint ưu tiên; carb/fat có tolerance mềm trừ khi người dùng chọn chế độ chặt.
3. Không tuyên bố “đạt mục tiêu” nếu bài toán không khả thi; phải giải thích constraint nào xung đột.
4. Mọi đề xuất phải truy vết được từ dữ liệu thực phẩm, khẩu phần và target.
5. Người dùng luôn có thể sửa; hệ thống tính lại từ nguồn dinh dưỡng, không tin số tổng do client gửi lên.
6. Giá và khẩu vị là dữ liệu cá nhân/địa phương, không coi một bảng giá hard-code là sự thật toàn cục.

## Chỉ số thành công

- Activation: người dùng hoàn tất target và log bữa đầu trong phiên đầu.
- Daily utility: tỷ lệ ngày có ít nhất hai food-log events.
- Correction value: tỷ lệ người dùng chấp nhận hoặc chỉnh nhẹ một đề xuất “bữa tiếp theo”.
- Plan quality: calorie trong ±5%, protein đạt tối thiểu 95%, tổng chi phí không vượt budget cứng.
- Feasibility honesty: 100% trường hợp bất khả thi có mã lý do và phương án nới constraint.
- Retention proxy: số ngày có macro check trong 7 và 28 ngày.
- Data quality: tỷ lệ food entry có nguồn, serving, macro đầy đủ và trạng thái verified.

## Chiến lược ranh giới

- **Vì sao chia như vậy**: target, food data, daily ledger và optimizer có vòng đời/rủi ro khác nhau; tách chúng giúp kiểm thử logic thuần và rollout từng phần.
- **Seam dùng chung**: đơn vị dinh dưỡng chuẩn trên 100 g/ml, serving conversion, timezone/ngày dinh dưỡng, snapshot version và tolerance policy.
- **Quy tắc ownership**: server tính totals; client chỉ gửi input intent. Mọi bảng cá nhân đều có `user_id`, RLS và ownership test.

## Specs theo thứ tự phụ thuộc

- [ ] macro-target-engine-v2 — Tạo mục tiêu macro có confidence, fallback khi không biết body-fat, guardrail và version hiệu lực. Dependencies: none
- [ ] nutrition-food-catalog — Chuẩn hóa thực phẩm, serving, nguồn dữ liệu, giá, dietary flags và food cá nhân. Dependencies: none
- [ ] daily-macro-checking — Ledger theo ngày, consumed/remaining, quick log, correction state và dashboard. Dependencies: macro-target-engine-v2, nutrition-food-catalog
- [ ] constraint-aware-meal-generation — Solver sinh bữa từ remaining macro, budget, số bữa, khẩu vị và tính khả thi. Dependencies: nutrition-food-catalog, daily-macro-checking
- [ ] meal-plan-experience — Chỉnh sửa, thay món, khóa món, regenerate cục bộ, shopping list và version history an toàn. Dependencies: constraint-aware-meal-generation
- [ ] adaptive-nutrition-loop — Điều chỉnh target bằng trend cân nặng, adherence và feedback có kiểm soát. Dependencies: daily-macro-checking, meal-plan-experience

## Kế hoạch phát hành

### Wave 0 — Đo lường và hợp đồng

- Chốt event taxonomy: target_created, food_logged, macro_checked, suggestion_generated, suggestion_accepted, meal_swapped.
- Chốt tolerance policy và định nghĩa “đạt”: calories ±5%, protein ≥95%, carb/fat theo range cấu hình.
- Chốt timezone và quy tắc ngày: mặc định Asia/Ho_Chi_Minh, hỗ trợ timezone người dùng.
- Tạo golden fixtures cho 10 persona: cut/bulk/maintain, ngân sách thấp/cao, vegetarian và food exclusion.

### Wave 1 — Nền tảng mục tiêu và dữ liệu

- Triển khai `macro-target-engine-v2` và `nutrition-food-catalog` song song.
- Migration không phá dữ liệu snapshot cũ; adapter đọc version cũ trong giai đoạn chuyển tiếp.
- UI onboarding gọn: profile → target recommendation → xác nhận/edit → target active.
- Không mở generator mới cho đến khi catalog có coverage tối thiểu theo category.

### Wave 2 — Daily Macro Checking MVP

- Cho phép quick-add từ food/serving, sửa/xóa log và copy từ ngày trước.
- Dashboard hiển thị consumed, remaining, progress ring, protein priority và budget remaining.
- Cung cấp 2–3 correction cards dựa trên remaining state, chưa cần full-day generator.
- Rollout sau feature flag; đo activation và lỗi dữ liệu trước khi mở mặc định.

### Wave 3 — Meal Generation V2

- Solver deterministic trước, có scoring và reason codes.
- Hỗ trợ generate phần còn lại của ngày và generate toàn ngày.
- Tự phát hiện infeasible; đề xuất tăng budget, giảm số constraint hoặc thay target mềm.
- So sánh generator v1/v2 bằng golden fixtures và property-based tests.

### Wave 4 — Meal Planning UX

- Swap một món hoặc một bữa mà không phá phần còn lại.
- Lock món yêu thích, regenerate phần chưa khóa, lưu version và rollback.
- Tạo shopping list tổng hợp, quy đổi đơn vị mua hàng và ước tính giá.
- Giảm Workout prominence trong navigation nếu quyết định sản phẩm được giữ nguyên.

### Wave 5 — Adaptive Loop

- Tổng hợp trend 14–21 ngày, không phản ứng với một lần cân.
- Chỉ đề xuất điều chỉnh nhỏ, yêu cầu người dùng xác nhận và giải thích lý do.
- Có cooldown, min/max calorie floor và audit trail cho mọi target change.

## Hợp đồng dữ liệu định hướng

- `nutrition_foods`: canonical nutrients, basis unit, category, source, confidence, verified status.
- `nutrition_servings`: food_id, label, grams/ml equivalent, household unit.
- `user_foods`: override cá nhân, brand/recipe riêng, visibility và provenance.
- `food_prices`: food_id, amount, price, location/source và effective_at.
- `macro_targets`: user_id, effective_from/to, target ranges, method, assumptions và version.
- `nutrition_days`: user_id, local_date, timezone, target snapshot, budget snapshot, status.
- `food_log_entries`: day_id, meal slot, food/serving snapshot, quantity, computed nutrients, idempotency key.
- `meal_generation_runs`: input snapshot, constraint policy, score, feasibility, reason codes và engine version.
- `meal_plan_versions`: normalized output hoặc bounded JSON snapshot với server-side validation.

## API định hướng

- `POST /api/macro-targets/recommend`: tính recommendation và trả assumptions/warnings.
- `POST /api/macro-targets/activate`: lưu target version hiệu lực.
- `GET /api/nutrition/foods`: search/filter/pagination, không gửi toàn catalog về client.
- `POST /api/nutrition-days/:date/entries`: quick log có idempotency.
- `PATCH/DELETE /api/nutrition-days/:date/entries/:id`: ownership + server recalculation.
- `GET /api/nutrition-days/:date/summary`: target, consumed, remaining, budget, warnings.
- `POST /api/meal-suggestions`: sinh correction cards hoặc full plan từ day state.
- `POST /api/meal-plans/:id/swap`: thay một slot với constraint giữ nguyên.
- `POST /api/meal-plans/:id/regenerate`: regenerate phần không khóa.

## Yêu cầu chất lượng

- Unit tests cho calculator, serving conversion, daily aggregation, solver scoring và feasibility.
- Property tests: tổng entry bằng tổng meal, tổng meal bằng tổng plan; số âm/NaN không thể xuất hiện.
- Contract tests cho API validation và backward compatibility.
- RLS tests cho food logs, target versions, user foods và plans.
- Golden tests chống regression cho persona và catalog cố định.
- Load test search catalog và generate p95; đặt timeout/fallback cho solver.
- Accessibility: keyboard logging, label đầy đủ, màu progress không là tín hiệu duy nhất.

## Rủi ro và biện pháp

- **Dữ liệu thực phẩm sai**: lưu provenance/confidence, moderation state và snapshot tại thời điểm log.
- **Optimizer tạo khẩu phần vô lý**: hard min/max serving, rounding step, category composition rules.
- **Target gây hại**: calorie floor, tốc độ tăng/giảm cân giới hạn, warning và không thay thế tư vấn y tế.
- **Giá nhanh lỗi thời**: cho phép user override, timestamp và coi budget là ước tính.
- **UI quá phức tạp**: quick log là đường chính; advanced constraints nằm trong progressive disclosure.
- **Snapshot JSON phình to**: giới hạn payload, schema version và chuyển dữ liệu query-heavy sang bảng chuẩn hóa.

## Definition of Done cấp chương trình

- Người dùng mới có thể tạo target, log một bữa và nhận trạng thái remaining trong dưới 3 phút.
- Người dùng hiện tại đọc được macro/meal versions cũ hoặc có migration rõ ràng.
- Generator không dùng lại heuristic v1 làm nguồn sự thật và luôn trả quality/feasibility metadata.
- Mọi mutation cá nhân có auth, ownership, RLS, validation và test negative-path.
- Dashboard hoạt động tốt trên mobile và hỗ trợ trạng thái loading/empty/error/offline hợp lý.
- Metrics đủ để quyết định tiếp tục, sửa hoặc loại bỏ từng wave.

