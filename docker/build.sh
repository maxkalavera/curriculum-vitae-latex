#! /bin/bash

# shellcheck disable=SC2155

########## Globals

readonly WORKSPACE="$(dirname "$(dirname "$(realpath "$0")")")"
readonly DOCKER="${WORKSPACE}/docker"
readonly DOCKER_FILE="${DOCKER}/Dockerfile"
readonly IMAGE_NAME="latex"

########## main

cd "$WORKSPACE" || echo "Workspace dir: $WORKSPACE doesn't exist" exit 1

function main () {
  docker build -t "$IMAGE_NAME" -f "$DOCKER_FILE" .
}

main "$@"
