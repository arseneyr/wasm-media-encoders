#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )


# prevent emsdk from overriding PATH with Node 12
sed -i.bak '/emsdk\/emsdk_env.sh/d' /etc/bash.bashrc

# install yarn using corepack
apt remove -y yarn
su emscripten -c "corepack enable && corepack install -g ${SCRIPT_DIR}/corepack.tgz"