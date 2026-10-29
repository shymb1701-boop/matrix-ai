(function () {
  var cv = document.getElementById('sky');
  var ctx = cv.getContext('2d', { alpha: false });
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1, stars = [], cons = [], shoot = null, nextShoot = 4;
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  var SHAPES = [
    { p: [[-.8,-.2],[-.4,-.1],[-.35,.25],[-.78,.2],[.05,-.2],[.45,-.35],[.85,-.15]], e: [[0,1],[1,2],[2,3],[3,0],[1,4],[4,5],[5,6]] },
    { p: [[-.5,-.8],[.5,-.75],[-.18,.02],[0,0],[.18,-.02],[-.45,.8],[.5,.75]], e: [[0,2],[1,4],[2,3],[3,4],[2,5],[4,6],[0,1]] },
    { p: [[-.9,-.2],[-.45,.3],[0,-.1],[.45,.35],[.9,-.25]], e: [[0,1],[1,2],[2,3],[3,4]] },
    { p: [[.7,-.8],[.55,-.5],[.4,-.2],[.3,.1],[.15,.35],[-.05,.55],[-.3,.65],[-.55,.55],[-.7,.3],[.9,-.45]], e: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[1,9]] },
    { p: [[-.3,-.8],[.1,-.75],[-.35,-.3],[-.2,.2],[-.4,.7],[.05,-.25],[.1,.25],[.3,.7]], e: [[0,2],[2,3],[3,4],[1,5],[5,6],[6,7],[2,5],[3,6]] },
    { p: [[0,-.8],[0,.8],[-.5,-.05],[.45,.15]], e: [[0,1],[2,3]] }
  ];
  var spr = document.createElement('canvas');
  spr.width = spr.height = 64;
  var sg = spr.getContext('2d');
  var g = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(.2, 'rgba(200,220,255,.85)');
  g.addColorStop(.5, 'rgba(130,160,255,.25)');
  g.addColorStop(1, 'rgba(130,160,255,0)');
  sg.fillStyle = g;
  sg.fillRect(0, 0, 64, 64);
  function build() {
    var area = W * H, base = Math.min(W, H), i;
    var n = Math.min(320, Math.round(area / 5500));
    stars = [];
    for (i = 0; i < n; i++) {
      var z = Math.random();
      stars.push({ x: Math.random() * W, y: Math.random() * H, z: z, r: .4 + z * 1.1, a: .3 + Math.random() * .6, ph: Math.random() * 6.28, sp: .6 + Math.random() * 1.8, vx: 2 + z * 6 });
    }
    var count = Math.max(4, Math.min(8, Math.round(area / 230000) + 3));
    cons = [];
    for (i = 0; i < count; i++) {
      var shape = SHAPES[i % SHAPES.length];
      var spd = 7 + Math.random() * 9, dir = Math.random() * 6.28;
      cons.push({
        shape: shape,
        pts: shape.p.map(function () { return [0, 0]; }),
        s: base * (.16 + Math.random() * .1),
        x: Math.random() * W, y: Math.random() * H,
        rot: Math.random() * 6.28, vr: (Math.random() - .5) * .05,
        vx: Math.cos(dir) * spd, vy: Math.sin(dir) * spd,
        ph: Math.random() * 6.28, depth: .4 + Math.random() * .6
      });
    }
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    if (reduce) render(0, 0);
  }
  function render(dt, t) {
    var i, j, k = Math.min(1, dt * 3);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);
    mouse.x += (mouse.tx - mouse.x) * k;
    mouse.y += (mouse.ty - mouse.y) * k;
    ctx.fillStyle = '#cfe0ff';
    for (i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.x += s.vx * dt; if (s.x > W + 6) s.x = -6;
      var px = s.x + mouse.x * s.z * 24, py = s.y + mouse.y * s.z * 24;
      ctx.globalAlpha = s.a * (.65 + .35 * Math.sin(t * s.sp + s.ph));
      if (s.r > 1.1) { var d0 = s.r * 8; ctx.drawImage(spr, px - d0 / 2, py - d0 / 2, d0, d0); }
      else ctx.fillRect(px, py, s.r * 1.4, s.r * 1.4);
    }
    for (i = 0; i < cons.length; i++) {
      var c = cons[i];
      c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt;
      var m = c.s * 1.5;
      if (c.x < -m) c.x = W + m; else if (c.x > W + m) c.x = -m;
      if (c.y < -m) c.y = H + m; else if (c.y > H + m) c.y = -m;
      var cs = Math.cos(c.rot), sn = Math.sin(c.rot);
      var ox = c.x + mouse.x * c.depth * 34, oy = c.y + mouse.y * c.depth * 34;
      var P = c.shape.p, E = c.shape.e, pts = c.pts;
      for (j = 0; j < P.length; j++) {
        pts[j][0] = ox + (P[j][0] * cs - P[j][1] * sn) * c.s;
        pts[j][1] = oy + (P[j][0] * sn + P[j][1] * cs) * c.s;
      }
      ctx.globalAlpha = .18 + .22 * (.5 + .5 * Math.sin(t * .8 + c.ph));
      ctx.strokeStyle = '#9db8ff';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (j = 0; j < E.length; j++) {
        var a = pts[E[j][0]], b = pts[E[j][1]];
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      }
      ctx.stroke();
      for (j = 0; j < pts.length; j++) {
        var tw = .7 + .3 * Math.sin(t * 1.6 + j * 1.7 + c.ph), d = 16 + 8 * tw;
        ctx.globalAlpha = .55 + .4 * tw;
        ctx.drawImage(spr, pts[j][0] - d / 2, pts[j][1] - d / 2, d, d);
      }
    }
    if (!reduce) {
      nextShoot -= dt;
      if (!shoot && nextShoot <= 0) {
        var ang = .35 + Math.random() * .3;
        shoot = { x: Math.random() * W * .7, y: Math.random() * H * .35, vx: Math.cos(ang) * 900, vy: Math.sin(ang) * 900, life: 0 };
        nextShoot = 6 + Math.random() * 8;
      }
      if (shoot) {
        shoot.life += dt; shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt;
        var f = 1 - shoot.life / .9;
        if (f <= 0) shoot = null;
        else {
          var tx = shoot.x - shoot.vx * .12, ty = shoot.y - shoot.vy * .12;
          var lg = ctx.createLinearGradient(tx, ty, shoot.x, shoot.y);
          lg.addColorStop(0, 'rgba(255,255,255,0)');
          lg.addColorStop(1, 'rgba(255,255,255,1)');
          ctx.globalAlpha = f; ctx.strokeStyle = lg; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(shoot.x, shoot.y); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  window.addEventListener('pointermove', function (e) {
    mouse.tx = e.clientX / W - .5; mouse.ty = e.clientY / H - .5;
  }, { passive: true });
  window.addEventListener('resize', resize);
  resize();
  if (!reduce) {
    var last = performance.now();
    (function loop(now) {
      var dt = Math.min((now - last) / 1000, .05);
      last = now;
      render(dt, now / 1000);
      requestAnimationFrame(loop);
    })(last);
  }
})();
