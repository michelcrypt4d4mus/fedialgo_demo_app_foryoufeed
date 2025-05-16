#!/bin/bash
set -e

echo -e "Deploying..."
git checkout github_pages
git merge master
NODE_ENV=production npx webpack --mode production
git commit -am"Build"
git push origin github_pages
git checkout master
echo -e "Deploy complete."
