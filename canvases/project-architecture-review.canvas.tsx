import { Card, CardBody, CardHeader, Divider, Grid, H1, H2, H3, Row, Stack, Stat, Table, Text, useHostTheme } from 'cursor/canvas';

export default function ProjectArchitectureReviewCanvas() {
  const theme = useHostTheme();

  const layers = [
    { layer: 'UI / App Router', items: 'app/* pages, layout, redirects, API routes', notes: 'Next.js 15 app router is the public entrypoint.' },
    { layer: 'Feature Components', items: 'dashboard, auth, macro, meal, workout, progress', notes: 'Panels own the screen-level UI and interaction.' },
    { layer: 'Domain Services', items: 'macro-calculator, meal-planner, workout.service, progress-tracker', notes: 'Business logic is separated from UI and routes.' },
    { layer: 'API / Data Access', items: 'app/api/*, lib/api/*, Supabase helpers', notes: 'Routes validate, authenticate, and persist via Supabase.' },
    { layer: 'Shared Types / Utils', items: 'types/*, lib/utils.ts, constants', notes: 'Shared contracts reduce drift across layers.' }
  ];

  const strengths = [
    'Clear separation between screens, services, and API routes.',
    'Supabase auth/data flow is already wired end-to-end.',
    'Dashboard gives a single hub for navigation and progress visibility.',
    'TypeScript plus shared type definitions help keep contracts consistent.'
  ];

  const risks = [
    'Several folders suggest a lot of feature surface area; consistency across panels may become harder to maintain.',
    'Some client components create Supabase clients directly inside render paths, which can cause repeated instantiation if not memoized.',
    'Validation and error handling appear to be hand-rolled in multiple API routes; duplication may grow.',
    'The repo currently includes generated/test/config files that may need a tighter maintenance story.'
  ];

  const improvements = [
    'Introduce a shared API result/error helper pattern across all route handlers.',
    'Add feature-level folder conventions for components/services/types to reduce cross-folder hunting.',
    'Move repeated auth/session checks into shared hooks or guards.',
    'Add a small test suite for core domain services, especially macro and progress logic.'
  ];

  return (
    <Stack gap={20} style={{ color: theme.text.primary, background: theme.bg.editor, padding: 24 }}>
      <H1>FitBudget project review</H1>
      <Text tone="secondary">Architecture map, folder review, and current quality observations.</Text>

      <Grid columns={4} gap={12}>
        <Stat value="5" label="Main layers" />
        <Stat value="4" label="Feature areas" />
        <Stat value="3" label="API domains" />
        <Stat value="1" label="Core backend" />
      </Grid>

      <Card>
        <CardHeader title="Architecture flow" />
        <CardBody>
          <Stack gap={12}>
            {layers.map((layer, index) => (
              <Row key={layer.layer} align="start" gap={12}>
                <Text weight="semibold" style={{ minWidth: 140, color: index === 0 ? theme.accent.primary : theme.text.primary }}>{layer.layer}</Text>
                <Stack gap={4}>
                  <Text>{layer.items}</Text>
                  <Text tone="secondary" size="small">{layer.notes}</Text>
                </Stack>
              </Row>
            ))}
          </Stack>
        </CardBody>
      </Card>

      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader title="Folder / file review" />
          <CardBody>
            <Table
              headers={["Area", "What it does", "Notes"]}
              rows={[
                ["app/", "Pages, layout, API routes", "Main Next.js surface; `app/page.tsx` redirects to dashboard."],
                ["components/", "Screen panels and shared UI", "Most user-facing functionality lives here."],
                ["services/", "Business logic", "Good place for pure calculations and orchestration."],
                ["lib/", "API, Supabase, utilities", "Cross-cutting helpers and client/server glue."],
                ["types/", "Shared contracts", "Useful for keeping UI and services in sync."],
                ["tools/", "Project scripts", "Likely setup or generated helper scripts."],
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Current quality scan" />
          <CardBody>
            <Stack gap={14}>
              <div>
                <H3>Likely strengths</H3>
                <Stack gap={8}>
                  {strengths.map((item) => (
                    <Text key={item}>• {item}</Text>
                  ))}
                </Stack>
              </div>
              <Divider />
              <div>
                <H3>Likely risks</H3>
                <Stack gap={8}>
                  {risks.map((item) => (
                    <Text key={item}>• {item}</Text>
                  ))}
                </Stack>
              </div>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <Card>
        <CardHeader title="Recommended next improvements" />
        <CardBody>
          <Stack gap={8}>
            {improvements.map((item, index) => (
              <Row key={item} align="start" gap={12}>
                <Text weight="semibold" style={{ color: theme.accent.primary, minWidth: 24 }}>{index + 1}.</Text>
                <Text>{item}</Text>
              </Row>
            ))}
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}
