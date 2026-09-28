#!/usr/bin/env bash
# Build and publish dist/ to the gh-pages branch (GitHub Pages source).
set -euo pipefail
npm run build
cp dist/index.html dist/404.html
touch dist/.nojekyll
cd dist
git init -q -b gh-pages
git add -A
git -c user.name="deploy" -c user.email="deploy@users.noreply.github.com" commit -qm "Deploy $(date -u +%FT%TZ)"
git -c credential.helper= -c credential.helper="!gh auth git-credential" push -f "$(git -C .. remote get-url origin)" gh-pages
rm -rf .git
