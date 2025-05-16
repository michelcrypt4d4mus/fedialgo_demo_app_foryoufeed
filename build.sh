#!/bin/bash

NODE_ENV=production npx webpack --mode production
git commit -am"Build"
git push origin github_pages
