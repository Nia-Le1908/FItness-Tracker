# Templates Directory

Thư mục chứa templates cho cc-sdd + ECC workflows. User có thể tùy chỉnh疫情的 chọn template phù hợp trong phần settings.

## Cấu trúc

```
.kiro/settings/templates/
├── specs/                          # Templates cho spec documents
│   ├── design.md                   # (Mặc định) Design đầy đủ
│   ├── requirements.md             # (Mặc định) Requirements EARS format
│   ├── tasks.md                    # (Mặc định) Tasks format
│   ├── research.md                  # Research notes
│   ├── init.json                   # Spec initialization config
│   ├── requirements-init.md        # Initial requirements stub
│   └── variants/                   # ⚡ VARIANTS - chọn theo nhu cầu
│       ├── design-lean.md          # Design nhanh cho feature nhỏ
│       ├── design-api-only.md      # Design chỉ cho API route mới
│       ├── design-ui-feature.md    # Design cho UI component/screen
│       ├── requirements-lean.md    # Requirements tối giản
│       └── tasks-lean.md           # Tasks tối giản
│
├── steering/                       # Project-wide steering
│   ├── product.md                  # Product overview
│   ├── tech.md                     # Tech stack
│   └── structure.md                # Project structure
│
└── steering-custom/                # Custom steering documents
    ├── api-standards.md            # REST API standards
    ├── authentication.md           # Auth patterns
    ├── database.md                 # Database conventions
    ├── deployment.md               # Deploy conventions
    ├── error-handling.md           # Error handling patterns
    ├── security.md                 # Security rules
    ├── testing.md                  # Testing standards
    └── domain/                     # ⚡ DOMAIN-SPECIFIC - Gym/Fitness
        ├── workouts.md             # Workout & training domain
        ├── nutrition.md            # Meal plan & macro domain
        ├── billing.md              # PayOS & subscription domain
        ├── progress.md             # Progress & analytics domain
        └── admin.md                # Admin & observability domain
```

## Cách dùng

### 1. Chọn template cho spec mới
Khi tạo spec mới, overwrite file mặc định bằng variant phù hợp:
```powershell
# Feature nhỏ, chỉ thêm 1 API endpoint
Copy-Item .kiro/settings/templates/specs/variants/design-api-only.md `
  .kiro/specs/<feature-name>/design.md

# UI component mới
Copy-Item .kiro/settings/templates/specs/variants/design-ui-feature.md `
  .kiro/specs/<feature-name>/design.md
```

### 2. Chọn steering custom cho feature
Tạo steering document mới từ template:
```powershell
# Add workout-related steering
Copy-Item .kiro/settings/templates/steering-custom/domain/workouts.md `
  .kiro/steering/workouts.md
```

### 3. Tùy chỉnh templates
Mỗi file template dùng `{{PLACEHOLDER}}` để substitute. Sửa template dòngeneral → áp dụng cho mọi feature generate từ template đó.

Ví dụ: sửa `tech.md` để default thêm Next.js 16, Supabase, TailwindCSS:
```markdown
# Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Backend**: Supabase (Postgres, Auth, RLS)
- **Styling**: TailwindCSS
```

## Default đã config cho dự án FitBudget

- `product.md` đã có template cho fitness/gym app
- `tech.md` đã có Next.js + Supabase + React + TypeScript
- `structure.md` đã có App Router + services + components
- Domain steering templates phù hợp workout/meal/billing/progress/admin

## Khi nào dùng template nào?

| Tình huống | design template | req template | tasks template |
|------------|----------------|-------------|----------------|
| Feature lớn (multi-component) | `design.md` (mặc định) | `requirements.md` | `tasks.md` |
| Thêm 1 API route đơn giản | `design-api-only.md` | `requirements-lean.md` | `tasks-lean.md` |
| Thêm UI component | `design-ui-feature.md` | `requirements-lean.md` | `tasks-lean.md` |
| Bug fix nhỏ | `design-lean.md` | `requirements-lean.md` | `tasks-lean.md` |

## Domain steering — dùng khi nào?

Mỗi domain steering doc tóm tắt:
- Domain concepts (terms)
- Naming conventions cho domain đó
- Business rules cố định
- Validation rules
- Integration points với domain khác

Dùng khi làm feature liên quan:
- **workouts.md** → workout plans, logs, exercises
- **nutrition.md** → meal plans, macro, food items
- **billing.md** → payment, subscription, entitlement
- **progress.md** → progress entries, streaks, goals, charts
- **admin.md** → user management, audit, observability

Thêm domain khác: tạo file mới `.kiro/settings/templates/steering-custom/domain/{{domain}}.md`
