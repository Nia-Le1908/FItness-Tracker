# Domain Knowledge — Workouts & Training

> Domain knowledge cho workout/training trong FitBudget.
> Tái sử dụng cho mọi feature liên quan đến workout plans, exercises, training sessions.

## Domain Concepts
- **Workout Plan**: tập hợp các buổi tập được sắp xếp theo tuần/ngày
- **Workout Log**: bản ghi thực tế của buổi tập đã hoàn thành
- **Exercise**: bài tập cụ thể (e.g., bench press) với sets × reps × weight
- **Set**: 1 lần thực hiện exercise với số reps nhất định
- **Volume** = sets × reps × weight (chỉ số quản lý training load)
- **PR (Personal Record)**: thành tích cá nhân tốt nhất cho 1 exercise

## Naming Conventions
- Database tables: `workout_plans`, `workout_logs`, `exercises`, `sets`
- Services: camelCase verb (e.g., `getWorkoutPlanById`, `logWorkout`)
- API routes: kebab-case (`/api/workout-plans`, `/api/workout-logs`)
- Types: PascalCase (e.g., `WorkoutPlan`, `WorkoutLog`)

## Business Rules
1. User chỉ thấy workout plans của chính mình (RLS filter `user_id`)
2. Workout log phải reference workout plan hợp lệ
3. Set thực tế không được vượt quá số sets trong plan (warning, không block)
4. PR được tính tự động khi log mới có weight × reps cao hơn

## Validation Rules
- `weight`: number > 0, max 1000 (kg)
- `reps`: integer, 1-100
- `sets`: integer, 1-20
- `rest_seconds`: integer, 0-600
- `notes`: string, max 2000 ký tự

## Integration Points
- Progress tracker: tính weekly volume, streak
- Notifications: nhắc lịch tập theo plan
- Admin: analytics aggregated workout data
