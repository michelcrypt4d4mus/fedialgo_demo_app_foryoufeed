#!/bin/bash
set -e

MASTER_BRANCH="master"
GITHUB_PAGES_BRANCH="github_pages"

echo -e "Deploying..."
rm -fr docs/
git checkout $GITHUB_PAGES_BRANCH
git merge $MASTER_BRANCH --no-edit
NODE_ENV=production npx webpack --mode production

set +e
git add -A docs/
set -e

git commit -am"Build"
git push origin $GITHUB_PAGES_BRANCH
git checkout $MASTER_BRANCH
echo -e "Deploy complete."
