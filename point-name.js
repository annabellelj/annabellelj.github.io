/* A projected point cloud of the name. The real heading remains accessible. */
(() => {
 const host=document.querySelector('#point-name');if(!host)return;
 const canvas=host.querySelector('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),mouse={x:-1000,y:-1000};
 let points=[],width=0,height=0,raf=0,energy=0;
 function build(){
  const r=host.getBoundingClientRect();width=r.width;height=r.height;if(!width||!height)return;
  const dpr=Math.min(devicePixelRatio,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  const mask=document.createElement('canvas');mask.width=Math.ceil(width);mask.height=Math.ceil(height);const m=mask.getContext('2d');
  const style=getComputedStyle(host);m.font=`italic ${style.fontSize} Georgia`;m.textBaseline='alphabetic';m.fillText('Annabelle.',0,height*.80,width);
  const data=m.getImageData(0,0,mask.width,mask.height).data;points=[];
  for(let y=1;y<mask.height;y+=2.4)for(let x=1;x<mask.width;x+=2.4){if(data[(Math.floor(y)*mask.width+Math.floor(x))*4+3]>90)points.push({x,y,z:Math.sin(x*4.8+y*1.7),shade:(Math.sin(x*7+y*3)+1)/2});}
  host.classList.add('is-ready');draw();
 }
 function draw(){
  raf=0;ctx.clearRect(0,0,width,height);let moving=false;
  for(const p of points){let dx=p.x-mouse.x,dy=p.y-mouse.y,d=Math.hypot(dx,dy),force=reduce.matches?0:Math.max(0,1-d/65)*energy;const x=p.x+(dx/(d||1))*force*9,y=p.y+(dy/(d||1))*force*7+p.z*force*2;
   ctx.fillStyle=`rgba(${105+Math.round(p.shade*35)},${78+Math.round(p.shade*24)},${53+Math.round(p.shade*22)},${.65+p.shade*.35})`;ctx.beginPath();ctx.arc(x,y,.82+p.shade*.27,0,Math.PI*2);ctx.fill();}
  if(energy>.005&&mouse.x<0){energy*=.86;moving=true;}
  if(moving)raf=requestAnimationFrame(draw);
 }
 function request(){if(!raf)raf=requestAnimationFrame(draw);}
 host.addEventListener('pointermove',e=>{if(reduce.matches)return;const r=host.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;energy=1;request();});
 host.addEventListener('pointerleave',()=>{mouse.x=-1000;mouse.y=-1000;request();});
 const observer=new ResizeObserver(build);observer.observe(host);document.fonts.ready.then(build);reduce.addEventListener('change',draw);
 addEventListener('pagehide',()=>{observer.disconnect();cancelAnimationFrame(raf);},{once:true});
})();
