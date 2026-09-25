generate-front-page:
    bun --env-file=web/.env scripts/generate-front-page.ts

generate-category-page category_id:
    bun --env-file=web/.env scripts/generate-category-page.ts {{category_id}}

generate-edition:
    bun --env-file=web/.env scripts/generate-edition.ts

publish-draft-edition:
    bun --env-file=web/.env scripts/publish-draft-edition.ts
