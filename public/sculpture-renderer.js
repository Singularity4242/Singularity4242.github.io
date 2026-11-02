import { sculpturePoint } from './sculpture.js';

// GPU rendering stays local: smooth normals, procedural studio reflections and
// a depth shadow map, without external textures or rendering dependencies.
const TAU = Math.PI * 2;
const norm = a => { const n = Math.hypot(...a); return a.map(v => v/n); };
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub = (a,b) => a.map((v,i)=>v-b[i]);
const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
const multiply = (a,b) => Array.from({length:16},(_,i)=>{const r=i%4,c=Math.floor(i/4);return a[r]*b[c*4]+a[r+4]*b[c*4+1]+a[r+8]*b[c*4+2]+a[r+12]*b[c*4+3];});
function rotation(x,y,z) {
  const sx=Math.sin(x),cx=Math.cos(x),sy=Math.sin(y),cy=Math.cos(y),sz=Math.sin(z),cz=Math.cos(z);
  return multiply([cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1],multiply([cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1],[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1]));
}
function view(eye) {
  const z=norm(eye),x=norm(cross([0,1,0],z)),y=cross(z,x);
  return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
}
function perspective(aspect) {
  const f=1/Math.tan(42*Math.PI/360),near=.1,far=40;
  return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];
}
function point(t,a) {
  const p=sculpturePoint(t,a);
  return [p[0],-p[1],p[2]];
}
export function createGeometry(segments=256,sides=32) {
  const positions=[],normals=[],indices=[];
  for(let i=0;i<=segments;i++) for(let j=0;j<=sides;j++) {
    const t=i/segments*TAU,a=j/sides*TAU,p=point(t,a),eps=.0001;
    const dt=sub(point(t+eps,a),point(t-eps,a));
    const da=sub(point(t,a+eps),point(t,a-eps));
    positions.push(...p);normals.push(...norm(cross(dt,da)));
  }
  for(let i=0;i<segments;i++) for(let j=0;j<sides;j++) {
    const a=i*(sides+1)+j,b=a+sides+1;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  return {positions:new Float32Array(positions),normals:new Float32Array(normals),indices:new Uint16Array(indices)};
}
const vertex=`#version 300 es
in vec3 position;
in vec3 normal;
uniform mat4 model;
uniform mat4 camera;
uniform mat4 lightCamera;
out vec3 world;
out vec3 surfaceNormal;
out vec4 shadowPosition;
void main(){vec4 p=model*vec4(position,1.);world=p.xyz;surfaceNormal=mat3(model)*normal;shadowPosition=lightCamera*p;gl_Position=camera*p;}`;
const fragment=`#version 300 es
precision highp float;
in vec3 world;
in vec3 surfaceNormal;
in vec4 shadowPosition;
uniform sampler2D shadowMap;
uniform float shadowSize;
out vec4 color;
float softShadow(vec3 n,vec3 light){
 vec3 p=shadowPosition.xyz/shadowPosition.w*.5+.5;
 float bias=max(.0007,.002*(1.-max(dot(n,light),0.)));
 float lit=0.;
 for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
   float depth=texture(shadowMap,p.xy+vec2(float(x),float(y))/shadowSize).r;
   lit+=p.z-bias<=depth?1.:0.;
 }
 return lit/9.;
}
float studio(vec3 r){
 // Virtual softboxes form broad highlights that travel over the curved metal.
 float sky=.04+.14*smoothstep(-.45,.8,r.y);
 float key=2.7*exp(-pow((r.x+.4)/.48,2.)-pow((r.y-.62)/.25,2.));
 float strip=1.5*exp(-pow((r.x-.72)/.1,2.))*smoothstep(-.5,.7,r.y);
 float fill=.5*exp(-pow((r.y+.55)/.14,2.));
 return sky+key+strip+fill;
}
void main(){
 vec3 n=normalize(surfaceNormal),v=normalize(vec3(0.,0.,10.)-world);
 if(dot(n,v)<0.)n=-n;
 vec3 l=normalize(vec3(-3.,5.,7.)-world),h=normalize(l+v);
 float shadow=softShadow(n,l);
 float diffuse=max(dot(n,l),0.);
 float spec=pow(max(dot(n,h),0.),95.);
 float fresnel=.62+.38*pow(1.-max(dot(n,v),0.),5.);
 float reflected=studio(reflect(-v,n));
 float metal=.025+.09*diffuse*shadow+reflected*fresnel*(.25+.75*shadow)+spec*.8*shadow;
 metal=metal/(metal+.45);
 metal=pow(metal,1./2.2);
 color=vec4(vec3(metal),1.);
}`;
const depthVertex=`#version 300 es
in vec3 position;
uniform mat4 model;
uniform mat4 camera;
void main(){gl_Position=camera*model*vec4(position,1.);}`;
const depthFragment=`#version 300 es
precision highp float;
void main(){}`;
export function createSculptureRenderer(canvas,compact=false) {
  const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
  if(!gl) return null;
  const resources=[];
  const own=(type,object)=>{resources.push([type,object]);return object;};
  const dispose=()=>{for(const [type,object] of resources)gl[`delete${type}`](object);};
  function program(vs,fs) {
    const p=own('Program',gl.createProgram());
    for(const [type,src] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]) {
      const s=own('Shader',gl.createShader(type));gl.shaderSource(s,src);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p,s);
    }
    gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  try {
    const main=program(vertex,fragment),depth=program(depthVertex,depthFragment);
    const geometry=createGeometry(compact?192:256,32);
    function vao(p) {
      const vertexArray=own('VertexArray',gl.createVertexArray());gl.bindVertexArray(vertexArray);
      for(const [name,data] of [['position',geometry.positions],['normal',geometry.normals]]) {
        const loc=gl.getAttribLocation(p,name);if(loc<0)continue;
        const buffer=own('Buffer',gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
        gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);
      }
      const index=own('Buffer',gl.createBuffer());gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,geometry.indices,gl.STATIC_DRAW);
      return vertexArray;
    }
    const mainVao=vao(main),depthVao=vao(depth),shadowSize=compact?1024:2048;
    const shadow=own('Texture',gl.createTexture());gl.bindTexture(gl.TEXTURE_2D,shadow);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,shadowSize,shadowSize,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const framebuffer=own('Framebuffer',gl.createFramebuffer());gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shadow,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Shadow buffer unavailable');
    const lightCamera=multiply([1/3.8,0,0,0,0,1/3.8,0,0,0,0,-2/20,0,0,0,-1,1],view([-3,5,7]));
    const uniforms=p=>Object.fromEntries(['model','camera','lightCamera','shadowMap','shadowSize'].map(n=>[n,gl.getUniformLocation(p,n)]));
    const mainU=uniforms(main),depthU=uniforms(depth);
    gl.enable(gl.DEPTH_TEST);
    return {
      dispose,
      draw({pitch=0,yaw=0,phase=0}) {
        const model=rotation(-.35+pitch+.08*Math.sin(phase),.12+yaw+.14*Math.sin(phase*.7),.18);
        gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.viewport(0,0,shadowSize,shadowSize);gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.useProgram(depth);gl.bindVertexArray(depthVao);
        gl.uniformMatrix4fv(depthU.model,false,model);gl.uniformMatrix4fv(depthU.camera,false,lightCamera);
        gl.drawElements(gl.TRIANGLES,geometry.indices.length,gl.UNSIGNED_SHORT,0);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);
        gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.useProgram(main);gl.bindVertexArray(mainVao);
        gl.uniformMatrix4fv(mainU.model,false,model);gl.uniformMatrix4fv(mainU.camera,false,multiply(perspective(canvas.width/canvas.height),view([0,0,10])));
        gl.uniformMatrix4fv(mainU.lightCamera,false,lightCamera);gl.uniform1f(mainU.shadowSize,shadowSize);
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shadow);gl.uniform1i(mainU.shadowMap,0);
        gl.drawElements(gl.TRIANGLES,geometry.indices.length,gl.UNSIGNED_SHORT,0);
      }
    };
  } catch(error) {dispose();console.warn('3D rendering unavailable; using the static illustration.',error.message);return null;}
}
