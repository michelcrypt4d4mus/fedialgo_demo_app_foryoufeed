#!/usr/bin/env bash -l
set -e


assert_repo_is_ready() {
    git_check_master_branch

    if [[ ! any_uncommitted_changes ]]; then
        echo "There are uncommitted changes. Please commit or stash them before running this script."
        exit 1
    fi
}


tag_repo() {
    local version_number="$1"
    local repo_dir=`basename $PWD`

    local package_json_sed_cmd="s/\"version\": \"[0-9]+\.[0-9]+\.[0-9]+\",/\"version\": \"${version_number#v}\",/g"
    sed -E -i .sedbak "$package_json_sed_cmd" package.json
    rm package.json.sedbak
    git commit -am"Bump package.json version to $version_number"

    echo "Tagging repo $repo_dir with version: $version_number"
    git push origin "$MASTER_BRANCH"
    git tag "$version_number"
    git push origin "$version_number"
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
git commit -am"Bump last CHANGELOG.md version to $VERSION_NUMBER"
tag_repo "$VERSION_NUMBER"

# Handle demo app dir (this dir)
popd
./bump_fedialgo_commit_hash.sh "$VERSION_NUMBER"  # This will execute a commit
tag_repo "$VERSION_NUMBER"
echo -e "\nFinished tagging fedialgo $VERSION_NUMBER."

# Deploy the demo app
./deploy.sh
./link_local_fedialgo.sh
