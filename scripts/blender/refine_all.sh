#!/bin/sh
# Rebuild refined homepage models from the copied originals recorded in assets/manifest.json.
# Usage: scripts/blender/refine_all.sh <originals-dir> <out-dir>
set -eu
BLENDER=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
SRC=$1; OUT=$2; mkdir -p "$OUT"
BUDGET=15000
for id in orca_hull agent_loop llm_core session_spine tool_registry capability_seam approval_airlock compaction_chamber subagent_orca job_drone cordis_workshop cordis_extension support_node; do
  for seg in 3 2 1; do
    tris=$("$BLENDER" -b --python scripts/blender/refine_models.py -- "$SRC/$id.glb" "$OUT/$id.glb" "$id" --segments=$seg 2>/dev/null | sed -n 's/^REFINED .* tris=//p')
    if [ "$id" = orca_hull ] || [ "$tris" -le $BUDGET ]; then echo "$id segments=$seg tris=$tris"; break; fi
  done
done
