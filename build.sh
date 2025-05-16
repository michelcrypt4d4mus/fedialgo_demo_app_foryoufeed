#!/bin/bash

BUILD_GITHUB_PAGE=true FEDIALGO_DEBUG=false QUICK_MODE=false NODE_ENV=production npx webpack --mode production
git commit -am"Build"
git push origin github_pages
