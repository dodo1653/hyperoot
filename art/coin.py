# HyperRoot's coin image ($ROOT): an obsidian coin with a raised glowing root network and a domed seed;: a thick glossy coin in Hyperliquid mint with the HypeEdge mark (a ring and a solid disc
# cut by one diagonal slice, the pair tilted up 14 degrees; the same mark as art/icon.py) raised on its face in deep green enamel, a raised rim and a reeded edge. Rendered on a transparent film;
# art/compose.py puts it on the background.
# blender -b --factory-startup --python art/coin.py -- <out.png> [samples] [res] [yaw_deg] [pitch_deg]
import bpy, bmesh, math, sys, os

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0]) if argv else os.path.abspath("coin_raw.png")
SAMPLES = int(argv[1]) if len(argv) > 1 else 256
RES = int(argv[2]) if len(argv) > 2 else 1400
YAW = math.radians(float(argv[3])) if len(argv) > 3 else math.radians(-24)
PITCH = math.radians(float(argv[4])) if len(argv) > 4 else math.radians(10)
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
sc = bpy.context.scene

def srgb(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)
def P(m): return next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
def setin(p, names, v):
    for n in names:
        if n in p.inputs: p.inputs[n].default_value = v; return
def mat(name, hexcol, rough, coat=0.0, metal=0.0, spec=0.5):
    m = bpy.data.materials.new(name); m.use_nodes = True; p = P(m)
    p.inputs["Base Color"].default_value = (*srgb(hexcol), 1); p.inputs["Roughness"].default_value = rough; p.inputs["Metallic"].default_value = metal
    setin(p, ["Coat Weight", "Clearcoat"], coat); setin(p, ["Coat Roughness", "Clearcoat Roughness"], 0.06); setin(p, ["Specular IOR Level", "Specular"], spec)
    return m

# ---- materials
FACE = mat("face", "#0d1513", 0.22, coat=1.0)
# a faint guilloché: concentric rings in the face's bump, so the flat mint reads as struck metal under the coat
nt = FACE.node_tree; tc = nt.nodes.new("ShaderNodeTexCoord"); wv = nt.nodes.new("ShaderNodeTexWave")
wv.wave_type = "RINGS"; wv.inputs["Scale"].default_value = 9; wv.inputs["Distortion"].default_value = 0.6; wv.inputs["Detail"].default_value = 2
bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.05; bump.inputs["Distance"].default_value = 0.002
nt.links.new(tc.outputs["Object"], wv.inputs["Vector"]); nt.links.new(wv.outputs["Fac"], bump.inputs["Height"]); nt.links.new(bump.outputs["Normal"], P(FACE).inputs["Normal"])
EDGE = mat("edge", "#1d6b5b", 0.24, coat=0.8)
# the reeding: fine grooves around the edge (bump from the angle around the coin's axis)
nt = EDGE.node_tree; tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ")
at = nt.nodes.new("ShaderNodeMath"); at.operation = "ARCTAN2"; mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.inputs[1].default_value = 110
sn = nt.nodes.new("ShaderNodeMath"); sn.operation = "SINE"; bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.55; bump.inputs["Distance"].default_value = 0.01
nt.links.new(tc.outputs["Object"], sep.inputs["Vector"]); nt.links.new(sep.outputs["Y"], at.inputs[0]); nt.links.new(sep.outputs["X"], at.inputs[1])
nt.links.new(at.outputs["Value"], mul.inputs[0]); nt.links.new(mul.outputs["Value"], sn.inputs[0]); nt.links.new(sn.outputs["Value"], bump.inputs["Height"]); nt.links.new(bump.outputs["Normal"], P(EDGE).inputs["Normal"])
RIM = mat("rim", "#9ff7e2", 0.14, coat=1.0, metal=0.35)
INK = mat("ink", "#7ef2d6", 0.2, coat=1.0, spec=0.6)
setin(P(INK), ["Emission Color", "Emission"], (*srgb("#5fe8c6"), 1)); setin(P(INK), ["Emission Strength"], 0.55)
SEEDM = mat("seedm", "#a6fbe6", 0.12, coat=1.0)
setin(P(SEEDM), ["Emission Color", "Emission"], (*srgb("#7ef2d6"), 1)); setin(P(SEEDM), ["Emission Strength"], 0.35)

# ---- the coin: a bevelled disc, faces and edge on separate materials
TH = 0.24
bpy.ops.mesh.primitive_cylinder_add(vertices=256, radius=1.0, depth=TH)
coin = bpy.context.active_object; coin.data.materials.append(FACE); coin.data.materials.append(EDGE)
for poly in coin.data.polygons: poly.material_index = 0 if abs(poly.normal.z) > 0.5 else 1
bv = coin.modifiers.new("bevel", "BEVEL"); bv.width = 0.035; bv.segments = 6; bv.limit_method = "ANGLE"; bv.harden_normals = False
bpy.ops.object.shade_smooth()
# a raised rim on both faces
for s in (1, -1):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.875, minor_radius=0.04, major_segments=256, minor_segments=24, location=(0, 0, s * TH / 2))
    r = bpy.context.active_object; r.scale.z = 0.7; r.data.materials.append(RIM); bpy.ops.object.shade_smooth(); r.parent = coin

# ---- the mark: a domed mint seed at the centre and a root network radiating from it, raised on the face (both faces
# for the film), clipped inside the rim
import random
from mathutils import Vector
FZ = TH / 2
def roots_on(side):
    random.seed(7); segs = []
    def grow(p, d, rad, length, depth):
        pts = [p.copy()]; n = int(length / 0.022)
        for i in range(n):
            d = (d + Vector((random.gauss(0, .085), random.gauss(0, .085), 0)) + Vector((p.x, p.y, 0)).normalized() * .05).normalized()   # wander, but keep heading outward
            q = p + d * 0.022
            if q.length > 0.80: break
            p = q; pts.append(p.copy())
            if depth < 3 and i > 4 and random.random() < .12 + depth * .03:
                perp = Vector((-d.y, d.x, 0)) * random.choice((-1, 1))
                grow(p.copy(), (d + perp * random.uniform(.45, .8)).normalized(), rad * .66, length * random.uniform(.4, .6), depth + 1)
        if len(pts) > 2: segs.append((pts, rad))
    for k in range(10):
        a = k / 10 * 2 * math.pi + random.uniform(-.1, .1)
        grow(Vector((math.cos(a) * .15, math.sin(a) * .15, 0)), Vector((math.cos(a), math.sin(a), 0)), random.uniform(.026, .034), random.uniform(.66, .78), 0)
    for pts, rad in segs:
        cu = bpy.data.curves.new("root", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = rad; cu.bevel_resolution = 3; cu.use_fill_caps = True
        sp = cu.splines.new("NURBS"); sp.points.add(len(pts) - 1)
        for i, q in enumerate(pts):
            sp.points[i].co = (q.x * side, q.y, side * (FZ + rad * 0.35), 1); sp.points[i].radius = max(.15, 1 - i / len(pts)) ** 1.1
        sp.use_endpoint_u = True; sp.order_u = 3
        ob = bpy.data.objects.new("root", cu); sc.collection.objects.link(ob); ob.data.materials.append(INK); ob.parent = coin
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48, radius=0.17, location=(0, 0, side * FZ))
    sd = bpy.context.active_object; sd.scale = (1, 1, 0.55); bpy.ops.object.shade_smooth(); sd.data.materials.append(SEEDM); sd.parent = coin
for side in ((1, -1) if OUT.endswith(".glb") else (1,)):
    roots_on(side)

if OUT.endswith(".glb"):                                # the same coin for the film (three.js): face along +Z here, +Y in glTF
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, use_selection=True)
    print("wrote", OUT); sys.exit(0)
# face the camera (camera looks down -Y), then turn it a little so the edge shows
coin.rotation_euler = (math.radians(90) + PITCH, 0, YAW)

# ---- light: big soft key, a cool rim from behind, a low fill; a dim studio world for the reflections
world = bpy.data.worlds.new("w"); sc.world = world; world.use_nodes = True
bgn = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND"); bgn.inputs["Color"].default_value = (*srgb("#0d2a24"), 1); bgn.inputs["Strength"].default_value = 0.6
def area(loc, rot, size, power, col):
    bpy.ops.object.light_add(type="AREA", location=loc, rotation=rot); l = bpy.context.active_object
    l.data.size = size; l.data.energy = power; l.data.color = srgb(col)
    return l
def look(o, target=(0, 0, 0)):
    import mathutils
    d = mathutils.Vector(target) - o.location; o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
k = area((-3.2, -4.0, 3.0), (0, 0, 0), 4.0, 900, "#ffffff"); look(k)
r = area((3.5, 2.5, 2.2), (0, 0, 0), 2.5, 700, "#a8fff0"); look(r)
f = area((2.5, -4.5, -2.0), (0, 0, 0), 3.0, 220, "#d9fff7"); look(f)
t = area((0, -1.0, 4.5), (0, 0, 0), 2.0, 260, "#ffffff"); look(t)

bpy.ops.object.camera_add(location=(0, -7.2, 0)); cam = bpy.context.active_object; cam.rotation_euler = (math.radians(90), 0, 0)
cam.data.lens = 96; sc.camera = cam

sc.render.engine = "CYCLES"; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
try: sc.cycles.device = "GPU"
except Exception: pass
sc.render.resolution_x = sc.render.resolution_y = RES; sc.render.film_transparent = True
sc.view_settings.view_transform = "Standard"; sc.view_settings.exposure = -0.35
sc.view_settings.look = "None"
sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"; sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("wrote", OUT)
