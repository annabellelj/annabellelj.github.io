/* Display the supplied green-screen still directly, with transparent keyed pixels. */
(() => {
 document.querySelectorAll('img[src*="移除垫子"]').forEach(img=>{
  const apply=()=>{try{
   const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
   const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),d=pixels.data;
   for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2],excess=g-Math.max(r,b);const alpha=1-Math.max(0,Math.min(1,(excess-15)/55));d[i+3]=Math.round(255*alpha);if(excess>15)d[i+1]=Math.min(g,Math.max(r,b)+15);}
   ctx.putImageData(pixels,0,0);
   // Keep the original accessible image and its existing pointer interactions.
   img.src=canvas.toDataURL('image/png');img.classList.add('keyed-portrait');
  }catch(error){console.warn('Portrait backdrop could not be keyed',error);}};
  if(img.complete&&img.naturalWidth)apply();else img.addEventListener('load',apply,{once:true});
 });
})();
