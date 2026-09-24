"""Refine DSH Inside GLB assets in Blender (headless).

Usage:
  Blender -b --python scripts/blender/refine_models.py -- <in.glb> <out.glb> <asset_id> [--segments=N] [--subdivide]

Hard-surface parts get a small angle-limited bevel and weighted normals so
edges catch light; the hull's organic panels get one subdivision level and
recomputed smooth normals. Object names, materials and transforms are kept,
so the site's node mapping (asset_id__part) and shell panels still work.

The hull keeps its original geometry. Its source colour texture has baked
lighting and speckle, and its normal / roughness maps add a glitter of tiny
facets; together they read as spikes. The hull texture is therefore rebuilt in
texture space (three classes: dark, ivory, cyan, taken as the texture's own
median colours; speckle removed with a small blur-and-threshold, borders
anti-aliased), the normal and metallic-roughness maps are dropped, and
normals are smoothed only across faces less than 22 degrees apart so panel
edges stay crisp. Face-level material zoning (tried on 2026-09-24) produced
jagged dark/ivory borders and was removed.
"""
import sys
import math
import bpy
import bmesh
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:]
src, dst, asset_id = argv[0], argv[1], argv[2]
# The hull keeps its topology by default (subdividing opened seams between panels); --subdivide opts in.
SUBDIVIDE_HULL = '--subdivide' in argv
# Bevel segments for hard-surface parts; lower it to stay inside a triangle budget.
SEGMENTS = int(next((a.split('=')[1] for a in argv if a.startswith('--segments=')), 3))

# Hull parts that read as organic surfaces; everything else is treated as hard-surface.
ORGANIC = ('panel_head', 'panel_belly', 'panel_spine', 'panel_workshop', 'tail', 'pectoral', 'dorsal', 'panel_tool')


def is_organic(name: str) -> bool:
    return asset_id == 'orca_hull' and any(k in name for k in ORGANIC) and 'lights' not in name


def weld(obj) -> None:
    """glTF import gives each face its own vertices; weld them so bevels see real edges."""
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=max(max(obj.dimensions), 1e-3) * 1e-5)
    bm.to_mesh(mesh)
    bm.free()


def smooth_normals(obj, angle_deg: float) -> None:
    """Drop imported custom normals and shade smooth up to an angle."""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    if obj.data.has_custom_normals:
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angle_deg), keep_sharp_edges=True)
    obj.select_set(False)


def refine_hard_surface(obj) -> None:
    dims = sorted(d for d in obj.dimensions if d > 1e-4) or [1.0]
    smooth_normals(obj, 30)
    bevel = obj.modifiers.new('refine_bevel', 'BEVEL')
    # Size from the thinnest side, so rails and plates do not grow slivers.
    bevel.width = min(max(dims[-1] * 0.035, 0.006), 0.09, dims[0] * 0.18)
    bevel.segments = SEGMENTS
    bevel.limit_method = 'ANGLE'
    bevel.angle_limit = math.radians(40)
    bevel.harden_normals = True
    bevel.use_clamp_overlap = True
    weighted = obj.modifiers.new('refine_weighted', 'WEIGHTED_NORMAL')
    weighted.keep_sharp = True


def refine_organic(obj) -> None:
    smooth_normals(obj, HULL_SMOOTH_ANGLE)
    if SUBDIVIDE_HULL is False:
        return
    sub = obj.modifiers.new('refine_subsurf', 'SUBSURF')
    sub.levels = sub.render_levels = 1
    sub.boundary_smooth = 'PRESERVE_CORNERS'
    sub.use_limit_surface = False


HULL_SMOOTH_ANGLE = 22


def clean_hull_texture(img):
    """Rebuild the baked hull texture as flat dark / ivory / cyan zones in texture space."""
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    rgb = px[..., :3]
    lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    cyan = (rgb[..., 2] - rgb[..., 0] > 0.35) & (rgb[..., 2] > 0.45)
    ivory = (lum > 0.40) & ~cyan
    dark = ~ivory & ~cyan & (lum > 0.01)
    palette = [np.median(rgb[m], axis=0) for m in (dark, ivory, cyan)]

    def blur(mask, passes):
        a = mask.astype(np.float32)
        for _ in range(passes):
            a = (a + np.roll(a, 1, 0) + np.roll(a, -1, 0) + np.roll(a, 1, 1) + np.roll(a, -1, 1)) / 5
        return a
    ivory_w = np.clip((blur(ivory, 2) - 0.35) / 0.3, 0, 1)[..., None]
    cyan_w = np.clip((blur(cyan, 1) - 0.3) / 0.3, 0, 1)[..., None]
    col = palette[0] * (1 - ivory_w) + palette[1] * ivory_w
    col = col * (1 - cyan_w) + palette[2] * cyan_w
    out = np.concatenate([col, np.ones((h, w, 1))], axis=2).astype(np.float32)
    path = bpy.app.tempdir + 'hull_basecolor_zones.png'
    tmp = bpy.data.images.new('hull_basecolor_zones', w, h, alpha=False)
    tmp.pixels.foreach_set(out.ravel())
    tmp.filepath_raw = path
    tmp.file_format = 'PNG'
    tmp.save()
    clean = bpy.data.images.load(path)
    clean.name = 'hull_basecolor_zones'
    print('HULL_PALETTE', [p.round(3).tolist() for p in palette])
    return clean


def refine_hull_materials() -> None:
    """Swap in the cleaned colour texture; drop normal and metallic-roughness maps."""
    for mat in {m for o in bpy.data.objects if o.type == 'MESH' for m in o.data.materials if m and m.use_nodes}:
        nodes = mat.node_tree.nodes
        for node in [n for n in nodes if n.type == 'TEX_IMAGE' and n.image]:
            name = node.image.name
            if 'normal' in name or 'metal' in name:
                nodes.remove(node)
        for node in [n for n in nodes if n.type in ('NORMAL_MAP', 'SEPARATE_COLOR', 'SEPARATE_RGB')]:
            nodes.remove(node)
        for node in [n for n in nodes if n.type == 'TEX_IMAGE' and n.image]:
            if node.image.name not in _cleaned:
                _cleaned[node.image.name] = clean_hull_texture(node.image)
            node.image = _cleaned[node.image.name]


_cleaned = {}


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
if asset_id == 'orca_hull':
    refine_hull_materials()
for obj in [o for o in bpy.data.objects if o.type == 'MESH']:
    weld(obj)
    if 'emissive' in obj.name or 'lights' in obj.name or len(obj.data.polygons) < 4:
        smooth_normals(obj, 30)
        continue
    if is_organic(obj.name):
        refine_organic(obj)
    else:
        refine_hard_surface(obj)

for obj in [o for o in bpy.data.objects if o.type == 'MESH']:
    obj.data.name = obj.name  # multi-material parts keep their semantic name on every primitive

bpy.ops.export_scene.gltf(
    filepath=dst, export_format='GLB', export_apply=True, export_yup=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14, export_draco_normal_quantization=10, export_image_format='AUTO',
    export_normals=True, export_texcoords=True, export_materials='EXPORT',
    export_extras=False, export_cameras=False, export_lights=False,
)
tris = 0
for obj in [o for o in bpy.data.objects if o.type == 'MESH']:
    mesh = obj.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
    tris += sum(len(p.vertices) - 2 for p in mesh.polygons)
print(f'REFINED {asset_id} tris={tris}')
