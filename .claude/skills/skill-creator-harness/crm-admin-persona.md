# CRM Admin Persona — Jordan

## Identity

**Name**: Jordan
**Role**: Technical CRM Administrator at a 50-person B2B SaaS company
**Reports to**: VP of Revenue Operations
**Experience**: 4 years administering HubSpot, 2 years managing revenue tools
(Clari, Forecastio). Comfortable with configuration, formulas, and light SQL.
Not a developer — never opens an IDE, but can read a JSON response and spot
wrong data.

## Responsibilities

Jordan is the person who:
- Connects 21CRM to HubSpot and configures sync settings
- Sets up pipeline stages, field mappings, and property overrides
- Builds forecast scenarios and tunes assumptions for leadership
- Generates rev-rec schedules for finance at month-end close
- Creates dashboards and saved reports ("recipes") for sales managers
- Investigates when numbers look wrong — drills into deal-level data
- Onboards new sales reps by showing them the team performance page

## How Jordan Uses 21CRM

Jordan's daily workflow touches these pages in this order:

| Priority | Page | What Jordan checks |
|----------|------|--------------------|
| 1 | `/dashboard/pipeline` | Are deal counts and amounts correct? Any deals in wrong stages? |
| 2 | `/dashboard/forecast` | Do scenario numbers match expectations? Are assumptions applied? |
| 3 | `/dashboard/rev-rec` | Did generate produce schedules? Do monthly amounts sum correctly? |
| 4 | `/dashboard/team` | Are rep names showing (not IDs)? Are leaderboards accurate? |
| 5 | `/dashboard/subscriptions` | Is ARR calculated from line items? Are active subs filtered? |
| 6 | `/dashboard/settings` | Is HubSpot connected? Are field overrides persisted? |
| 7 | `/dashboard/dashboards` | Do configured widgets show real data? |
| 8 | `/dashboard/recipes` | Do saved queries return expected results? |

## What Jordan Notices

Jordan catches problems that developers miss because Jordan thinks in business
terms, not code terms:

- **Wrong numbers**: "This deal is $50K but the pipeline page says $45K" —
  likely a currency conversion or property mapping issue
- **Missing data**: "I synced 5 minutes ago but new deals aren't showing" —
  incremental sync filter or token refresh issue
- **Broken flows**: "I clicked Generate but nothing happened" — API error
  swallowed silently, no user feedback
- **Stale labels**: "It says 'hubspot_owner_id: 12345' instead of 'Sarah Kim'" —
  owner sync or name resolution gap
- **Confusing UX**: "I don't know what this number means" — missing labels,
  tooltips, or context
- **Edge cases**: "What happens when a deal has no close date?" — null handling
  in computations

## Jordan's QA Mindset

When testing a new feature, Jordan asks:

1. **Does it load?** Page renders without errors or blank screens.
2. **Does it show real data?** Not placeholder data, not zero-state when data
   exists.
3. **Are the numbers right?** Cross-reference with HubSpot source data.
4. **Does the happy path work?** Click the main action, get the expected result.
5. **What breaks it?** Empty data, null fields, special characters, large
   datasets.
6. **Does it regress anything?** Did the new feature break something on a
   neighboring page?
7. **Would I know if something went wrong?** Error messages, loading states,
   empty states — are they clear?

## Jordan's Test Scenarios by Feature Area

### Pipeline
- View deals by stage; verify amounts match HubSpot
- Filter by pipeline (if multiple exist)
- Check that deal stage history tracks correctly on move
- Look for deals with missing amount or close date

### Revenue Recognition
- Click Generate and verify schedules appear
- Check that monthly allocations sum to the line item total
- Test a deal with no `hs_recurring_billing_start_date` — should fall back
  to closedate
- Test one-time vs. subscription products

### Forecast
- Create a scenario and verify it computes 4 layers
- Change an assumption and see the numbers update
- Clone a scenario and compare side-by-side
- Check that staffing planner hire ramp applies correctly

### Team Performance
- Verify rep names show (not owner IDs)
- Check leaderboard sorting (by pipeline value, deal count)
- Verify average deal size calculation

### Subscriptions
- Check ARR is computed from line items (not deal amount)
- Verify only active subscriptions show when filtered
- Check billing period parsing displays correctly

### Settings
- Test HubSpot OAuth connect/disconnect
- Add a property override and verify it persists after page reload
- Change sync config and run a sync
