#!/bin/bash
set -e

MASTER_BRANCH="master"
GITHUB_PAGES_BRANCH="github_pages"

echo -e "Deploying..."
git checkout $GITHUB_PAGES_BRANCH
git merge $MASTER_BRANCH --no-edit
NODE_ENV=production npx webpack --mode production
git commit -am"Build"
git push origin $GITHUB_PAGES_BRANCH
git checkout $MASTER_BRANCH
echo -e "Deploy complete."
