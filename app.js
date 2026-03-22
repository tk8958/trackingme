// ================= COLLEGE CHECK =================
const collegeId = localStorage.getItem("collegeId");

if(!collegeId){
  alert("Please login first");
  location.href="students/studentLogin.html";
}

const db = firebase.database();


// ================= SAFE TEXT =================
function setText(id,val){
  const el=document.getElementById(id);
  if(el) el.innerText=val;
}


// ================= CANVAS =================
const canvas=document.getElementById("mapCanvas");
const ctx=canvas.getContext("2d");

function resizeCanvas(height=600){
  canvas.width=canvas.clientWidth;
  canvas.height=height;
}


// ================= BUS IMAGE =================
const busImg=new Image();
busImg.src="images/bus2.png";


// ================= DISTANCE =================
function getDistanceKm(lat1,lon1,lat2,lon2){
  const R=6371;
  const dLat=(lat2-lat1)*Math.PI/180;
  const dLon=(lon2-lon1)*Math.PI/180;

  const a=
    Math.sin(dLat/2)**2+
    Math.cos(lat1*Math.PI/180)*
    Math.cos(lat2*Math.PI/180)*
    Math.sin(dLon/2)**2;

  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}


// ================= DRAW ROUTE =================
function drawRoute(stops,locations){

  const SCALE=35;
  const MIN_GAP=40;
  const MAX_GAP=120;

  let gaps=[0];
  let totalHeight=120;

  for(let i=0;i<stops.length-1;i++){
    const A=locations[stops[i]];
    const B=locations[stops[i+1]];

    let km=getDistanceKm(A.lat,A.lng,B.lat,B.lng);
    let gap=Math.log(km+1)*SCALE;
    gap=Math.min(Math.max(gap,MIN_GAP),MAX_GAP);

    gaps.push(gap);
    totalHeight+=gap;
  }

  resizeCanvas(totalHeight+100);
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const x=canvas.width/2;
  let y=60;

  ctx.strokeStyle="#ff4500";
  ctx.lineWidth=4;
  ctx.beginPath();
  ctx.moveTo(x,y);

  const stopY=[];

  stops.forEach((_,i)=>{
    stopY.push(y);
    if(i>0) ctx.lineTo(x,y);
    y+=gaps[i+1]||0;
  });

  ctx.stroke();

  stops.forEach((stop,i)=>{
    ctx.fillStyle="blue";
    ctx.beginPath();
    ctx.arc(x,stopY[i],4,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle="#000";
    ctx.font="13px Arial";
    ctx.fillText(stop,x+14,stopY[i]+4);
  });

  return {stopY,x};
}



// ================= SEARCH BUS =================
document.getElementById("searchBtn").onclick=async()=>{

  const busNumber=busNumberInput.value.trim();
  if(!busNumber) return alert("Enter bus number");

  const busSnap=await db
    .ref(`colleges/${collegeId}/buses/${busNumber}`)
    .once("value");

  if(!busSnap.exists()) return alert("Bus not found");

  const stops=busSnap.val().stops||[];
  const locations={};

  for(let s of stops){
    const snap=await db
      .ref(`colleges/${collegeId}/stops/${s}`)
      .once("value");

    if(snap.exists()) locations[s]=snap.val();
  }

  let routeInfo=drawRoute(stops,locations);

  db.ref(`colleges/${collegeId}/drivers`)
    .on("value",snap=>{

      ctx.clearRect(0,0,canvas.width,canvas.height);
      routeInfo=drawRoute(stops,locations);

      snap.forEach(driverSnap=>{

        const d=driverSnap.val();

        if(d.busNumber!==busNumber) return;
        if(d.status!=="ONLINE") return;

        let seg=0,min=Infinity;

        for(let i=0;i<stops.length-1;i++){
          const A=locations[stops[i]];
          const B=locations[stops[i+1]];

          const midLat=(A.lat+B.lat)/2;
          const midLng=(A.lng+B.lng)/2;

          const dist=getDistanceKm(d.latitude,d.longitude,midLat,midLng);

          if(dist<min){
            min=dist;
            seg=i;
          }
        }

        const from=locations[stops[seg]];
        const to=locations[stops[seg+1]];

        const total=getDistanceKm(from.lat,from.lng,to.lat,to.lng);
        const covered=getDistanceKm(from.lat,from.lng,d.latitude,d.longitude);

        const ratio=Math.min(Math.max(covered/total,0),1);

        const y=
          routeInfo.stopY[seg]+
          (routeInfo.stopY[seg+1]-routeInfo.stopY[seg])*ratio;

        const size = 18;

        ctx.drawImage(
          busImg,
          routeInfo.x - size/2,
          y - size/2,
          size,
          size
        );

        setText("driverName",d.name||"---");

        // ✅ FIXED DRIVER TIME
        if(d.lastUpdated){

          const driverTime = new Date(Number(d.lastUpdated));

          const formatted = driverTime.toLocaleTimeString("en-IN",{
            hour:"2-digit",
            minute:"2-digit",
            second:"2-digit",
            hour12:true,
            timeZone:"Asia/Kolkata"
          });

          setText("time",formatted);
        }

      });

    });

};