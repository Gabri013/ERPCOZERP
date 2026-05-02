import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Visualizador 3D (Three.js): rotação/orbit, zoom; alternância wireframe sólido.
 */
export default function EngenhariaViewer3D() {
  const containerRef = useRef(null);
  const materialRef = useRef(null);
  const wireframeRef = useRef(false);
  const rafRef = useRef(null);
  const [wireframe, setWireframe] = useState(false);

  useEffect(() => {
    wireframeRef.current = wireframe;
  }, [wireframe]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    let disposed = false;
    let disposeScene = () => {};

    (async () => {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
      if (disposed || !containerRef.current) return;

      const w = Math.max(el.clientWidth, 280);
      const h = 320;
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
      camera.position.set(2.2, 1.4, 3.2);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      el.appendChild(renderer.domElement);

      const geom = new THREE.BoxGeometry(1.2, 0.75, 0.35);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x8899aa,
        metalness: 0.55,
        roughness: 0.38,
        wireframe: false,
      });
      materialRef.current = mat;
      mat.wireframe = wireframeRef.current;
      const mesh = new THREE.Mesh(geom, mat);
      scene.add(mesh);

      scene.add(new THREE.AmbientLight(0x505060));
      const dir = new THREE.DirectionalLight(0xffffff, 1);
      dir.position.set(3.5, 5, 4);
      scene.add(dir);

      const ctrl = new OrbitControls(camera, renderer.domElement);
      ctrl.enableDamping = true;
      ctrl.dampingFactor = 0.06;

      const loop = () => {
        if (disposed) return;
        ctrl.update();
        renderer.render(scene, camera);
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();

      const ro = new ResizeObserver(() => {
        if (disposed || !containerRef.current) return;
        const cw = Math.max(containerRef.current.clientWidth, 200);
        camera.aspect = cw / h;
        camera.updateProjectionMatrix();
        renderer.setSize(cw, h);
      });
      ro.observe(el);

      disposeScene = () => {
        ro.disconnect();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        ctrl.dispose();
        geom.dispose();
        mat.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === el) {
          el.removeChild(renderer.domElement);
        }
        materialRef.current = null;
      };
    })();

    return () => {
      disposed = true;
      disposeScene();
    };
  }, []);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.wireframe = wireframe;
    }
  }, [wireframe]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={wireframe ? 'secondary' : 'outline'} size="sm" onClick={() => setWireframe((w) => !w)}>
          {wireframe ? 'Sólido' : 'Wireframe'}
        </Button>
      </div>
      <div
        ref={containerRef}
        className="w-full min-h-[320px] rounded-md border border-border bg-muted/30"
        role="img"
        aria-label="Pré-visualização 3D do modelo"
      />
      <p className="text-xs text-muted-foreground">
        Arraste para orbitar, scroll para zoom. Anexe STL/glTF no cadastro do produto para integração futura com este viewer.
      </p>
    </div>
  );
}
