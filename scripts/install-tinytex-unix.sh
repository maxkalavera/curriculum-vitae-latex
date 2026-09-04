#! /bin/bash

# shellcheck disable=SC2329

set -e  # Exit on any error
set -u  # Exit when using undefined variable
set -o pipefail  # Pipeline fails if any command fails
# set -x  # Print commands as they execute (for debugging)

########## utils

# shellcheck disable=SC2034
{
  readonly TRUE="0"
  readonly FALSE="1"
}

function debug () {
  printf "\033[0;33mDEBUG: %s\033[0m\n" "$@" >&2
}

function echo-err () {
  printf "\033[0;31mError: %s\033[0m" "$@" >&2
  printf "\n" >&2
}

function echo-warn () {
  printf "\033[0;33mWarning: %s\033[0m" "$@" >&2
  printf "\n" >&2
}

function echo-success () {
  printf "\033[0;32m%s\033[0m" "$@" >&2
  printf "\n" >&2
}

# shellcheck disable=SC2329
function exit_code () {
  # shellcheck disable=SC2294
  eval "$@" > /dev/null 2>&1
  echo "$?"
}

function is_valid_exit_code() {
    [[ "$1" =~ ^[0-9]+$ ]] && [[ $1 -ge 0 ]] && [[ $1 -le 255 ]]
}

function try () {
  # try command return $TRUE=0 in success, return $FALSE=1 in failure
  # shellcheck disable=SC2294
  if eval "$@" > /dev/null 2>&1; then 
    echo "$TRUE"
    return 0
  else
    echo "$FALSE"
    return 1
  fi  
}

# shellcheck disable=SC2329
function is_true () {
  if ! is_valid_exit_code "$1"; then
    echo-err "is_true param should be boolean, received: \"$1\" "
    return 1
  fi
  # $1 return code of another command or $TRUE=0 or $FALSE=1
  local -r res="$( (( "$1" == 0 )); echo "$?" )"
  return "$res"
}

# shellcheck disable=SC2329
function is_false () {
  if ! is_valid_exit_code "$1"; then
    echo-err "is_false param should be boolean, received: \"$1\" "
    return 1
  fi  
  # $1 return code of another command or $TRUE=0 or $FALSE=1
  local -r res="$( (( $1 > 0 )); echo "$?" )"
  return "$res"
}

# shellcheck disable=SC2329
function ternary () {
  local -r boolean="$1"      # $1 predicate boolean
  local -r truthy="${2:-''}" # $2 true value
  local -r falsy="${3:-''}"  # $3 false value

  if is_true "$boolean"; then
    echo "${truthy}"
  else
    echo "${falsy}"
  fi
}

# shellcheck disable=SC2329
function join () {
  # $1 -> separator
  # ${@:2} -> strings
  local separator="$1"
  shift  #shift args to the left
  # shellcheck disable=SC2068
  printf "%s${separator}" $@ | 
    sed "s/${separator}$//"  # remove last separator
}

# shellcheck disable=SC2329
function map () {
  local -r mapper="$1"
  shift
  local -r len="$#"
  local result=()
  local item
  local next

  for (( index=1; index <= len; index++ )); do
    item="${!index}"
    next=$(eval "$mapper $item $index")
    result+=("$next")
  done

  echo "${result[@]}"
}

# shellcheck disable=SC2329
function filter () {
  local -r keep_fn="$1"
  shift
  local -r len="$#"
  local result=()
  local item

  for (( index=1; index <= len; index++ )); do
    item="${!index}"
    if eval "$keep_fn \"$item\" \"$index\""; then
      result+=("$item")
    fi

  done

  echo "${result[@]}"
}

# shellcheck disable=SC2329
function non_empty () {
  local -r item="$1"
  return "$(try "[[ \"$item\" != \"\" ]]")"
}

########## Helpers

function validate_installed {
  # $1 is_installed
  # $2 command_name
  if is_false "$1"; then
    echo-err "${2} is required to be installed but has not been found"
    exit 1
  fi
}

function is_linux () {
  local -r os="$1"
  return "$(try "[[ \"$os\" == \"Linux\" ]]")"
}

function is_mac () {
  local -r os="$1"
  return "$(try "[[ \"$os\" == \"Darwin\" ]]")"
}

function validate_os {
  local -r os=$(uname)

  if ! {
    [[ $os == "Linux" ]] ||
    [[ $os == "Darwin" ]]
  }; then
    echo-err "$os operating system is not supported for install"
    exit 1
  fi
}

function get_tinytex_dir () {
  local -r os="$1"
  if is_linux "$os"; then
    echo "$(realpath "$HOME")/.TinyTeX"
  elif is_mac "$os"; then
    echo "$(realpath "$HOME")/Library/TinyTeX"
  fi
}

function build_tmp_install_dir () {
  readonly tmp_dir="${TMPDIR:-/tmp}/tinytex-install"
  mkdir "$tmp_dir"
  echo "$tmp_dir"
}

function build_package_dict () {
  declare -A package=(
    ["version"]="${1:-"latest"}"
    ["base"]="${2:-""}"
    ["os"]="${3:-""}"
    ["arch"]="${4:-""}"
    ["ext"]="${5:-""}"
    ["use_installer"]="${6:-"$TRUE"}"
    ["use_new_names"]="${7:-"$TRUE"}"
    ["url"]="${8:-""}"
    ["filename"]="${9:-""}"
  )

  declare -p package
}

function select_package__old_names () {
  local -r version="${1:-"latest"}"
  local -r arch="${2:-"$(uname -m)"}"
  local -r os="${3:-"$(uname)"}"
  # declare package dict
  eval "$(build_package_dict)"
  package["use_new_names"]="$FALSE"
  package["version"]="$version"

  # Select package installer
  if {
    is_mac "$os" ||
    { 
      is_linux "$os"  && 
      [[ "$arch" == 'x86_64' ]]; 
    }
  }; then
    package["base"]="TinyTeX-1"
    package["use_installer"]="$FALSE"
  else
    if is_version_at_least "v2025.02" "$version"; then
      package["base"]="installer-unix"
    else
      package["base"]="install-unix"
    fi
  fi

  # Select extension
  if is_mac "$os"; then
    package["ext"]="tgz"
  else
    package["ext"]="tar.gz"
  fi

  declare -p package
}

function select_package__new_names () {
  # new naming scheme: TinyTeX-{N}-{os}[-{arch}][-v{VERSION}].tar.xz
  local -r version="${1:-"latest"}"
  local -r arch="${2:-"$(uname -m)"}"
  local -r os="${3:-"$(uname)"}"
  local -r installation_type="${4:-"TinyTeX-1"}"

  # declare package dict
  eval "$(build_package_dict)"
  package["use_new_names"]="$TRUE"
  package["version"]="$version"

  # Select package for install
  if is_mac "$os"; then
    package["base"]="$installation_type"
    package["os"]="darwin"
    package["use_installer"]="$FALSE"
    package["ext"]="tar.xz"

  elif is_linux "$os" && is_true "$is_musl"; then
    package["base"]="$installation_type"
    package["os"]="linuxmusl"
    package["arch"]="x86_64"
    package["use_installer"]="$FALSE"
    package["ext"]="tar.xz"

  elif is_linux "$os" && [[ "$arch" == 'aarch64' ]]; then
    package["base"]="$installation_type"
    package["os"]="linux"
    package["arch"]="arm64"
    package["use_installer"]="$FALSE"
    package["ext"]="tar.xz"

  elif is_linux "$os" && [[ "$arch" == 'x86_64' ]]; then
    package["base"]="$installation_type"
    package["os"]="linux"
    package["arch"]="x86_64"
    package["use_installer"]="$FALSE"
    package["ext"]="tar.xz"

  else
    package["base"]="installer-unix"
    package["ext"]="tar.gz"
  fi

  declare -p package
}

function build_package_filename () {
  # $1 -> separator
  # $2 -> extension
  # ${@:3} -> filename parts
  local -r separator="$1"; shift;
  local -r extension="$1"; shift;
  local -r parts=("$(filter non_empty "$@")")
  local -r basename="$(join "$separator" "${parts[@]}")"

  echo "${basename}.${extension}"
}

function get_latest_version () {
  validate_installed "$is_wget_installed" "wget"
  validate_installed "$is_jq_installed" "jq"

  local -r url="https://api.github.com/repos/rstudio/tinytex-releases/releases"
  local -r latest="$(
    wget -qO- "$url" |
    jq -r 'map(select(.tag_name != "daily")) | .[].tag_name' | 
    sort -Vr | 
    head -n 1
  )"
  echo "$latest"
}

function build_package_url () {
  eval "$1" # Declare $package from first param

  if [[ "${package["version"]}" == "daily" ]]; then
    local -r base="https://github.com/rstudio/tinytex-releases/releases/download/daily"
    local parts=(
      "${package["base"]}" 
      "${package["os"]}" 
      "${package["arch"]}"
    )
    local -r filename=$(build_package_filename "-" "${package["ext"]}" "${parts[@]}")
    package["filename"]="$filename"
    package["url"]="$base/$filename"
  else
    # For specific version
    local -r base="https://github.com/rstudio/tinytex-releases/releases/download"
    local -r version="${package["version"]}"
    local parts=(
      "${package["base"]}" 
      "${package["os"]}" 
      "${package["arch"]}"
      "$version"
    )
    local -r filename=$(build_package_filename "-" "${package["ext"]}" "${parts[@]}")
    package["filename"]="$filename"
    package["url"]="$base/$version/$filename"
  fi

  declare -p package
}

function get_tinytex_package_url () {
  local version="${1:-"latest"}"
  local -r arch="${2:-"$(uname -m)"}"
  local -r os="${3:-"$(uname)"}"
  local -r installation_type="${4:-""}"

  if [[ "$version" == 'latest' ]]; then 
    version="$(get_latest_version)"
  fi

  # new naming scheme: TinyTeX-{N}-{os}[-{arch}][-v{VERSION}].tar.xz
  # introduced after v2026.03.02; daily installs always use the new naming
  if { 
    [[ "$version" == 'daily' ]] ||
    is_version_at_least "v2026.03.02" "$version"
  }; then 
    # Declare $package with returned values
    eval "$(select_package__new_names "$version" "$arch" "$os" "$installation_type")"
  else
    # Declare $package with returned values
    eval "$(select_package__old_names "$version" "$arch" "$os")"
    package["use_new_names"]="$FALSE"
  fi

  build_package_url "$(declare -p package)"
}

function is_version_at_least () {
  # $target > $compare
  local -r compare="${1:-''}"
  local -r target="${2:-''}"
  local -r least=$(
    printf '%s\n' "$target" "$compare" | 
    sort -V | 
    tail -n1
  )
  return "$(try [[ "$target" == "$least" ]])"
}

function clean_installation () {
  local -r tinytex_dir="$1"

  if [[ -d "$tinytex_dir" ]]; then 
    rm -rf "$tinytex_dir"
  fi
}

function download_file () {
  local -r url="$1"
  local -r output_path="$2"

  wget --retry-connrefused --tries=11 --waitretry=30 --progress=dot:giga -O "$output_path" "$url"
}

function install-prebuilt () {
  local -r package_file="$1"
  local -r tinytex_dir="$2"
  tar xf "$package_file" -C "$(dirname "$tinytex_dir")"
}

function install-from-source () {
  local -r workdir="$1"
  local -r package_file="$2"
  local -r tinytex_dir="$3"

  debug "$workdir"

  pushd "$workdir"
  # tar xf "$package_file"
  ./install.sh
  mkdir -p "$tinytex_dir"
  mv texlive/* "$tinytex_dir"
  popd
}

function bind-tinytex-dir () {
  local bind_dir="$1"
  local no_bind="${2:- "$FALSE"}"

  if is_true "$no_bind"; then 
    return 0
  fi

  # First option
  if [[ ! -d "$bind_dir" ]]; then
    bind_dir="$HOME/.local/bin"
  fi

  # Second option
  if [[ ! -d "$bind_dir" ]]; then
    bind_dir="$HOME/bin"
  fi

  if [[ ! -d "$bind_dir" ]]; then
    echo-warn "TinyTeX bind location doesnt exist, tried with:"
    echo-warn "\"$1\" \"$HOME/.local/bin\" or \"$HOME/bin\" "
    echo-warn "Create a default bind folder, set a existing folder with --bind-dir"
    echo-warn "or the --no-bind to supress this error message"
    echo-warn "for now this step will be skiped"
    return 0
  fi

  ./tlmgr option sys_bin "$bind_dir"
}

function add_path_mac () {
  local success="$TRUE"

  if [ -w /usr/local/bin ]; then
    ./tlmgr path add
    success="$?"
  elif [[ -w "/etc/paths.d" ]]; then
    # shellcheck disable=SC2155
    grep -qxF "$(pwd)" /etc/paths.d/TinyTeX && export PATH="$PATH:$(pwd)"
    success="$?"
  else 
    echo "Admin privilege (password) is required to set up the PATH for TinyTeX:"
    printf '%s\n' "$(pwd)" | sudo tee /etc/paths.d/TinyTeX > /dev/null
    success="$?"
  fi

  if is_false "$success"; then
    echo-err "PATH to the bin folder could not been set"
    echo-err "To set up PATH manually, run the following command and add it to your shell startup profile (e.g. ~/.zshrc):"
    echo-err "  export PATH=\$PATH:$(pwd)"
    return 0
  fi
}

function add_path () {
  local -r os="${1:-"$(uname)"}"

  if is_mac "$os"; then
    add_path_mac
  elif is_linux "$os"; then
    ./tlmgr path add
  fi
}

########## Constants

# shellcheck disable=SC2155
# shellcheck disable=SC2034
{
  readonly is_perl_installed=$(try perl -mFile::Find -e 1)
  readonly is_tlmgr_installed=$(try tlmgr --version)
  readonly is_wget_installed=$(try wget --version)
  readonly is_xz_installed=$(try xz --version)
  readonly is_tar_installed=$(try tar --version)
  readonly is_jq_installed=$(try jq --version)

  readonly is_linux=$(try [[ "$(uname)" == "Linux" ]])
  readonly is_mac=$(try [[ "$(uname)" == "Darwin" ]])

  readonly is_musl=$(
    try ls /lib/libc.musl-*.so.1 &&
    try ldd --version 2>&1 | grep -qi musl
  )
}

########## Script options

# shellcheck disable=SC2155
# shellcheck disable=SC2034
{
  readonly ARCH="$(uname -m)"
  readonly OS="$(uname)"  # "Linux" | "Darwin"
  VERSION="latest"
  INSTALLATION=""
  BIND_DIR=""
  NO_PATH="$FALSE"
  NO_BIND="$(ternary "$(try is_mac "$OS")" "$TRUE" "$FALSE")"
  # FORCE_REBUILD="$FALSE"
}

readonly short_options=(
  -h
)
readonly long_options=(
  "help"
  "bind-dir:"
  "installation:"
  "no-path"
  "no-bind"
  # "force-rebuild"
)

function usage () {
  cat << EOF
  Usage: $(basename "$0") [OPTIONS] [ARGUMENTS]

  Options:
    -h, --help              Show this help message
    --install-version       TinyTeX version to install, by default install
                            latest, options: latest, daily or any released
                            verion (example: v2026.08)
    --bind-dir              Location to create symlinks for the installation 
                            bins, default: ~/.local/bin for linux
    --no-bind               Ignore binding or creating symlinks to 'bind-dir'
    --installation          Type of installation, options: 
                            TinyTeX-0, TinyTeX-1, TinyTeX-2 
                            (Option only valid after version: v2026.03.02)
    --no-path               Skip adding paths from the installation folder: 
                            ~/.TinyTex/bin/../ to bin-dir location
EOF
}

eval set -- "$(
  getopt \
    -o "$(join "," "${short_options[@]}")" \
    -l "$(join "," "${long_options[@]}")" \
    -n "$0" \
    -- "$@"
)"

while true; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;

    --install-version)
      VERSION="$2"
      shift 2
      ;;
    --bind-dir)
      BIND_DIR="$2"
      if ! [[ -d "$BIND_DIR" ]]; then 
        echo-err "Option --bind-dir needs to be a valid and existing location in the system"
        exit 1      
      fi
      shift 2
      ;;
    --installation)
      INSTALLATION="$2"
      shift 2
      if ! [[ "$INSTALLER" =~ ^TinyTeX-[0-2]$ ]]; then 
        echo-err "Option --installation has not a valid option: TinyTeX-0, TinyTeX-1, TinyTeX-2"
        exit 1
      fi
      ;;
    --no-path)
      NO_PATH="$TRUE"
      shift 1
      ;;
    --)
      shift
      break
      ;;
    *)
      echo-err "Unknown option: $1"
      exit 1
      ;;
  esac
done

########### Main

function main () {
  validate_os
  validate_installed "$is_perl_installed" "perl"
  validate_installed "$is_xz_installed" "xz"
  validate_installed "$is_tar_installed" "tar"

  local -r tinytex_dir=$(get_tinytex_dir "$OS")
  local -r tmp_dir="$(build_tmp_install_dir)"

  # Declare $package with returned values
  eval "$(get_tinytex_package_url "$VERSION" "$ARCH" "$OS" "$INSTALLATION")"

  clean_installation "$tinytex_dir"

  local package_file="$tmp_dir/${package["filename"]}"
  download_file "${package["url"]}" "$package_file" > /dev/null

  if is_true "${package["use_installer"]}"; then 
    install-from-source "$tmp_dir" "$package_file" "$tinytex_dir"
  else
    install-prebuilt "$package_file" "$tinytex_dir"
  fi

  rm -r "$tmp_dir"

  pushd "${tinytex_dir}"/bin/*/ > /dev/null
  bind-tinytex-dir "$BIND_DIR" "$NO_BIND"

  ./tlmgr postaction install script xetex  # GH issue #313
  
  # If adding path is not skipped, add to path
  if is_false "$NO_PATH"; then 
    add_path "$OS"
  fi
  popd > /dev/null

  echo-success "TiniTeX installed correctly on: $tinytex_dir"
  exit 0
}

main "$@"
