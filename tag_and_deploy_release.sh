#!/usr/bin/env bash -l
# SKIP_DEPLOY can be set in env to skip the actual deploy.
set -e


assert_repo_is_ready() {
    git_check_master_branch

    if [[ ! any_uncommitted_changes ]]; then
        echo "There are uncommitted changes. Please commit or stash them before running this script."
        exit 1
    fi
}


# TODO: package-lock.json doesn't update its version number, so we should also update it.
tag_repo() {
    local version_number="$1"
    local repo_dir=`basename $PWD`

    echo "Updating package.json in $repo_dir with version: $version_number..."
    local package_json_sed_cmd="s/\"version\": \"[0-9]+\.[0-9]+\.[0-9]+\",/\"version\": \"${version_number#v}\",/g"
    sed -E -i .sedbak "$package_json_sed_cmd" package.json

    set +e
    rm package.json.sedbak
    git commit -am"Bump package.json version to $version_number"
    set -e

    echo "Tagging repo $repo_dir with version: $version_number..."
    git push origin "$MASTER_BRANCH"
    git tag "$version_number"
    git push origin "$version_number"
    echo "Finished tagging $repo_dir with version: $version_number."
}


# Set vars
assert_repo_is_ready
MASTER_BRANCH="master"
VERSION_NUMBER=`git_get_tag_version`

if [[ "$VERSION_NUMBER" != v* ]]; then
    VERSION_NUMBER="v$VERSION_NUMBER"
fi


# Handle fedialgo dir
pushd ../fedialgo
assert_repo_is_ready
update_changelog "$VERSION_NUMBER"
tag_repo "$VERSION_NUMBER"
./deploy_documentation.sh
popd


# Handle demo app dir (this dir)
./bump_fedialgo_commit_hash.sh "$VERSION_NUMBER"  # This will execute a commit
tag_repo "$VERSION_NUMBER"
echo -e "\nFinished tagging fedialgo $VERSION_NUMBER."

# Deploy the demo app
if [[ -z "$SKIP_DEPLOY" ]]; then
    ./deploy.sh
else
    echo "\n\n\n\nSkipping deploy...\n\n\n\n"
fi

./link_local_fedialgo.sh
