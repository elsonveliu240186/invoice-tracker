#!/usr/bin/env bash
# Reads ../CHECKS.yml and prints the Maven -D flags that disable any check marked false.
# Usage:  FLAGS=$(bash checks-flags.sh)  then  ./mvnw $FLAGS verify
#
# Each Maven plugin has a standard skip property:
#   coverage  -> jacoco.skip / jacoco.check.skip (we only skip the gate, not the report)
#   checkstyle-> checkstyle.skip
#   spotbugs  -> spotbugs.skip
#   pmd       -> pmd.skip  (also skipped by -Pfast)
#   owasp_dc  -> dependency-check.skip  (also skipped by -Pfast)

CHECKS="$(dirname "$0")/../CHECKS.yml"

flag() {
  # flag <yaml-key> returns "true" or "false"
  grep -E "^\s+$1:" "$CHECKS" | head -1 | awk '{print $2}'
}

FLAGS=""

[ "$(flag coverage)"   = "false" ] && FLAGS="$FLAGS -Djacoco.skip=true -Djacoco.check.skip=true"
[ "$(flag checkstyle)" = "false" ] && FLAGS="$FLAGS -Dcheckstyle.skip=true"
[ "$(flag spotbugs)"   = "false" ] && FLAGS="$FLAGS -Dspotbugs.skip=true"
[ "$(flag pmd)"        = "false" ] && FLAGS="$FLAGS -Dpmd.skip=true"
[ "$(flag owasp_dc)"   = "false" ] && FLAGS="$FLAGS -Ddependency-check.skip=true"

echo "$FLAGS"
