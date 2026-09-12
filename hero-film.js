/* Decode the original H.264 MP4 and key its green backdrop into real canvas alpha. */
(() => {
 const stage=document.querySelector('#hero-film');if(!stage)return;
 const canvas=stage.querySelector('canvas');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const video=document.createElement('video');video.src='media/video/annabelle-hello-silent.mp4';video.muted=true;video.defaultMuted=true;video.loop=false;video.playsInline=true;video.preload='auto';video.setAttribute('playsinline','');video.setAttribute('muted','');
 // The source stays off the visual surface; the canvas is the only video output.
 let gl,program,texture,buffer,frameId=null,usingVideoFrames='requestVideoFrameCallback' in video,visible=true,finished=false,failed=false;
 function fail(){failed=true;cancelFrame();video.pause();stage.classList.remove('is-ready');if(!stage.querySelector('.film-error')){const note=document.createElement('span');note.className='film-error';note.setAttribute('role','status');note.textContent='The hello video couldn’t load.';stage.append(note);}}
 function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;}
 try{
  gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL unavailable');
  const vert=compile(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}');
  const frag=compile(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 uv;uniform sampler2D frame;
   vec2 chroma(vec3 c){return vec2(dot(c,vec3(-.169,-.331,.5)),dot(c,vec3(.5,-.419,-.081)));}
   void main(){vec4 c=texture2D(frame,uv);float d=distance(chroma(c.rgb),chroma(vec3(0.,.694,.247)));
    float a=smoothstep(.14,.25,d);float spill=max(c.g-(c.r+c.b)*.5,0.);c.g-=spill*.95;
    a*=1.-smoothstep(.965,.99,uv.y);gl_FragColor=vec4(c.rgb*a,a);}`);
  program=gl.createProgram();gl.attachShader(program,vert);gl.attachShader(program,frag);gl.linkProgram(program);gl.deleteShader(vert);gl.deleteShader(frag);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader link failed');gl.useProgram(program);
  buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.uniform1i(gl.getUniformLocation(program,'frame'),0);
 }catch(error){fail();return;}
 function draw(){if(failed||video.readyState<2)return;try{if(canvas.width!==video.videoWidth||canvas.height!==video.videoHeight){canvas.width=video.videoWidth;canvas.height=video.videoHeight;gl.viewport(0,0,canvas.width,canvas.height);}gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);gl.drawArrays(gl.TRIANGLES,0,3);stage.classList.add('is-ready');stage.dataset.frames=String((Number(stage.dataset.frames)||0)+1);stage.dataset.time=video.currentTime.toFixed(2);}catch(error){fail();}}
 function cancelFrame(){if(frameId===null)return;usingVideoFrames?video.cancelVideoFrameCallback(frameId):cancelAnimationFrame(frameId);frameId=null;}
 function tick(){frameId=null;draw();if(!video.paused&&visible&&!document.hidden&&!failed)frameId=usingVideoFrames?video.requestVideoFrameCallback(tick):requestAnimationFrame(tick);}
 function startFrames(){cancelFrame();tick();}
 async function resume(){if(failed||finished||reduced.matches||!visible||document.hidden)return;try{await video.play();}catch{stage.dataset.autoplay='blocked';}}
 video.addEventListener('loadeddata',()=>{draw();resume();});
 video.addEventListener('playing',()=>{stage.dataset.playing='true';startFrames();});
 video.addEventListener('pause',()=>{stage.dataset.playing='false';cancelFrame();draw();});
 video.addEventListener('ended',()=>{finished=true;stage.dataset.complete='true';cancelFrame();draw();});
 video.addEventListener('seeked',draw);video.addEventListener('error',fail);
 // An ordinary first interaction can unlock muted autoplay; it cannot pause or replay it.
 addEventListener('pointerdown',resume,{once:true,passive:true});
 addEventListener('keydown',resume,{once:true});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail();});
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else video.pause();},{threshold:.03}):null;
 observer?.observe(stage);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else resume();});
 reduced.addEventListener('change',()=>{if(reduced.matches){video.pause();}});
 video.load();
 addEventListener('pagehide',()=>{cancelFrame();video.pause();observer?.disconnect();video.removeAttribute('src');video.load();gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);},{once:true});
})();
