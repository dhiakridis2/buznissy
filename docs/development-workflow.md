# Development Workflow

## Branches

- `main`: stable branch.
- `develop`: optional integration branch when the team grows.
- `feature/<name>`: one feature per branch.
- `fix/<name>`: one bug fix per branch.

## Pull Request Checklist

Every pull request should include:

- What changed.
- How it was tested.
- Screenshots or screen recordings for UI work.
- Database migration notes when applicable.
- Environment variable changes when applicable.

## Definition of Done

A task is done only when:

1. The feature works locally.
2. Automated tests pass.
3. The code is pushed to GitHub.
4. Another teammate can review the PR.
5. Any setup instructions are documented.

## Testing Standards

- Domain rules get unit tests.
- API endpoints get integration tests.
- UI flows get component or end-to-end tests.
- Payment and auth flows must include negative-path tests.

For now, run:

```bash
node --test
```
