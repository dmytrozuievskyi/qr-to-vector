window.QRApp.math = (function() {
  function gaussSolve(A,b){
    const n=b.length;
    const M=A.map((row,i)=>[...row,b[i]]);
    for(let col=0;col<n;col++){
      let maxRow=col;
      for(let row=col+1;row<n;row++) if(Math.abs(M[row][col])>Math.abs(M[maxRow][col])) maxRow=row;
      [M[col],M[maxRow]]=[M[maxRow],M[col]];
      if(Math.abs(M[col][col])<1e-12) continue;
      for(let row=col+1;row<n;row++){
        const f=M[row][col]/M[col][col];
        for(let k=col;k<=n;k++) M[row][k]-=f*M[col][k];
      }
    }
    const x=new Array(n).fill(0);
    for(let i=n-1;i>=0;i--){
      if(Math.abs(M[i][i])<1e-12) continue;
      x[i]=M[i][n]/M[i][i];
      for(let k=i-1;k>=0;k--) M[k][n]-=M[k][i]*x[i];
    }
    return x;
  }

  function computeHomography(srcPts,dstPts){
    const rows=[],rhs=[];
    for(let i=0;i<4;i++){
      const {x:sx,y:sy}=srcPts[i], {x:dx,y:dy}=dstPts[i];
      rows.push([sx,sy,1,0,0,0,-sx*dx,-sy*dx]); rhs.push(dx);
      rows.push([0,0,0,sx,sy,1,-sx*dy,-sy*dy]); rhs.push(dy);
    }
    const h=gaussSolve(rows,rhs);
    return [[h[0],h[1],h[2]],[h[3],h[4],h[5]],[h[6],h[7],1.0]];
  }

  function invertMat3(m){
    const [[a,b,c],[d,e,f],[g,h,k]]=m;
    const det=a*(e*k-f*h)-b*(d*k-f*g)+c*(d*h-e*g);
    if(Math.abs(det)<1e-12) throw new Error('Singular homography');
    const s=1/det;
    return [[(e*k-f*h)*s,(c*h-b*k)*s,(b*f-c*e)*s],[(f*g-d*k)*s,(a*k-c*g)*s,(c*d-a*f)*s],[(d*h-e*g)*s,(b*g-a*h)*s,(a*e-b*d)*s]];
  }

  function applyH(M,x,y){
    const w=M[2][0]*x+M[2][1]*y+M[2][2];
    return [(M[0][0]*x+M[0][1]*y+M[0][2])/w,(M[1][0]*x+M[1][1]*y+M[1][2])/w];
  }

  return { gaussSolve, computeHomography, invertMat3, applyH };
})();
