# HyperRoot ticker image, rendered: a glossy mint seed (a slightly flattened sphere with a soft groove) and a 3D root
# system growing down from it (tapered bevelled curves that wander, fork and thin out), mint emissive cores under a
# glossy skin, on a near-black backdrop with a soft spotlight; Cycles + glare (bloom) in the compositor.
# blender -b --factory-startup --python art/ticker3d.py -- <out.png> [seed] [samples] [res]
import bpy, math, random, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0]) if argv else os.path.abspath("root_ticker.png")
random.seed(int(argv[1]) if len(argv) > 1 else 7)
SAMPLES = int(argv[2]) if len(argv) > 2 else 160; RES = int(argv[3]) if len(argv) > 3 else 1200
RADIAL = (argv[4] if len(argv) > 4 else 'radial') == 'radial'
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
sc = bpy.context.scene

def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c)
def P(m): return next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
def setin(p, names, v):
    for n in names:
        if n in p.inputs: p.inputs[n].default_value = v; return
def mat(name, col, rough, emit=0.0, coat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; p = P(m)
    setin(p, ["Base Color"], (*srgb(col), 1)); setin(p, ["Roughness"], rough)
    setin(p, ["Coat Weight", "Clearcoat"], coat); setin(p, ["Coat Roughness", "Clearcoat Roughness"], .08)
    if emit: setin(p, ["Emission Color", "Emission"], (*srgb(col), 1)); setin(p, ["Emission Strength"], emit)
    return m
SEED = mat("seed", "#7ef2d6", .18, emit=.35, coat=1)
ROOT = mat("root", "#5fe3c3", .35, emit=1.6, coat=.6)
FINE = mat("fine", "#3fbf9f", .5, emit=.9)
BACK = mat("back", "#070a09", .9)

# the seed
bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48, radius=.62, location=(0, 0, 1.15))
seed = bpy.context.active_object; seed.scale = (1, .82, .92); bpy.ops.object.shade_smooth(); seed.data.materials.append(SEED)
# a thin groove ring round its waist, like a seed's seam
bpy.ops.mesh.primitive_torus_add(major_radius=.6, minor_radius=.035, location=(0, 0, 1.12), rotation=(math.radians(90), 0, 0))
ring = bpy.context.active_object; ring.scale = (1, .92, 1); bpy.ops.object.shade_smooth(); ring.data.materials.append(mat("seam", "#1f6f5e", .3))

# roots: curves grown from the seed. RADIAL: outward in the ground plane (camera above); else downward (camera in front)
def grow(p, d, radius, length, depth, out):
    pts = [p.copy()]; step = .055; n = int(length / step)
    for i in range(n):
        jitter = Vector((random.gauss(0, .13), random.gauss(0, .13), random.gauss(0, .03))) if RADIAL else Vector((random.gauss(0, .12), random.gauss(0, .05), random.gauss(0, .06)))
        d = (d + jitter + (Vector((0, 0, -.004)) if RADIAL else Vector((0, 0, -.06)))).normalized()
        if RADIAL: d.z = max(-.08, min(.02, d.z)); d.normalize()
        p = p + d * step; pts.append(p.copy())
        if depth < 4 and i > 3 and random.random() < .06 + depth * .015:
            perp = Vector((-d.y, d.x, 0)).normalized() if RADIAL else Vector((random.choice((-1, 1)), 0, 0))
            side = perp * random.choice((-1, 1)) * random.uniform(.5, 1.0)
            grow(p.copy(), (d + side).normalized(), radius * .6 * (1 - i / n * .5), length * random.uniform(.4, .65), depth + 1, out)
        if (RADIAL and p.length > 4.2) or (not RADIAL and p.z < -2.3): break
    out.append((pts, radius, depth))
roots = []
if RADIAL:
    seed.location = (0, 0, .25); ring.location = (0, 0, .22); seed.scale = (1, 1, .82); ring.rotation_euler = (0, 0, 0); ring.scale = (1.02, 1.02, 1)
    for k in range(9):
        a = k / 9 * 2 * math.pi + random.uniform(-.2, .2)
        dvec = Vector((math.cos(a), math.sin(a), -.02))
        grow(Vector((math.cos(a) * .5, math.sin(a) * .5, .05)), dvec, random.uniform(.07, .095), random.uniform(3.0, 4.0), 0, roots)
else:
    for k, a in enumerate([-1.0, -.62, -.25, .25, .62, 1.0, 0]):
        start = Vector((math.sin(a) * .32, random.uniform(-.1, .1), .72 - abs(a) * .08))
        grow(start, Vector((a * .9, random.gauss(0, .2), -1)).normalized(), .085 if abs(a) < .5 else .065, random.uniform(2.6, 3.4), 0, roots)
for pts, r, depth in roots:
    cu = bpy.data.curves.new("r", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = r; cu.bevel_resolution = 4; cu.use_fill_caps = True
    sp = cu.splines.new("NURBS"); sp.points.add(len(pts) - 1)
    for i, q in enumerate(pts):
        sp.points[i].co = (q.x, q.y, q.z, 1); sp.points[i].radius = max(.08, 1 - i / len(pts)) ** 1.2
    sp.use_endpoint_u = True; sp.order_u = 3
    ob = bpy.data.objects.new("root", cu); sc.collection.objects.link(ob); ob.data.materials.append(ROOT if depth < 2 else FINE)

# backdrop + light
if RADIAL: bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -.12))
else: bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 3, 0), rotation=(math.radians(90), 0, 0))
bpy.context.active_object.data.materials.append(BACK)
world = bpy.data.worlds.new("w"); sc.world = world; world.use_nodes = True
next(n for n in world.node_tree.nodes if n.type == "BACKGROUND").inputs["Color"].default_value = (*srgb("#0a1210"), 1)
def area(loc, size, power, col):
    bpy.ops.object.light_add(type="AREA", location=loc); l = bpy.context.active_object; l.data.size = size; l.data.energy = power; l.data.color = srgb(col)
    d = Vector((0, 0, 1.0)) - l.location; l.rotation_euler = d.to_track_quat("-Z", "Y").to_euler(); return l
if RADIAL: area((-2.5, -2.5, 6), 3.5, 900, "#ffffff"); area((3, 2, 4), 2.5, 380, "#b6fff0")
else: area((-2.6, -4.2, 3.4), 3.0, 700, "#ffffff"); area((3.2, -2.5, 2.2), 2.0, 320, "#b6fff0"); area((0, 2, 4), 3, 260, "#7ef2d6")
if RADIAL: bpy.ops.object.camera_add(location=(0, -1.6, 10.5)); cam = bpy.context.active_object; cam.rotation_euler = (math.radians(8.5), 0, 0); cam.data.lens = 50
else: bpy.ops.object.camera_add(location=(0, -9.5, -.15)); cam = bpy.context.active_object; cam.rotation_euler = (math.radians(90), 0, 0); cam.data.lens = 62
sc.camera = cam

sc.render.engine = "CYCLES"; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
try: sc.cycles.device = "GPU"
except Exception: pass
sc.render.resolution_x = sc.render.resolution_y = RES
sc.view_settings.view_transform = "Standard"; sc.view_settings.exposure = -.2
try:                                                                     # bloom (compositor API differs across versions)
    sc.use_nodes = True; nt = sc.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    rl = nt.nodes.new("CompositorNodeRLayers"); gl = nt.nodes.new("CompositorNodeGlare"); co = nt.nodes.new("CompositorNodeComposite")
    gl.glare_type = "FOG_GLOW"; gl.threshold = .6; gl.size = 8; gl.mix = -.35
    nt.links.new(rl.outputs["Image"], gl.inputs["Image"]); nt.links.new(gl.outputs["Image"], co.inputs["Image"])
except Exception as e: print("no compositor bloom:", e)
sc.render.filepath = OUT; sc.render.image_settings.file_format = "PNG"
bpy.ops.render.render(write_still=True); print("wrote", OUT)
