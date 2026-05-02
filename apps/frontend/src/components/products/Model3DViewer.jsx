import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Visualizador 3D com URL autenticada (blob): STL, glTF/glB, OBJ.
 */
export default function Model3DViewer({ modelUrl, title = 'Modelo 3D' }) {
  const containerRef = useRef(null);
  const materialRef = useRef(null);
  const [wireframe, setWireframe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    materialRef.current = null;
    if (!modelUrl) {
      setLoading(false);
      return undefined;
    }

    let disposed = false;
    let objectUrl = null;
    let disposeScene = () => {};

    (async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const { resolveApiUrl } = await import('@/config/appConfig');
        const res = await fetch(resolveApiUrl(modelUrl), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Falha ao carregar modelo (${res.status})`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        const lower = modelUrl.toLowerCase();
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

        let mesh = null;
        if (lower.endsWith('.stl')) {
          const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
          const geom = await new STLLoader().loadAsync(objectUrl);
          const mat = new THREE.MeshStandardMaterial({
            color: 0x9aa8b8,
            metalness: 0.45,
            roughness: 0.42,
          });
          materialRef.current = mat;
          mesh = new THREE.Mesh(geom, mat);
          geom.computeVertexNormals();
        } else if (lower.endsWith('.gltf') || lower.endsWith('.glb')) {
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
          const gltf = await new GLTFLoader().loadAsync(objectUrl);
          mesh = gltf.scene;
        } else if (lower.endsWith('.obj')) {
          const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
          const obj = await new OBJLoader().loadAsync(objectUrl);
          const mat = new THREE.MeshStandardMaterial({
            color: 0x9aa8b8,
            metalness: 0.45,
            roughness: 0.42,
          });
          materialRef.current = mat;
          obj.traverse((c) => {
            if (c.isMesh) {
              c.material = mat;
            }
          });
          mesh = obj;
        } else {
          throw new Error('Formato não suportado (use STL, glTF, glB ou OBJ)');
        }

        if (disposed || !containerRef.current) return;

        const el = containerRef.current;
        const w = Math.max(el.clientWidth, 280);
        const h = 360;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 5000);
        camera.position.set(0, 0, 120);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
        el.appendChild(renderer.domElement);

        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 1);
        mesh.position.sub(center);
        camera.position.z = maxDim * 2.2;

        scene.add(mesh);
        scene.add(new THREE.AmbientLight(0x606068));
        const d = new THREE.DirectionalLight(0xffffff, 1);
        d.position.set(50, 80, 60);
        scene.add(d);

        const ctrl = new OrbitControls(camera, renderer.domElement);
        ctrl.enableDamping = true;
        ctrl.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        };

        let raf = null;
        const loop = () => {
          if (disposed) return;
          ctrl.update();
          renderer.render(scene, camera);
          raf = requestAnimationFrame(loop);
        };
        loop();

        const ro = new ResizeObserver(() => {
          if (!containerRef.current) return;
          const cw = Math.max(containerRef.current.clientWidth, 200);
          camera.aspect = cw / h;
          camera.updateProjectionMatrix();
          renderer.setSize(cw, h);
        });
        ro.observe(el);

        disposeScene = () => {
          ro.disconnect();
          if (raf) cancelAnimationFrame(raf);
          ctrl.dispose();
          renderer.dispose();
          if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
          mesh?.traverse?.((o) => {
            if (o.geometry) o.geometry.dispose();
          });
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        };

        setLoading(false);
      } catch (e) {
        if (!disposed) {
          setError(e?.message || 'Erro ao carregar');
          setLoading(false);
        }
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }
    })();

    return () => {
      disposed = true;
      disposeScene();
    };
  }, [modelUrl]);

  useEffect(() => {
    if (materialRef.current) materialRef.current.wireframe = wireframe;
  }, [wireframe]);

  if (!modelUrl) {
    return <p className="text-sm text-muted-foreground">Nenhum modelo 3D cadastrado.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => setWireframe((w) => !w)}>
          {wireframe ? 'Sólido' : 'Wireframe'}
        </Button>
      </div>
      {loading && <p className="text-xs text-muted-foreground">Carregando modelo…</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div
        ref={containerRef}
        className="w-full min-h-[360px] rounded-md border border-border bg-muted/20"
        role="img"
        aria-label={title}
      />
      <p className="text-[11px] text-muted-foreground">
        Botão esquerdo: girar · Scroll: zoom · Botão direito / Shift+arrastar: panorâmica (OrbitControls).
      </p>
    </div>
  );
}
