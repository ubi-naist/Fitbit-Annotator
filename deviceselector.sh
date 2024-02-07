#!/bin/bash

SCRIPT_NAME=$(basename "$0")
function usage {
cat <<AVeryNotSoLongPhrase
SDK device version selector

Will select the dependencies file according to <Version>.
It will automatically run "npm i" to install those dependencies
after creating the symbolic links to package{-lock}.json files

Usage:
$SCRIPT_NAME <Version>

    <Version>: Device version.
               (sense1 | sense2 | versa3 | versa4)
AVeryNotSoLongPhrase
exit 0
}

if [ $# -eq 0 ] ; then
    printf "Error: No arguments supplied\n\n"
    usage
fi

DEV_VERSION=$1
NODE_BIN=$(which node)
NODE_EXISTS=$(if [[ -z "$NODE_BIN" ]]; then echo "no"; else echo "yes"; fi)
NPM_BIN=$(which npm)
NPM_EXISTS=$(if [[ -z "$NPM_BIN" ]]; then echo "no"; else echo "yes"; fi)

cleanup() {
    if [[ -d "./node_modules" ]]; then
        rm -rf "./node_modules"
    fi
    rm "./package.json"
    rm "./package-lock.json"
}

if [[ "$NODE_EXISTS" == "no" ]]; then
    echo "nodejs is not available in the environment"
    return 1
fi

NODE_VER=$(node -v | cut -d "." -f 1)
if [[ "$NODE_VER" != "v14" ]]; then
    echo "nodejs version ($NODE_VER) is not v14"
    return 1
fi

if [[ "$NPM_EXISTS" == "no" ]]; then
    echo "npm is not available in the environment"
    return 1
fi

SENSE1_CFG_EXISTS=$(if [[ -f "./package.json.sense1" && -f "./package-lock.json.sense1" ]]; then echo "yes"; else echo "no"; fi)
SENSE2_CFG_EXISTS=$(if [[ -f "./package.json.sense2" && -f "./package-lock.json.sense2" ]]; then echo "yes"; else echo "no"; fi)

if [[ "$DEV_VERSION" == "sense1" || "$DEV_VERSION" == "versa3" ]]; then
    if [[ "$SENSE1_CFG_EXISTS" == "no" ]]; then
        echo "No configuration files for sense1 or versa3 versions"
        exit 1
    fi

    cleanup
    ln -s "./package-lock.json.sense1" "./package-lock.json"
    ln -s "./package.json.sense1" "./package.json"
    npm i
fi

if [[ "$DEV_VERSION" == "sense2" || "$DEV_VERSION" == "versa4" ]]; then
    if [[ "$SENSE1_CFG_EXISTS" == "no" ]]; then
        echo "No configuration files for sense2 or versa4 versions"
        exit 1
    fi

    cleanup
    ln -s "./package-lock.json.sense2" "./package-lock.json"
    ln -s "./package.json.sense2" "./package.json"
    npm i
fi
