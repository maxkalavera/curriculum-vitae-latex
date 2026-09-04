FROM debian:stable-slim

# Set environment variables
# ENV BINDIR="$HOME/.local/bin"

# Install system dependencies
RUN apt update && apt-get install -y \
    # TinyTex dependencies
    wget \
    perl \
    libfontconfig1 \
    libfreetype6 \
    libx11-6 \
    libxaw7 \
    libxmu6 \
    libxt6 \
    xz-utils \
    jq \
    gpg


RUN mkdir /root/install/
# Build is made with build.sh in this folder, witch puts the build context on the root of the project
# So the install script is relative to the root in the host machine
COPY --chown=root:root ./scripts/install-tinytex-unix.sh /root/install/install-tinytex-unix.sh
RUN /root/install/install-tinytex-unix.sh --bind-dir /usr/local/bin/