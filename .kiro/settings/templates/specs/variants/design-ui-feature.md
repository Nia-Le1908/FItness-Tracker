# Design Document (UI-Feature) — Component/Screen

> Sử dụng cho việc thêm/chỉnh sửa UI component hoặc màn hình (khÔng API mới).

## Overview
**Screen/Component**: {{COMPONENT_NAME}}
**Purpose**: {{PURPOSE}}
**Users**: {{TARGET_USERS}}

## Goals
- {{GOAL_1}}
- {{GOAL_2}}

## User Flow
```mermaid
flowchart TD
  A[User enters screen] --> B{{CONDITION_1}}
  B -->|Yes| C[{{ACTION_1}}]
  B -->|No| D[{{ACTION_2}}]
  C --> E[{{RESULT_1}}]
  D --> E
```

## File Structure
```
components/{{COMPONENT_PATH}}/
├── {{COMPONENT_NAME}}.tsx           # Main component
├── {{COMPONENT_NAME}}-panel.ts      # Hook logic
├── {{COMPONENT_NAME}}.module.css    # Styles (nếu Tailwind không đủ)
└── index.ts                          # Exports
```

## Component Props
```typescript
interface {{COMPONENT_NAME}}Props {
  {{PROP_1}}: {{TYPE_1}};       // {{PROP_DESCRIPTION_1}}
  {{PROP_2}}: {{TYPE_2}};       // {{PROP_DESCRIPTION_2}}
  on{{EVENT_1}}?: ({{ARG}}: {{ARG_TYPE}}) => void;
}
```

## State Management
- **Local state**: {{LOCAL_STATE}}
- **Server state**: {{SERVER_STATE}}
- **URL state**: {{URL_STATE}}
- **Global state** (nếu có): {{GLOBAL_STATE}}

## Data Fetching
| Source | Hook | Cache Key | Refresh |
|--------|------|-----------|---------|
| {{SOURCE}} | `use{{HOOK_NAME}}` | `['{{DOMAIN}}', {{KEY}}]` | {{REFRESH_STRATEGY}} |

## Responsive Design
| Breakpoint | Layout | Notes |
|------------|--------|-------|
| mobile (<640px) | {{MOBILE_LAYOUT}} | {{MOBILE_NOTES}} |
| tablet (≥768px) | {{TABLET_LAYOUT}} | {{TABLET_NOTES}} |
| desktop (≥1024px) | {{DESKTOP_LAYOUT}} | {{DESKTOP_NOTES}} |

## Accessibility
- Keyboard nav: {{KEYBOARD_SUPPORT}}
- ARIA labels: {{ARIA_LABELS}}
- Focus management: {{FOCUS_BEHAVIOR}}

## Testing
- Unit: render, props, conditional rendering
- Interaction: click, form submit, navigation
- Visual: Storybook stories (default/loading/error/empty)

## Observability (nếu có)
- Track: {{EVENT_NAME}}
- Properties: {{PROPERTIES}}
