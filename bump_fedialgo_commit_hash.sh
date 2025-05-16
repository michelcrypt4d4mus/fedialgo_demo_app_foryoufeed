#!/usr/bin/env bash
# Script to bump the commit hash of the fedialgo package.
set -e


pushd ../fedialgo
git push origin master

# Check if there is an argument passed, if so use that for the git tag. Otherwise use latest commit.
if [ -z "$1" ]; then
    echo "Using latest commit hash from fedialgo repo for package.json update..."
    FEDIALGO_COMMIT_OR_TAG=$(git log -1 --format=%H)
else
    echo "Using version argument $1 for package.json update..."
    FEDIALGO_COMMIT_OR_TAG="$1"
fi

echo -e "\n\nGot FEDIALGO_COMMIT_OR_TAG: $FEDIALGO_COMMIT_OR_TAG"

popd
echo -e "\nRunning 'npm install github:michelcrypt4d4mus/fedialgo#${FEDIALGO_COMMIT_OR_TAG}'..."
npm install --save github:michelcrypt4d4mus/fedialgo#${FEDIALGO_COMMIT_OR_TAG}
git commit -am "Bump fedialgo commit to $FEDIALGO_COMMIT_OR_TAG"
git push origin master

if [ -z "$1" ]; then
    ./link_local_fedialgo.sh
fi

echo -e "\nFinished updating fedialgo demo app package.json."
