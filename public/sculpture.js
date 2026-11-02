// A small, dependency-free parametric sculpture shared by the SVG fallback
// and the interactive canvas. No browser state is accessed by this module.
const TAU = Math.PI * 2;
const normalize = v => { const n = Math.hypot(...v); return v.map(x => x / n); };
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
// A figure-eight centreline separates the two passes at its crossing in depth.
const center = t => [2.6*Math.cos(t), 1.05*Math.sin(2*t), .48*Math.sin(t)];

export function sculpturePoint(t,a) {
    const c = center(t);
    const tangent = normalize([-2.6*Math.sin(t),2.1*Math.cos(2*t),.48*Math.cos(t)]);
    const normal = normalize(cross(tangent,[0,0,1]));
    const binormal = cross(tangent,normal);
    const twist = t / 2;
    const wide = normal.map((v,k) => v*Math.cos(twist) + binormal[k]*Math.sin(twist));
    const thin = normal.map((v,k) => -v*Math.sin(twist) + binormal[k]*Math.cos(twist));
    return c.map((v,k) => v + .42*Math.cos(a)*wide[k] + .14*Math.sin(a)*thin[k]);
}

export function createSculpture(segments = 144, sides = 16) {
  const rings = Array.from({length:segments},(_,i)=>
    Array.from({length:sides},(_,j)=>sculpturePoint(i/segments*TAU,j/sides*TAU)));
  const faces = [];
  for (let i = 0; i < segments; i++) for (let j = 0; j < sides; j++) {
    // The half twist joins the opposite side of the elliptical cross-section.
    const offset = i === segments - 1 ? sides / 2 : 0;
    faces.push([rings[i][j],rings[(i+1)%segments][(j+offset)%sides],rings[(i+1)%segments][(j+1+offset)%sides],rings[i][(j+1)%sides]]);
  }
  return faces;
}

export function projectSculpture(mesh, width, height, angle = 0, tiltX = 0, tiltY = 0) {
  // Bounded movement keeps the infinity silhouette legible throughout the loop.
  const ax = .25 + .10*Math.cos(angle) + tiltY, ay = .12 + .2*Math.sin(angle) + tiltX, az = -.18;
  const sx = Math.sin(ax), cx = Math.cos(ax), sy = Math.sin(ay), cy = Math.cos(ay), sz = Math.sin(az), cz = Math.cos(az);
  const rotate = ([x,y,z]) => {
    const y1 = y*cx-z*sx, z1 = y*sx+z*cx;
    const x2 = x*cy+z1*sy, z2 = -x*sy+z1*cy;
    return [x2*cz-y1*sz,x2*sz+y1*cz,z2];
  };
  const scale = Math.min(width,height) / 7.7;
  const light = normalize([-.5,-.8,1.3]);
  return mesh.map(face => {
    const v = face.map(rotate);
    const normal = normalize(cross(v[1].map((x,i)=>x-v[0][i]),v[3].map((x,i)=>x-v[0][i])));
    const diffuse = Math.abs(normal.reduce((sum,x,i)=>sum+x*light[i],0));
    const specular = Math.pow(Math.max(0,normal[2]),18);
    const gray = Math.min(250,Math.round(90+diffuse*136+specular*24));
    return {
      depth: v.reduce((sum,p)=>sum+p[2],0)/4,
      color:`rgb(${gray},${gray},${gray})`,
      points:v.map(([x,y,z])=> { const perspective=10/(10-z); return [width/2+x*scale*perspective,height/2+y*scale*perspective]; })
    };
  }).sort((a,b)=>a.depth-b.depth);
}

export function sculptureSvg() {
  const faces = projectSculpture(createSculpture(),800,800);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><title>银灰色无穷符号扭转环</title>${faces.map(f=>`<path fill="${f.color}" stroke="${f.color}" stroke-width=".65" stroke-linejoin="round" d="M${f.points.map(p=>p.map(v=>v.toFixed(2)).join(',')).join('L')}Z"/>`).join('')}</svg>`;
}
