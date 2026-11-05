/**
 * School admin — neural / aurora motion (connect-internet style)
 */
(function () {
    'use strict';

    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    function initNeuralCanvas() {
        var canvas = document.getElementById('ci-neural-canvas');
        if (! canvas || ! canvas.getContext) {
            return;
        }

        var ctx = canvas.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var nodes = [];
        var mouse = { x: null, y: null };
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function resize() {
            var w = window.innerWidth;
            var h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            seed(w, h);
        }

        function seed(w, h) {
            var count = Math.floor((w * h) / 22000);
            count = Math.max(22, Math.min(count, 55));
            nodes = [];
            for (var i = 0; i < count; i++) {
                nodes.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.28,
                    vy: (Math.random() - 0.5) * 0.28,
                    r: Math.random() * 1.5 + 0.7,
                });
            }
        }

        function frame() {
            var w = window.innerWidth;
            var h = window.innerHeight;
            ctx.clearRect(0, 0, w, h);

            for (var i = 0; i < nodes.length; i++) {
                var a = nodes[i];
                if (! reduce) {
                    a.x += a.vx;
                    a.y += a.vy;
                    if (a.x < 0 || a.x > w) a.vx *= -1;
                    if (a.y < 0 || a.y > h) a.vy *= -1;
                }

                ctx.beginPath();
                ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(45, 212, 191, 0.5)';
                ctx.fill();

                for (var j = i + 1; j < nodes.length; j++) {
                    var b = nodes[j];
                    var dx = a.x - b.x;
                    var dy = a.y - b.y;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 130) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = 'rgba(45, 212, 191,' + (0.16 * (1 - dist / 130)) + ')';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }

                if (mouse.x !== null) {
                    var mdx = a.x - mouse.x;
                    var mdy = a.y - mouse.y;
                    var md = Math.sqrt(mdx * mdx + mdy * mdy);
                    if (md < 160) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.strokeStyle = 'rgba(245, 158, 11,' + (0.18 * (1 - md / 160)) + ')';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

            if (! reduce) {
                requestAnimationFrame(frame);
            }
        }

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', function (e) {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        window.addEventListener('mouseleave', function () {
            mouse.x = null;
            mouse.y = null;
        });

        resize();
        frame();
    }

    ready(function () {
        document.body.classList.add('ci-admin');
        initNeuralCanvas();
    });
})();
