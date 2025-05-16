#!/bin/bash
set -e

git checkout github_pages
git merge master
NODE_ENV=production npx webpack --mode production
git commit -am"Build"
git push origin github_pages
git checkout master
