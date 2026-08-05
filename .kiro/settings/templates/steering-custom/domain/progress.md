# Domain Knowledge — Progress Tracking & Analytics

> Domain knowledge cho progress, streaks, goals, charts.

## Domain Concepts
- **Progress Entry**: 1 bản ghi đo lường (weight, body fat %, measurements) tại 1 thời điểm
- **Streak**: chuỗi ngày liên tiếp thực hiện habit (workout streak, meal log streak)
- **Goal**: mục tiêu cá nhân (target weight, target workout volume, target streak)
- **Milestone**: điểm mốc quan trọng (100kg squat, 90 days streak)
- **Weekly Volume** = tổng volume workout trong 1 tuần (Sun-Sat)
- **Trend**: moving average 7-30 ngày cho 1 metric

## Naming Conventions
- Tables: `progress_entries`, `goals`, `goal_reminders`
- Services: `logProgress`, `getWeeklyVolume`, `calculateStreak`
- API routes: `/api/progress`, `/api/settings/goal`, `/api/goal-reminders`
- Chart data format: `{ date: ISO, value: number, label?: string }[]`

## Business Rules
1. Progress entry không trùng date cho cùng `metric_type` (upsert)
2. Streak tính dựa trên logs có timestamp trong ngày (UTC midnight boundary)
3. Goal expire không xóa — giữ historical, set `status = 'expired'`
4. Goal reminders là opt-in, tối đa 1 reminder/ngày

## Trend Calculations
- **Moving average**: 7-day MA = avg của 7 ngày gần nhất
- **Volume trend**: weekly sum rolling 4 tuần
- **Body weight trend**: 7-day MA (bỏ qua outliers > 5kg so với MA)

## Chart Standards
- Colors (consistent across app):
  - Workout volume: `#3B82F6` (blue-500)
  - Calories: `#10B981` (green-500)
  - Body weight: `#8B5CF6` (purple-500)
- Time zones: hiển thị theo user's local timezone (`Asia/Ho_Chi_Minh` default)
- Date format: `DD/MM/YYYY` cho display, ISO cho data
- Null handling: `null` = no data, không phải 0

## Date Conventions
- Week boundary: Sunday 00:00 → Saturday 23:59
- Month boundary: 1st → last day
- For comparison: dùng UTC date ISO, tránh DST issue

## Validation Rules
- `weight`: number > 0, max 500 (kg)
- `body_fat_percent`: number 0-100
- `measurement_*`: number > 0, max 300 (cm)
- `goal_target`: number > 0
- `goal_deadline`: date trong tương lai

## Integration Points
- Workouts: tính weekly volume trend
- Nutrition: tính calorie/Macro trends
- Notifications: nhắc log progress, celebrate milestone
- Admin: aggregated progress metrics
