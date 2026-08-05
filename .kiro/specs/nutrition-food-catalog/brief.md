# Brief: nutrition-food-catalog

## Vấn đề

Meal Generator và food logging không thể đáng tin khi chỉ có năm món hard-code, không có serving, nguồn dữ liệu, dietary tags hoặc giá có thời điểm.

## Hiện trạng

`vietnameseFoods` nằm trong constants và API nhận toàn bộ food list từ client. Giá và macro được client gửi lên, vì vậy server chưa sở hữu nguồn sự thật.

## Kết quả mong muốn

Có catalog server-side tìm kiếm được, ưu tiên thực phẩm phổ biến tại Việt Nam, chuẩn hóa trên 100 g/ml, hỗ trợ serving gia dụng, dietary constraints, provenance và food cá nhân.

## Cách tiếp cận

Xây canonical catalog nhỏ nhưng có chất lượng trước; import qua pipeline có validation/deduplication. Mọi log lưu snapshot nutrient/serving để dữ liệu lịch sử không đổi khi catalog cập nhật.

## Phạm vi

- **Trong**: food, serving, category, tags, allergen, price estimate, source/confidence, verified state, user food/recipe cơ bản, search/pagination.
- **Ngoài**: barcode toàn cầu, computer vision, marketplace giá thời gian thực.

## Ranh giới

- Catalog là nguồn nutrient; price là dữ liệu có thời gian và có thể override.
- User recipe cần tính từ ingredient nhưng không làm meal optimization.
- Public verified foods và private user foods có policy riêng.

## Tiêu chí chính

- Không tin nutrient totals do client gửi.
- Serving conversion có round-trip tests.
- Search xử lý tên Việt/không dấu và alias phổ biến.
- Catalog tối thiểu phủ protein, starch, vegetable, fruit, fat và snack trước rollout.

## Phụ thuộc

- **Upstream**: Supabase schema/RLS bootstrap đã an toàn.
- **Downstream**: daily-macro-checking, constraint-aware-meal-generation.

