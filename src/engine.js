/* DSH Inside: dependency-free WebGL / Canvas software 3D scene. Spatial grouping is explanatory,
   never a runtime call graph. Written for this visualizer; no upstream code. */
(() => {
    'use strict';
    const TAU = Math.PI * 2;
    const vsub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0), cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = a => { const d = Math.hypot(...a) || 1; return a.map(v => v / d); }, lerp = (a, b, t) => a + (b - a) * t;
    function mul(a, b) { const o = new Float32Array(16); for (let c = 0; c < 4; c++)
        for (let r = 0; r < 4; r++)
            for (let k = 0; k < 4; k++)
                o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; }
    function perspective(fov, aspect, n, f) { let t = 1 / Math.tan(fov / 2); return new Float32Array([t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]); }
    function lookAt(eye, at) { const z = norm(vsub(eye, at)), x = norm(cross([0, 1, 0], z)), y = cross(z, x); return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]); }
    function transform(p, s = [1, 1, 1]) { return new Float32Array([s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, p[0], p[1], p[2], 1]); }
    function color(hex, a = 1) { if(document.documentElement.dataset.theme==='light'){const map={'#16283e':'#c6d4e1','#285176':'#8199b2','#538fb4':'#5d8098','#7297c9':'#7d9abb','#5a8db6':'#708aa4'};hex=map[hex]||hex;} const x = parseInt(hex.replace('#', ''), 16); return [(x >> 16 & 255) / 255, (x >> 8 & 255) / 255, (x & 255) / 255, a]; }
    function cube() { let p = [], n = []; const faces = [[[1, 0, 0], [.5, -.5, -.5], [.5, .5, -.5], [.5, .5, .5], [.5, -.5, .5]], [[-1, 0, 0], [-.5, -.5, .5], [-.5, .5, .5], [-.5, .5, -.5], [-.5, -.5, -.5]], [[0, 1, 0], [-.5, .5, -.5], [-.5, .5, .5], [.5, .5, .5], [.5, .5, -.5]], [[0, -1, 0], [-.5, -.5, .5], [-.5, -.5, -.5], [.5, -.5, -.5], [.5, -.5, .5]], [[0, 0, 1], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5], [-.5, -.5, .5]], [[0, 0, -1], [-.5, -.5, -.5], [-.5, .5, -.5], [.5, .5, -.5], [.5, -.5, -.5]]]; for (const [no, ...vs] of faces)
        for (const i of [0, 1, 2, 0, 2, 3]) {
            p.push(...vs[i]);
            n.push(...no);
        } return { p, n }; }
    function sphere(rows = 10, cols = 16) { let p = [], n = []; const pt = (a, b) => [Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b)]; for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++) {
            let vs = [pt(i / rows * Math.PI, j / cols * TAU), pt((i + 1) / rows * Math.PI, j / cols * TAU), pt((i + 1) / rows * Math.PI, (j + 1) / cols * TAU), pt(i / rows * Math.PI, (j + 1) / cols * TAU)];
            for (let k of [0, 1, 2, 0, 2, 3]) {
                p.push(...vs[k]);
                n.push(...vs[k]);
            }
        } return { p, n }; }
    function ring(segments = 64, inner = .91) { let p = [], n = []; for (let i = 0; i < segments; i++) {
        let a = i / segments * TAU, b = (i + 1) / segments * TAU, vs = [[Math.cos(a), 0, Math.sin(a)], [Math.cos(b), 0, Math.sin(b)], [Math.cos(b) * inner, 0, Math.sin(b) * inner], [Math.cos(a) * inner, 0, Math.sin(a) * inner]];
        for (let k of [0, 1, 2, 0, 2, 3]) {
            p.push(...vs[k]);
            n.push(0, 1, 0);
        }
    } return { p, n }; }
    function slab() { const vs = [[-5.35, -2.7], [-4.95, -3.1], [4.95, -3.1], [5.35, -2.7], [5.35, 2.7], [4.95, 3.1], [-4.95, 3.1], [-5.35, 2.7]]; let p = [], n = []; for (let side of [-1, 1])
        for (let i = 0; i < 8; i++) {
            const a = vs[i], b = vs[(i + 1) % 8];
            for (let v of [[0, side * .05, 0], [a[0], side * .05, a[1]], [b[0], side * .05, b[1]]]) {
                p.push(...v);
                n.push(0, side, 0);
            }
        } for (let i = 0; i < 8; i++) {
        let a = vs[i], b = vs[(i + 1) % 8], no = norm([b[1] - a[1], 0, a[0] - b[0]]);
        let pts = [[a[0], -.05, a[1]], [b[0], -.05, b[1]], [b[0], .05, b[1]], [a[0], .05, a[1]]];
        for (let k of [0, 1, 2, 0, 2, 3]) {
            p.push(...pts[k]);
            n.push(...no);
        }
    } return { p, n, outline: vs }; }
    function prism(kind) {
        let shape;
        if (kind === 'cylinder') shape = Array.from({length:20}, (_,i)=>[Math.cos(i/20*TAU)*.5,Math.sin(i/20*TAU)*.5]);
        else if (kind === 'hex') shape = Array.from({length:6},(_,i)=>[Math.cos(i/6*TAU)*.55,Math.sin(i/6*TAU)*.55]);
        else if (kind === 'shield') shape=[[-.48,-.5],[.48,-.5],[.5,.12],[0,.58],[-.5,.12]];
        else if (kind === 'folder') shape=[[-.53,-.52],[-.10,-.52],[.04,-.28],[.55,-.28],[.55,.48],[-.53,.48]];
        else if (kind === 'terminal') shape=[[-.52,-.42],[.52,-.42],[.62,.48],[-.62,.48]];
        else if (kind === 'gate') shape=[[-.56,-.50],[.56,-.50],[.56,.50],[.2,.50],[.2,.25],[-.2,.25],[-.2,.50],[-.56,.50]];
        else shape=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];
        const p=[],n=[];
        for(let i=0;i<shape.length;i++){
            const a=shape[i],b=shape[(i+1)%shape.length];
            for(const y of [-.5,.5]) for(const v of [[0,y,0],[a[0],y,a[1]],[b[0],y,b[1]]]){p.push(...v);n.push(0,Math.sign(y),0);}
            const normal=norm([b[1]-a[1],0,a[0]-b[0]]);
            const verts=[[a[0],-.5,a[1]],[b[0],-.5,b[1]],[b[0],.5,b[1]],[a[0],.5,a[1]]];
            for(const j of [0,1,2,0,2,3]){p.push(...verts[j]);n.push(...normal);}
        }
        return {p,n};
    }
    const families=['hex','cylinder','shield','folder','terminal','gate','document','panel','chip'];
    const VS = `attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uViewProj;uniform mat4 uModel;varying vec3 vNormal;varying vec3 vWorld;void main(){vec4 w=uModel*vec4(aPosition,1.);vWorld=w.xyz;vNormal=mat3(uModel)*aNormal;gl_Position=uViewProj*w;}`;
    const FS = `precision mediump float;uniform vec4 uColor;uniform vec3 uEye;uniform float uEmission;varying vec3 vNormal;varying vec3 vWorld;void main(){vec3 n=normalize(vNormal);float light=.26+.54*max(dot(n,normalize(vec3(-.5,1.,.8))),0.)+.14*max(dot(n,normalize(vec3(.9,.3,-.6))),0.);float rim=pow(1.-abs(dot(n,normalize(uEye-vWorld))),2.6)*.22;vec3 c=uColor.rgb*(light+rim+uEmission);gl_FragColor=vec4(c,uColor.a);}`;
    class Renderer {
        constructor(canvas, data, onSelect, onFailure) { this.canvas = canvas; this.data = data; this.onSelect = onSelect; this.onFailure = onFailure; this.labelsRoot = document.getElementById('projected-labels'); this.labels = new Map(); this.annotationCanvas = document.getElementById('scene-annotations'); this.ink = this.annotationCanvas.getContext('2d'); this.frameArrows=[]; this.packets=[]; this.hovered=null; this.packetClock=0; this.packetKey=''; this.transition={fromActive:[],fromFlow:null,fromSelected:null,start:0,duration:900}; this.transitionT=1; this.lastTransitionFrame=1; this.state = { selected: 'llm', active: [], focus: false, flat:false, explosion: .8, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, playing: false, providers: {}, trace: false, theme:'dark', language:'zh', flow:null, stepKey:'', speed:1 }; this.view = { yaw: .58, elev: .39, dist: 24 }; this.target = { ...this.view }; this.points = []; this.byid = Object.fromEntries(data.services.map(s => [s.id, s])); this.grouped = data.groups.map(g => data.services.filter(s => s.group === g.id)); this.idleFrame = 0; this.failed = false; try {
            this.initGL();
        }
        catch (e) {
            try {
                this.initSoftware();
            }
            catch (f) {
                this.failed = true;
                onFailure(f);
                return;
            }
        } this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(canvas.parentElement); this.resize(); this.bindControls(); this.lastTime = 0; this.animate = this.animate.bind(this); requestAnimationFrame(this.animate); canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.failed = true; onFailure(new Error('WebGL context lost')); }); canvas.addEventListener('webglcontextrestored', () => { try {
            this.initGL();
            this.failed = false;
            onFailure(null);
            requestAnimationFrame(this.animate);
        }
        catch (e) {
            onFailure(e);
        } }); }
        initSoftware() { this.software = true; this.ctx2d = this.canvas.getContext('2d', { alpha: true }); if (!this.ctx2d)
            throw new Error('Canvas unavailable'); this.gl = { depthMask: () => { } }; this.slabShape = slab(); this.meshes = { cube: cube(), sphere: sphere(6, 10), ring: ring(40), slab: this.slabShape }; families.forEach(k=>this.meshes[k]=prism(k)); this.queue = []; this.canvas.dataset.backend = 'canvas-3d'; }
        softMesh(name, pos, scale, rgba, emission) { const m = this.meshes[name]; const lightDir = norm([-.5, 1, .8]), fillDir = norm([.9, .3, -.6]); if (name === 'sphere') {
            const q = this.project(pos);
            if (!q)
                return;
            const edge = this.project([pos[0] + scale[0], pos[1], pos[2]]);
            let radius = Math.max(1, Math.hypot(edge.x - q.x, edge.y - q.y));
            this.queue.push({ z: q.z, kind: 'orb', x: q.x, y: q.y, r: radius, color: rgba });
            return;
        } for (let i = 0; i < m.p.length; i += (name === 'cube' ? 18 : 9)) {
            const vertices = [];
            for (let j of (name === 'cube' ? [0, 3, 6, 15] : [0, 3, 6]))
                vertices.push([m.p[i + j] * scale[0] + pos[0], m.p[i + j + 1] * scale[1] + pos[1], m.p[i + j + 2] * scale[2] + pos[2]]);
            const normal = norm([m.n[i] * scale[0], m.n[i + 1] * scale[1], m.n[i + 2] * scale[2]]);
            const center = vertices[0].map((_, j) => (vertices[0][j] + vertices[1][j] + vertices[2][j]) / 3);
            const view = norm(vsub(this.eye, center));
            if (rgba[3] > .65 && dot(normal, view) < -.01)
                continue;
            const q = vertices.map(v => this.project(v));
            if (q.some(v => !v))
                continue;
            const brightness = .26 + .54 * Math.max(0, dot(normal, lightDir)) + .14 * Math.max(0, dot(normal, fillDir)) + Math.pow(1 - Math.abs(dot(normal, view)), 2.6) * .22 + emission;
            this.queue.push({ z: q.reduce((a, v) => a + v.z, 0) / q.length, kind: 'poly', p: q, color: [Math.min(1, rgba[0] * brightness), Math.min(1, rgba[1] * brightness), Math.min(1, rgba[2] * brightness), rgba[3]] });
        } }
        paintSoftware() { const ctx = this.ctx2d; ctx.clearRect(0, 0, this.w, this.h); this.queue.sort((a, b) => b.z - a.z); const css = c => `rgba(${Math.round(Math.min(1, c[0]) * 255)},${Math.round(Math.min(1, c[1]) * 255)},${Math.round(Math.min(1, c[2]) * 255)},${c[3]})`; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; for (const q of this.queue) {
            if (q.kind === 'orb') {
                const c = q.color;
                const glow = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 3);
                glow.addColorStop(0, css(c));
                glow.addColorStop(.2, css([c[0], c[1], c[2], c[3] * .8]));
                glow.addColorStop(1, css([c[0], c[1], c[2], 0]));
                ctx.fillStyle = glow;
                ctx.fillRect(q.x - q.r * 3, q.y - q.r * 3, q.r * 6, q.r * 6);
                ctx.beginPath();
                ctx.arc(q.x, q.y, q.r * .7, 0, TAU);
                ctx.fillStyle = css(c);
                ctx.fill();
                continue;
            }
            ctx.beginPath();
            ctx.moveTo(q.p[0].x, q.p[0].y);
            for (let i = 1; i < q.p.length; i++)
                ctx.lineTo(q.p[i].x, q.p[i].y);
            if (q.kind === 'line') {
                ctx.strokeStyle = css(q.color);
                ctx.lineWidth = .8;
                ctx.stroke();
            }
            else {
                ctx.closePath();
                ctx.fillStyle = css(q.color);
                ctx.fill();
            }
        } }
        initGL() { const gl = this.canvas.getContext('webgl', { alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' }); if (!gl)
            throw new Error('WebGL unavailable'); this.gl = gl; const shader = (type, src) => { let s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
            throw new Error(gl.getShaderInfoLog(s)); return s; }; let prog = gl.createProgram(); gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
            throw new Error(gl.getProgramInfoLog(prog)); gl.useProgram(prog); this.program = prog; this.loc = {}; for (let x of ['uViewProj', 'uModel', 'uColor', 'uEye', 'uEmission'])
            this.loc[x] = gl.getUniformLocation(prog, x); for (let x of ['aPosition', 'aNormal'])
            this.loc[x] = gl.getAttribLocation(prog, x); this.meshes = { cube: this.mesh(cube()), sphere: this.mesh(sphere()), ring: this.mesh(ring()) }; this.slabShape = slab(); this.meshes.slab = this.mesh(this.slabShape); families.forEach(k=>this.meshes[k]=this.mesh(prism(k))); this.lineBuffer = gl.createBuffer(); gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0); }
        mesh({ p, n }) { const gl = this.gl; const buffer = a => { let b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a), gl.STATIC_DRAW); return b; }; return { p: buffer(p), n: buffer(n), count: p.length / 3 }; }
        resize() { const r = this.canvas.parentElement.getBoundingClientRect(); this.w = r.width; this.h = r.height; const d = Math.min(devicePixelRatio || 1, 1.75); this.canvas.width = Math.max(1, Math.floor(r.width * d)); this.canvas.height = Math.max(1, Math.floor(r.height * d)); this.idleFrame = 0; this.annotationCanvas.width=this.canvas.width; this.annotationCanvas.height=this.canvas.height; this.ink.setTransform(d,0,0,d,0,0); if (this.software)
            this.ctx2d.setTransform(d, 0, 0, d, 0, 0);
        else if (this.gl)
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height); }
        setState(next) { const oldFocus=this.state.focus,oldFlat=this.state.flat; const stepChanged=next.stepKey && next.stepKey!==this.state.stepKey; if(stepChanged&&this.state.stepKey){this.transition={fromActive:[...this.state.active],fromFlow:this.state.flow?{...this.state.flow}:null,fromSelected:this.state.selected,start:performance.now(),duration:this.state.reduced?0:900};this.transitionT=this.state.reduced?1:0;} if(next.stepKey && next.stepKey!==this.packetKey){this.packetKey=next.stepKey;this.packetClock=0;} Object.assign(this.state, next); if (oldFocus !== this.state.focus || oldFlat!==this.state.flat)
            this.reset(); if (this.state.reduced)
            this.view = { ...this.target }; this.idleFrame = 0; }
        reset() { this.target = this.state.focus ? { yaw: .10, elev: .34, dist: 17.8 } : this.state.flat ? { yaw:.04,elev:1.40,dist:22.8 } : { yaw: .58, elev: .39, dist: 24 }; if (this.state.reduced)
            this.view = { ...this.target }; }
        top() { if(this.state.flat){this.reset();return;} this.target.elev = this.target.elev > 1 ? .39 : 1.22; this.target.yaw = .13; }
        bindControls() { const c = this.canvas; let pointers = new Map(), start = null, pinch = 0; const dist = () => { let a = [...pointers.values()]; return a.length === 2 ? Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) : 0; }; c.addEventListener('pointerdown', e => { pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); c.setPointerCapture(e.pointerId); start = { x: e.clientX, y: e.clientY, moved: 0 }; if (pointers.size === 2)
            pinch = dist(); }); c.addEventListener('pointermove', e => { const p = pointers.get(e.pointerId); if (p) {
            let dx = e.clientX - p.x, dy = e.clientY - p.y;
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (start)
                start.moved += Math.hypot(dx, dy);
            if (pointers.size === 2) {
                const d = dist();
                if (pinch)
                    this.target.dist = Math.max(11, Math.min(43, this.target.dist * pinch / d));
                pinch = d;
            }
            else if(!this.state.flat) {
                this.target.yaw -= dx * .007;
                this.target.elev = Math.max(.08, Math.min(1.45, this.target.elev + dy * .005));
            }
            this.idleFrame = 0;
        }
        else {
            const hover=this.pick(e.clientX,e.clientY);c.style.cursor=hover?'pointer':'grab'; if(this.hovered!==hover?.id){this.hovered=hover?.id||null;this.idleFrame=0;}
        } }); const up = e => { if (start && start.moved < 6 && pointers.size === 1) {
            const p = this.pick(e.clientX, e.clientY);
            if (p)
                this.onSelect(p.id, p);
        } pointers.delete(e.pointerId); if (!pointers.size) {
            start = null;
            pinch = 0;
        } }; c.addEventListener('pointerleave',()=>{this.hovered=null;this.idleFrame=0;}); c.addEventListener('pointerup', up); c.addEventListener('pointercancel', () => { pointers.clear(); start = null; }); c.addEventListener('wheel', e => { e.preventDefault(); this.target.dist = Math.max(11, Math.min(43, this.target.dist * Math.exp(e.deltaY * .0008))); this.idleFrame = 0; }, { passive: false }); }
        pick(x, y) { const r = this.canvas.getBoundingClientRect(); x -= r.left; y -= r.top; let found = null, best = 1000; for (const p of this.points) {
            if (!p.selectable)
                continue;
            const q = this.project(p.pos);
            if (!q || q.z > 1)
                continue;
            const d = Math.hypot(x - q.x, y - q.y);
            const radius = this.state.focus ? 25 : 18;
            if (d < radius && d < best) {
                found = p;
                best = d;
            }
        } return found; }
        project(p) { const m = this.vp; if (!m)
            return null; const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14], w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15]; if (w <= 0)
            return null; return { x: (x / w * .5 + .5) * this.w, y: (-.5 * y / w + .5) * this.h, z: z / w }; }
        drawMesh(name, pos, scale, rgba, emission = 0) { if (this.software) {
            this.softMesh(name, pos, scale, rgba, emission);
            return;
        } const gl = this.gl, m = this.meshes[name]; gl.bindBuffer(gl.ARRAY_BUFFER, m.p); gl.enableVertexAttribArray(this.loc.aPosition); gl.vertexAttribPointer(this.loc.aPosition, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, m.n); gl.enableVertexAttribArray(this.loc.aNormal); gl.vertexAttribPointer(this.loc.aNormal, 3, gl.FLOAT, false, 0, 0); gl.uniformMatrix4fv(this.loc.uModel, false, transform(pos, scale)); gl.uniform4fv(this.loc.uColor, rgba); gl.uniform1f(this.loc.uEmission, emission); gl.drawArrays(gl.TRIANGLES, 0, m.count); }
        lines(points, rgba) { if (!points.length)
            return; if (this.software) {
            for (let i = 0; i < points.length; i += 2) {
                const p = [this.project(points[i]), this.project(points[i + 1])];
                if (p.every(Boolean))
                    this.queue.push({ z: (p[0].z + p[1].z) / 2, kind: 'line', p, color: rgba });
            }
            return;
        } const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points.flat()), gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(this.loc.aPosition); gl.vertexAttribPointer(this.loc.aPosition, 3, gl.FLOAT, false, 0, 0); gl.disableVertexAttribArray(this.loc.aNormal); gl.vertexAttrib3f(this.loc.aNormal, 0, 1, 0); gl.uniformMatrix4fv(this.loc.uModel, false, transform([0, 0, 0])); gl.uniform4fv(this.loc.uColor, rgba); gl.uniform1f(this.loc.uEmission, .7); gl.drawArrays(gl.LINES, 0, points.length); }
        boxOutline(p, s, rgba) { const [x, y, z] = p, [a, b, c] = s.map(v => v / 2), v = [[-a, -b, -c], [a, -b, -c], [a, -b, c], [-a, -b, c], [-a, b, -c], [a, b, -c], [a, b, c], [-a, b, c]].map(q => [q[0] + x, q[1] + y, q[2] + z]); const es = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]; this.lines(es.flatMap(e => e.map(i => v[i])), rgba); }
        node(p,t) {
            const {pos,id,group=2,size=.69,selected}=p;
            const strength=Math.max(0,Math.min(1,p.strength ?? (p.active?1:0)));
            const info=window.DSHIdentity.resolve(id),light=this.state.theme==='light';
            const palette=light?['#487bd2','#8660cf','#158e99','#c89030','#2e9767','#607aab']:this.data.groups.map(g=>g.color);
            const hex=palette[group]||palette[2];
            let h=({cylinder:.46,hex:.38,shield:.37,folder:.30,terminal:.30,gate:.35,document:.18,panel:.24,chip:.29}[info.family]||.28);
            h*=1+(selected?.38:.15)*strength;
            const hover=id===this.hovered,bright=(selected&&strength>.20)||strength>.58||hover;
            const idleAlpha=light?.075:.045, bodyAlpha=bright?.96:idleAlpha+strength*.58;
            const baseAlpha=selected?idleAlpha+strength*.72:idleAlpha+strength*.22;
            this.drawMesh('cube',[pos[0],pos[1]-.075,pos[2]],[size+.16,.10,size+.16],color(light?'#c8d5e3':'#162438',baseAlpha),light&&bright?.12:0);
            if(info.family==='document') this.drawMesh('document',[pos[0]+size*.07,pos[1]+.055,pos[2]+size*.07],[size,.10,size],color(hex,Math.max(.08,strength*.38)),.08*strength);
            this.drawMesh(info.family,[pos[0],pos[1]+h/2,pos[2]],[size,h,size],color(hex,bodyAlpha),bright?.17*strength:0);
            if(info.family==='chip' && strength>.12) {
                for(let i=-1;i<=1;i++) for(let sign of [-1,1]) this.drawMesh('cube',[pos[0]+sign*size*.59,pos[1]+.055,pos[2]+i*size*.27],[size*.18,.07,size*.09],color(hex,.18+strength*.40),.08*strength);
            }
            if(info.family==='cylinder' && strength>.12) for(let dy of [.10,.26]) this.drawMesh('ring',[pos[0],pos[1]+dy,pos[2]],[size*.505,1,size*.505],color(hex,.15+strength*.60),.20*strength);
            if(bright&&strength>.06) this.drawMesh('ring',[pos[0],pos[1]+.008,pos[2]],[size*.85,1,size*.85],color(hex,selected?.82:.18+strength*.34),.35*strength);
            p.topY=pos[1]+h+.007; p.h=h;p.hex=hex;p.identity=info;p.active=strength>.12;
            p.labelPos=[pos[0],pos[1]+h+.26,pos[2]];
        }
        drawAnnotations() {
            const ctx=this.ink,light=this.state.theme==='light';
            ctx.clearRect(0,0,this.w,this.h);
            const ordered=this.points.filter(p=>!p.layer).map(p=>({p,q:this.project(p.pos)})).filter(x=>x.q).sort((a,b)=>b.q.z-a.q.z);
            let icons=0;
            for(const {p} of ordered){
                const r=p.size*.36,y=p.topY;
                const a=this.project([p.pos[0]-r,y,p.pos[2]-r]),b=this.project([p.pos[0]+r,y,p.pos[2]-r]),c=this.project([p.pos[0]-r,y,p.pos[2]+r]);
                if(!a||!b||!c) continue;
                const u=[(b.x-a.x)/24,(b.y-a.y)/24],v=[(c.x-a.x)/24,(c.y-a.y)/24];
                ctx.save();ctx.transform(u[0],u[1],v[0],v[1],a.x,a.y);
                ctx.globalAlpha=p.selected?1:Math.max(.045,.055+(p.strength||0)*.945);
                window.DSHIdentity.draw(ctx,p.id,12,10,18,light?'#ffffff':'#edfcff');
                ctx.fillStyle=light?'#ffffff':'#ecf7ff';ctx.font='bold 4.8px ui-monospace, monospace';ctx.textAlign='center';ctx.fillText(p.identity.mark,12,24);
                ctx.restore(); icons++;
            }
            // Screen-space filled heads use the projected 3D curve tangent, remaining legible from every angle.
            for(const a of this.frameArrows){
                const tip=this.project(a.tip),back=this.project(a.back);if(!tip||!back)continue;
                const dx=tip.x-back.x,dy=tip.y-back.y,l=Math.hypot(dx,dy)||1,nx=dx/l,ny=dy/l;
                const size=this.state.focus?8:9;
                ctx.save();ctx.globalAlpha=Math.max(.58,a.opacity);ctx.fillStyle=light?'#168a83':'#b4ffdf';ctx.strokeStyle=light?'#eef5f6':'#0a151c';ctx.lineWidth=1;
                ctx.beginPath();ctx.moveTo(tip.x,tip.y);ctx.lineTo(tip.x-nx*size-ny*size*.46,tip.y-ny*size+nx*size*.46);ctx.lineTo(tip.x-nx*size+ny*size*.46,tip.y-ny*size-nx*size*.46);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
            }
            this.drawPacket();
            this.annotationCanvas.dataset.icons=String(icons);this.annotationCanvas.dataset.arrows=String(this.frameArrows.length);
        }
        drawPacket(){
            const el=document.getElementById('flow-packet');
            if(this.state.focus||!this.state.flow||this.state.trace||!this.packets.length){el.hidden=true;return;}
            const p=this.packets[0], progress=this.state.reduced?.62:Math.min(.91,.08+this.packetClock/3500*.83);
            const q=this.project(p.evalp(progress));if(!q){el.hidden=true;return;}
            el.hidden=false;const f=this.state.flow;
            el.querySelector('.packet-label').textContent=window.DSHLocale?.t(f.label)||f.label;
            el.querySelector('.packet-route').textContent=`${f.from} → ${f.to}`;
            let x=Math.max(85,Math.min(this.w-95,q.x+28)),y=Math.max(162,Math.min(this.h-126,q.y-42));
            // Keep a minimum separation from the selected label.
            const selected=this.points.find(n=>n.selected),sq=selected&&this.project(selected.labelPos);
            if(sq&&Math.abs(x-sq.x)<105&&Math.abs(y-sq.y)<40)y=Math.min(this.h-122,y+74);
            el.style.left=x+'px';el.style.top=y+'px';
            el.dataset.from=f.from;el.dataset.to=f.to;el.dataset.progress=progress.toFixed(3);
            const ctx=this.ink,light=this.state.theme==='light';ctx.save();ctx.fillStyle=light?'#168a83':'#bdffe7';ctx.shadowColor=light?'transparent':'#6bffcf';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(q.x,q.y,4.3,0,TAU);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=light?'#168a8366':'#8de4cc70';ctx.lineWidth=.8;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(x,y+17);ctx.stroke();ctx.restore();
        }
        positions() {
            const points=[];
            const mix=(s)=>{const curr=(this.state.active||[]).includes(s.id)||s.id===this.state.selected;const prev=(this.transition.fromActive||[]).includes(s.id)||s.id===this.transition.fromSelected;const t=this.transitionT;return curr?(prev?1:t):(prev?1-t:0);};
            if(this.state.flat){
                for(let gi=0;gi<6;gi++){
                    const items=this.grouped[gi],cols=7,rows=Math.ceil(items.length/cols),baseZ=(gi-2.5)*2.15;
                    for(let i=0;i<items.length;i++){
                        const s=items[i],r=Math.floor(i/cols),c=i%cols,count=Math.min(cols,items.length-r*cols),x=(c-(count-1)/2)*1.42,z=baseZ+(r-(rows-1)/2)*.68;
                        points.push({id:s.id,pos:[x,.12,z],group:gi,selected:s.id===this.state.selected,active:false,strength:mix(s),selectable:true,title:'ctx.'+s.id,size:s.id==='llm'||s.id==='agentLoop'?.72:.54});
                    }
                }
                return {points,spacing:2.15};
            }
            const spacing=1.02+this.state.explosion*1.3;
            for(let gi=0;gi<6;gi++){
                const items=this.grouped[gi],cols=5,rows=Math.ceil(items.length/cols),shift=gi%2?.26:-.26,y=(2.5-gi)*spacing;
                for(let i=0;i<items.length;i++){
                    const s=items[i],r=Math.floor(i/cols),c=i%cols;
                    points.push({id:s.id,pos:[(c-2)*2+shift,y+.15,(r-(rows-1)/2)*1.5],group:gi,selected:s.id===this.state.selected,active:false,strength:mix(s),selectable:true,title:'ctx.'+s.id,size:s.id==='llm'||s.id==='agentLoop'?.83:.63});
                }
            }
            return {points,spacing};
        }
        pathBetween(a,b,t,animate=true,opacity=1,relation='call'){
            const lift=this.state.flat?0:Math.max(.45,Math.min(1.4,Math.abs(a[1]-b[1])*.13+.48));
            const evalp=x=>this.state.flat?[lerp(a[0],b[0],x),.35,lerp(a[2],b[2],x)+Math.sin(x*Math.PI)*.26]:[lerp(a[0],b[0],x),lerp(a[1],b[1],x)+Math.sin(x*Math.PI)*lift,lerp(a[2],b[2],x)+Math.sin(x*Math.PI)*.32];
            const points=[];for(let i=0;i<40;i++){if(relation==='declaration'&&i%3===2)continue;points.push(evalp(i/40),evalp((i+1)/40));}
            this.gl.depthMask(false);const hex=this.state.theme==='light'?'#14877f':this.state.trace?'#ecc184':'#85edda';this.lines(points,color(hex,opacity*.90));this.gl.depthMask(true);
            this.frameArrows.push({tip:evalp(.79),back:evalp(.75),opacity,relation});
            if(!this.state.focus&&relation==='call')this.packets.push({evalp});
        }
        drawFlat(t){
            const {points}=this.positions();this.points=points;const light=this.state.theme==='light';
            const lanes=[];
            for(let gi=0;gi<6;gi++){
                const z=(gi-2.5)*2.15,g=this.data.groups[gi],hot=points.some(p=>p.group===gi&&p.strength>.12);
                lanes.push([-5.3,.02,z-.77],[5.3,.02,z-.77],[5.3,.02,z+.77],[-5.3,.02,z+.77],[-5.3,.02,z-.77]);
                this.lines([[ -5.3,.02,z-.77],[5.3,.02,z-.77],[5.3,.02,z+.77],[-5.3,.02,z+.77]],color(g.color,hot?.28:.055));
                this.points.push({id:'layer-'+gi,pos:[-5.15,.05,z],labelPos:[-5.15,.05,z],group:gi,title:g.name,layer:true,selected:false,active:hot,selectable:false,strength:hot?1:.1});
            }
            for(const p of points)this.node(p,t);
            const lookup=Object.fromEntries(points.map(p=>[p.id,p])),flow=this.state.flow,tt=this.transitionT;
            const prev=this.transition.fromFlow;
            if(prev&&tt<1){const a=lookup[prev.from],b=lookup[prev.to];if(a&&b&&a!==b)this.pathBetween([a.pos[0],.34,a.pos[2]],[b.pos[0],.34,b.pos[2]],t*.22,false,.48*(1-tt),'previous');}
            if(prev&&flow&&tt<1&&prev.to!==flow.from){const a=lookup[prev.to],b=lookup[flow.from];if(a&&b&&a!==b)this.pathBetween([a.pos[0],.34,a.pos[2]],[b.pos[0],.34,b.pos[2]],t*.20,false,.34*(1-tt),'bridge');}
            if(flow&&!this.state.trace){const a=lookup[flow.from],b=lookup[flow.to];if(a&&b&&a!==b)this.pathBetween([a.pos[0],.34,a.pos[2]],[b.pos[0],.34,b.pos[2]],t*.32,this.state.playing,.46+.52*tt,'call');}
        }
        drawOverview(t) {
            if(this.state.flat){this.drawFlat(t);return;}
            const gl = this.gl;
            const { points, spacing } = this.positions();
            this.points = points;
            const grid = [];
            const gy = -2.5 * spacing - .55;
            for (let i = -10; i <= 10; i += 1) {
                grid.push([i, gy, -8], [i, gy, 8], [-10, gy, i], [10, gy, i]);
            }
            this.lines(grid, color('#285176', .045));
            for (const p of points)
                this.node(p, t);
            // Layer faces are intentionally translucent; no hidden dependency edges are drawn.
            gl.depthMask(false);
            for (let gi = 5; gi >= 0; gi--) {
                let y = (2.5 - gi) * spacing, shift = gi % 2 ? .26 : -.26, g = this.data.groups[gi];
                const a = points.some(p => p.group === gi && (p.active || p.selected));
                this.drawMesh('slab', [shift, y, 0], [1, 1, 1], color(g.color, a ? .075 : .012), .10);
                const ol = [];
                for (let i = 0; i < 8; i++) {
                    let va = this.slabShape.outline[i], vb = this.slabShape.outline[(i + 1) % 8];
                    ol.push([va[0] + shift, y + .06, va[1]], [vb[0] + shift, y + .06, vb[1]]);
                }
                this.lines(ol, color(g.color, a ? .31 : .065));
                const circuit = [];
                circuit.push([-4.9 + shift, y + .07, -2.8], [4.9 + shift, y + .07, -2.8]);
                for (let p of points.filter(p => p.group === gi)) {
                    circuit.push([p.pos[0], y + .071, -2.8], [p.pos[0], y + .071, p.pos[2]], [p.pos[0] - .18, y + .072, p.pos[2]], [p.pos[0] + .18, y + .072, p.pos[2]]);
                }
                // No decorative wiring: visible connectors always carry a directional meaning.
                this.points.push({ id: 'layer-' + gi, pos: [-5.4 + shift, y + .09, 3.0], labelPos: [-5.4 + shift, y + .09, 3.0], group: gi, title: g.name, layer: true, selected: false, active: a, selectable: false });
                this.drawMesh('cube', [5.45 + shift, y + .015, -2.1], [.035, .05, 1.2], color(g.color, a?.36:.08), .25);
            }
            gl.depthMask(true);
            const lookup = Object.fromEntries(points.filter(p => p.selectable).map(p => [p.id, p]));
            const flow=this.state.flow,tt=this.transitionT,prev=this.transition.fromFlow;
            if(prev&&tt<1){const a=lookup[prev.from],b=lookup[prev.to];if(a&&b&&a!==b)this.pathBetween([a.pos[0],a.topY+.09,a.pos[2]],[b.pos[0],b.topY+.09,b.pos[2]],t*.24,false,.48*(1-tt),'previous');}
            if(prev&&flow&&tt<1&&prev.to!==flow.from){const a=lookup[prev.to],b=lookup[flow.from];if(a&&b&&a!==b)this.pathBetween([a.pos[0],a.topY+.09,a.pos[2]],[b.pos[0],b.topY+.09,b.pos[2]],t*.20,false,.34*(1-tt),'bridge');}
            if(flow && !this.state.trace){
                const a=lookup[flow.from],b=lookup[flow.to];
                if(a&&b&&a!==b)this.pathBetween([a.pos[0],a.topY+.09,a.pos[2]],[b.pos[0],b.topY+.09,b.pos[2]],t*.32,this.state.playing,.46+.52*tt,'call');
            }
            // One quiet backplane spine communicates layers, not a mandatory call route.
            this.lines([[5.8, gy, -2.8], [5.8, 2.5 * spacing + .2, -2.8]], color('#538fb4', .045));
        }
        drawFocus(t) {
            const s = this.byid[this.state.selected];
            if (!s)
                return;
            const activeProvider = this.state.providers[s.id] || s.implementations[0];
            this.points = [];
            const add = (id, pos, title, group = 2, extra = {}) => { const p = { id, pos, title, group, selectable: true, pseudo: true, size: .62, ...extra }; this.points.push(p); this.node(p, t); return p; };
            const center = add(s.id, [0, 0, 0], 'ctx.' + s.id, s.group, { selected: true, active: true, pseudo: false, size: 1.52 });
            this.drawMesh('ring', [0, -.15, 0], [2, 1, 2], color(this.data.groups[s.group].color, .5), .2);
            this.drawMesh('ring', [0, -.22, 0], [2.15, 1, 2.15], color(this.data.groups[s.group].color, .17), .2);
            let callers = s.consumers.slice(0, 5);
            if (s.consumers.length > 5)
                callers.push('+' + (s.consumers.length - 5) + ' 个调用方');
            if (!callers.length)
                callers = ['无已列出的直接消费者'];
            callers.forEach((name, i) => { const p = add('consumer:' + name, [-4.5, (i - (callers.length - 1) / 2) * 1.16, .6], name, 0, { selectable: !name.startsWith('+') }); this.pathBetween([p.pos[0] + .4, p.pos[1] + .4, p.pos[2]], [-.8, .45, 0], t * .28 + i * .11, false, .32); });
            let providers = s.implementations.length ? s.implementations : [s.role === 'core' ? '核心服务 / 按插件扩展' : s.role === 'bundle' ? '具体循环组合' : '由运行时提供方或监听器接入'];
            providers.forEach((name, i) => { const selected = name === activeProvider; const p = add('provider:' + name, [4.5, (i - (providers.length - 1) / 2) * 1.16, .6], name, s.group, { active: selected, selectable: s.implementations.length > 0 }); this.pathBetween([.8, .45, 0], [p.pos[0] - .4, p.pos[1] + .4, p.pos[2]], t * .25 + i * .1, false, selected ? .7 : .25); });
            const owner = add('owner:' + s.owner, [0, 2.7, -1.2], '声明 · ' + s.owner, 5, { size: .67 });
            this.pathBetween([0, 2.8, -1.2], [0, .8, 0], 0, false, .48, 'declaration');
            this.gl.depthMask(false);
            this.drawMesh('slab', [0, -3.8, 0], [1.16, .6, 1.05], color('#7297c9', .045), .0);
            const outline = [];
            for (let i = 0; i < 8; i++) {
                const a = this.slabShape.outline[i], b = this.slabShape.outline[(i + 1) % 8];
                outline.push([a[0] * 1.16, -3.77, a[1] * 1.05], [b[0] * 1.16, -3.77, b[1] * 1.05]);
            }
            this.lines(outline, color('#5a8db6', .19));
            this.gl.depthMask(true);
        }
        updateLabels() { const candidates = []; for (let p of this.points) {
            if (!this.state.focus && !p.layer && !p.selected && (p.strength||0)<.18 && p.id!==this.hovered)
                continue;
            const q = this.project(p.labelPos || p.pos);
            if (!q)
                continue;
            let priority = p.id===this.hovered ? 110 : p.selected ? 100 : p.active ? 80 : p.layer ? 65 : this.state.focus ? 70 : 10;
            let y = q.y - (p.layer ? 0 : 14);
            const tr=window.DSHLocale?.t||((x)=>x);let text = p.layer ? `${String(p.group + 1).padStart(2, '0')}  ${tr(p.title)}` : p.id===this.hovered&&this.byid[p.id]?`${tr(this.byid[p.id].title)} · ctx.${p.id}`:tr(p.title);
            let w = p.layer ? 103 : Math.min(235, Math.max(65, text.length * 5.7 + 16));
            const x = this.state.focus ? Math.max(w / 2 + 10, Math.min(this.w - w / 2 - 10, q.x)) : q.x;
            if ((this.state.focus ? (q.x < 0 || q.x > this.w) : (x < w / 2 + 6 || x > this.w - w / 2 - 6)) || y < 116 || y > this.h - 100)
                continue;
            candidates.push({ p, q, x, y, w, priority, text });
        } candidates.sort((a, b) => b.priority - a.priority); const used = [], seen = new Set(); for (const c of candidates) {
            const { p, x, y, w } = c;
            const rect = { l: x - w / 2, r: x + w / 2, t: y - 12, b: y + 12 };
            if (used.some(r => rect.l < r.r + 3 && rect.r > r.l - 3 && rect.t < r.b + 3 && rect.b > r.t - 3))
                continue;
            used.push(rect);
            seen.add(p.id);
            let el = this.labels.get(p.id);
            if (!el) {
                el = document.createElement('div');
                this.labels.set(p.id, el);
                this.labelsRoot.appendChild(el);
            }
            el.className = 'node-label' + (p.layer ? ' layer' : '') + (p.active ? ' active' : '') + (p.selected ? ' selected' : '') + (p.pseudo ? ' pseudo' : '');
            if(el.textContent!==c.text)el.textContent = c.text;
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.opacity = p.layer ? (p.active?.78:.12) : p.selected||p.id===this.hovered ? 1 : Math.max(.08,.10+(p.strength||0)*.90);
            el.style.setProperty('--node-color', this.data.groups[p.group]?.color || '#86d7d2');
            el.style.display = 'block';
        } for (let [id, el] of this.labels)
            if (!seen.has(id))
                el.style.display = 'none'; }
        animate(now) { if (this.failed)
            return; requestAnimationFrame(this.animate); if (document.hidden || now - this.lastTime < 33)
            return; const elapsed=Math.min(100,now-this.lastTime);this.lastTime = now; if(this.transition.start&&this.transition.duration>0)this.transitionT=Math.min(1,(now-this.transition.start)/this.transition.duration);else this.transitionT=1; const transitioning=this.transitionT<1; if(this.state.playing&&!this.state.reduced)this.packetClock+=elapsed*(this.state.speed||1); const k = this.state.reduced ? 1 : .15; for (let key of ['yaw', 'elev', 'dist'])
            this.view[key] = lerp(this.view[key], this.target[key], k); if (!this.w || !this.h)
            return; const diff = Math.abs(this.view.yaw - this.target.yaw) + Math.abs(this.view.elev - this.target.elev) + Math.abs(this.view.dist - this.target.dist); if ((!this.state.playing || this.state.reduced) && !transitioning && this.lastTransitionFrame>=.999 && diff < .0005 && this.idleFrame > 3)
            return; this.idleFrame++; this.frameArrows=[]; this.packets=[]; const gl = this.gl; if (this.software) {
            this.queue = [];
        }
        else {
            gl.useProgram(this.program);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.depthMask(true);
        } let { yaw, elev, dist } = this.view; let mobile = this.w < 430; if (mobile)
            dist *= this.state.focus ? 1.27 : 1.10; const ey = [Math.sin(yaw) * Math.cos(elev) * dist, Math.sin(elev) * dist, Math.cos(yaw) * Math.cos(elev) * dist]; const at = this.state.focus ? [0, -.2, 0] : [0, .10, 0]; this.vp = mul(perspective(.65, this.w / this.h, .1, 130), lookAt(ey, at)); this.eye = ey; if (!this.software) {
            gl.uniformMatrix4fv(this.loc.uViewProj, false, this.vp);
            gl.uniform3fv(this.loc.uEye, ey);
        } let t = this.state.reduced ? 0 : now * .001; this.state.focus ? this.drawFocus(t) : this.drawOverview(t); if (this.software)
            this.paintSoftware(); this.drawAnnotations(); this.updateLabels(); this.lastTransitionFrame=this.transitionT; this.frames = (this.frames || 0) + 1; this.canvas.dataset.rendered = 'true'; this.canvas.dataset.frames = String(this.frames); }
    }
    window.DSHRenderer = Renderer;
})();
