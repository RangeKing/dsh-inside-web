"""Refine DSH Inside GLB assets in Blender (headless).

Usage:
  Blender -b --python scripts/blender/refine_models.py -- <in.glb> <out.glb> <asset_id> [--segments=N] [--subdivide]

Hard-surface parts get a small angle-limited bevel and weighted normals so
edges catch light; the hull's organic panels get one subdivision level and
recomputed smooth normals. Object names, materials and transforms are kept,
so the site's node mapping (asset_id__part) and shell panels still work.

The hull's source texture is a fragmented atlas with baked per-island shading,
which reads as facets. Hull faces are instead assigned to the existing
MAT_HULL_DARK / MAT_IVORY materials by sampling that texture (with a majority
filter over neighbouring faces), and the textures are dropped.
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
    dims = max(obj.dimensions) or 1.0
    smooth_normals(obj, 30)
    bevel = obj.modifiers.new('refine_bevel', 'BEVEL')
    bevel.width = min(max(dims * 0.035, 0.008), 0.09)
    bevel.segments = SEGMENTS
    bevel.limit_method = 'ANGLE'
    bevel.angle_limit = math.radians(40)
    bevel.harden_normals = True
    bevel.use_clamp_overlap = True
    weighted = obj.modifiers.new('refine_weighted', 'WEIGHTED_NORMAL')
    weighted.keep_sharp = True


def refine_organic(obj) -> None:
    smooth_normals(obj, 60)
    if SUBDIVIDE_HULL is False:
        return
    sub = obj.modifiers.new('refine_subsurf', 'SUBSURF')
    sub.levels = sub.render_levels = 1
    sub.boundary_smooth = 'PRESERVE_CORNERS'
    sub.use_limit_surface = False


DARK = (0.032, 0.038, 0.05, 1.0)
IVORY_THRESHOLD = 0.42


def base_image(mat):
    if not mat or not mat.use_nodes:
        return None
    for node in mat.node_tree.nodes:
        if node.type == 'TEX_IMAGE' and node.image and 'normal' not in node.image.name and 'metal' not in node.image.name:
            return node.image
    return None


_pixels = {}


def luminance_sampler(img):
    if img.name not in _pixels:
        w, h = img.size
        px = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        px = px.reshape(h, w, 4)
        _pixels[img.name] = (0.2126 * px[..., 0] + 0.7152 * px[..., 1] + 0.0722 * px[..., 2], w, h)
    lum, w, h = _pixels[img.name]

    def sample(u, v):
        x = min(w - 1, max(0, int((u % 1.0) * w)))
        y = min(h - 1, max(0, int((v % 1.0) * h)))
        return float(lum[y, x])
    return sample


def zone_materials(obj, ivory) -> bool:
    """Replace a baked texture with dark / ivory material zones per face."""
    mesh = obj.data
    img = base_image(mesh.materials[0]) if mesh.materials else None
    if img is None or not mesh.uv_layers:
        return False
    sample = luminance_sampler(img)
    uv = mesh.uv_layers.active.data
    labels = []
    for poly in mesh.polygons:
        pts = [uv[i].uv for i in poly.loop_indices]
        cu = sum(p.x for p in pts) / len(pts)
        cv = sum(p.y for p in pts) / len(pts)
        values = [sample(cu, cv)] + [sample(p.x * .6 + cu * .4, p.y * .6 + cv * .4) for p in pts]
        labels.append(sorted(values)[len(values) // 2] > IVORY_THRESHOLD)
    # Majority filter over edge-adjacent faces removes texture speckle.
    edge_faces = {}
    for poly in mesh.polygons:
        for key in poly.edge_keys:
            edge_faces.setdefault(key, []).append(poly.index)
    neighbours = [set() for _ in mesh.polygons]
    for faces in edge_faces.values():
        for a in faces:
            neighbours[a].update(f for f in faces if f != a)
    for _ in range(3):
        labels = [(sum(labels[n] for n in neighbours[i]) + labels[i] * 1.5) / (len(neighbours[i]) + 1.5) > .5 for i in range(len(labels))]
    if ivory.name not in [m.name for m in mesh.materials if m]:
        mesh.materials.append(ivory)
    slot = [m.name for m in mesh.materials].index(ivory.name)
    for poly, is_ivory in zip(mesh.polygons, labels):
        poly.material_index = slot if is_ivory else 0
    return True


def strip_textures(mat, color) -> None:
    bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    for node in [n for n in mat.node_tree.nodes if n.type in ('TEX_IMAGE', 'NORMAL_MAP', 'SEPARATE_COLOR', 'SEPARATE_RGB')]:
        mat.node_tree.nodes.remove(node)
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Metallic'].default_value = 0.18
    bsdf.inputs['Roughness'].default_value = 0.48


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
if asset_id == 'orca_hull':
    ivory = bpy.data.materials['MAT_IVORY']
    textured = {o.data.materials[0] for o in bpy.data.objects if o.type == 'MESH' and o.data.materials and base_image(o.data.materials[0])}
    for obj in [o for o in bpy.data.objects if o.type == 'MESH']:
        zone_materials(obj, ivory)
    for mat in textured:
        strip_textures(mat, DARK)
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
    export_draco_position_quantization=14, export_draco_normal_quantization=10,
    export_normals=True, export_texcoords=True, export_materials='EXPORT',
    export_extras=False, export_cameras=False, export_lights=False,
)
tris = 0
for obj in [o for o in bpy.data.objects if o.type == 'MESH']:
    mesh = obj.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
    tris += sum(len(p.vertices) - 2 for p in mesh.polygons)
print(f'REFINED {asset_id} tris={tris}')
