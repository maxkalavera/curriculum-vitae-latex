#! /bin/bash

# shellcheck disable=SC2155

########## Globals

readonly WORKSPACE="$(dirname "$(dirname "$(realpath "$0")")")"
readonly DOCKER="${ROOT}/docker"
# shellcheck disable=SC2034
readonly DOCKER_FILE="${DOCKER}/Dockerfile"

########## main

cd "$WORKSPACE" || echo "Workspace dir: $WORKSPACE doesn't exist" exit 1

function main () {
  docker run \
    -it \
    --rm \
    -v "${WORKSPACE}":/root/workspace \
    -w /root/workspace \
    debian-tinytex /bin/bash \
  
}

main "$@"
