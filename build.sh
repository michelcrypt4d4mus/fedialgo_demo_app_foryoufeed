#!/bin/bash
set -e

git checkout github_pages
git merge master
NODE_ENV=production BUILD_GITHUB_PAGE=true FEDIALGO_DEBUG=false QUICK_MODE=false npx webpack --mode production
git commit -am"Build"
git push origin github_pages
git checkout master
