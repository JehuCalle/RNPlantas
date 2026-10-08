#!/bin/sh
##############################################################################
##
##  Gradle start up script for UN*X
##
##############################################################################

# Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
DEFAULT_JVM_OPTS=""

APP_NAME="Gradle"
APP_BASE_NAME=`basename "$0"`

# Use the maximum available, or set MAX_FD != -1 to use that value.
MAX_FD="maximum"

warn () {
    echo "$*"
}

die () {
    echo
    echo "$*"
    echo
    exit 1
}

# OS specific support
case "$(uname)" in
    CYGWIN* )
        cygwin=true
        ;;
    MINGW* )
        mingw=true
        ;;
    Darwin* )
        darwin=true
        ;;
esac

# Resolve the location of the Gradle distribution root
# Use the gradle-wrapper.properties file
WRAPPER_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WRAPPER_JAR="$WRAPPER_DIR/gradle/wrapper/gradle-wrapper.jar"

if [ ! -f "$WRAPPER_JAR" ]; then
    die "Could not find gradle-wrapper.jar. Please run 'gradle wrapper' first or restore the wrapper files."
fi

exec java $DEFAULT_JVM_OPTS -jar "$WRAPPER_JAR" "$@"
