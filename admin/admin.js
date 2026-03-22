// ===== SHOW COLLEGE EASY ID =====
function loadCollegeCode(){

  const collegeId = localStorage.getItem("collegeId");
  if(!collegeId) return;

  firebase.database()
    .ref("colleges/"+collegeId+"/easyId")
    .once("value", snap => {

      const code = snap.val();

      if(code){
        document.getElementById("collegeCodeBox").innerText = code;
      }else{
        document.getElementById("collegeCodeBox").innerText = "Not generated";
      }

    });
}

// ===== AUTH CHECK =====
const collegeId = localStorage.getItem("collegeId");
if(!collegeId) location.href="../college/collegeLogin.html";

const db = firebase.database();


// =====================================================
// ================== ADD FUNCTIONS =====================
// =====================================================

function addBus(){

  const busNumber=document.getElementById("bnum").value.trim();
  const routeName=document.getElementById("rname").value.trim();
  const stops=document.getElementById("bstops").value.split(",").map(s=>s.trim());

  if(!busNumber) return alert("Enter bus number");

  const subRef = db.ref(`colleges/${collegeId}/subscription`);
  const busRef = db.ref(`colleges/${collegeId}/buses`);

  subRef.once("value").then(subSnap=>{

      const sub=subSnap.val();

      if(!sub || sub.status!=="ACTIVE"){
          alert("Subscription inactive. Renew first.");
          return;
      }

      // 🔴 expiry check
      if(Date.now()>sub.expiryDate){
          alert("Subscription expired. Renew required.");
          return;
      }

      // 🔴 bus count check
      busRef.once("value").then(busSnap=>{

          const currentCount=busSnap.numChildren();

          if(currentCount>=sub.busesAllowed){
              alert("Bus limit reached. Upgrade subscription.");
              return;
          }

          // ✅ add bus
          busRef.child(busNumber).set({
              busNumber,routeName,stops,createdAt:Date.now()
          }).then(()=>alert("Bus added successfully"));

      });

  });
}

function addStop(){
  const name=document.getElementById("sname").value.trim();
  const lat=parseFloat(document.getElementById("slat").value);
  const lng=parseFloat(document.getElementById("slng").value);

  if(!name) return alert("Enter stop name");

  db.ref(`colleges/${collegeId}/stops/${name}`).set({
      name, lat, lng,
      createdAt:Date.now()
  }).then(()=>alert("Stop added"));
}


function addDriver(){
  const id=document.getElementById("did").value.trim();
  const name=document.getElementById("dname").value.trim();
  const bus=document.getElementById("dbus").value.trim();

  if(!id) return alert("Enter driver id");

  db.ref(`colleges/${collegeId}/drivers/${id}`).set({
      driverId:id,
      name,
      busNumber:bus,
      status:"OFFLINE",
      createdAt:Date.now()
  }).then(()=>alert("Driver added"));
}


function addStudent(){
  const email=document.getElementById("studentEmail").value.trim();
  if(!email) return alert("Enter email");

  const id=email.replace(/\W/g,"");

  db.ref(`colleges/${collegeId}/students/${id}`).set({
      email,
      createdAt:Date.now()
  }).then(()=>alert("Student added"));
}



// =====================================================
// ================== LOAD DATA =========================
// =====================================================

// ----- LOAD STOPS -----
db.ref(`colleges/${collegeId}/stops`).on("value",snap=>{
  const box=document.getElementById("stopList");
  box.innerHTML="";

  snap.forEach(child=>{
    const s=child.val();

    box.innerHTML+=`
      <div>
        <span>${s.name} (${s.lat}, ${s.lng})</span>
        <button onclick="deleteStop('${child.key}')">Delete</button>
      </div>
    `;
  });
});

function deleteStop(id){
  db.ref(`colleges/${collegeId}/stops/${id}`).remove();
}



// ----- LOAD BUSES -----
db.ref(`colleges/${collegeId}/buses`).on("value",snap=>{
  const box=document.getElementById("busList");
  box.innerHTML="";

  snap.forEach(child=>{
    const b=child.val();

    box.innerHTML+=`
      <div>
        <span>${b.busNumber} → ${b.routeName}</span>
        <button onclick="deleteBus('${child.key}')">Delete</button>
      </div>
    `;
  });
});

function deleteBus(id){
  db.ref(`colleges/${collegeId}/buses/${id}`).remove();
}



// ----- LOAD DRIVERS -----
db.ref(`colleges/${collegeId}/drivers`).on("value",snap=>{
  const box=document.getElementById("driverList");
  box.innerHTML="";

  snap.forEach(child=>{
    const d=child.val();

    box.innerHTML+=`
      <div>
        <span>${d.driverId} - ${d.name} (${d.busNumber})</span>
        <button onclick="deleteDriver('${child.key}')">Delete</button>
      </div>
    `;
  });
});

function deleteDriver(id){
  db.ref(`colleges/${collegeId}/drivers/${id}`).remove();
}



// ----- LOAD STUDENTS -----
db.ref(`colleges/${collegeId}/students`).on("value",snap=>{
  const box=document.getElementById("studentList");
  box.innerHTML="";

  snap.forEach(child=>{
    const s=child.val();

    box.innerHTML+=`
      <div>
        <span>${s.email}</span>
        <button onclick="deleteStudent('${child.key}')">Delete</button>
      </div>
    `;
  });
});

function deleteStudent(id){
  db.ref(`colleges/${collegeId}/students/${id}`).remove();
}


function downloadApp(){
    window.location.href = "../admin/DriverTracking.apk";
}


// =====================================================
// ================== LOGOUT ============================
// =====================================================

function logout(){
  firebase.auth().signOut().then(()=>{
    localStorage.removeItem("collegeId");
    location.href="../college/collegeLogin.html";
  });
}



// =====================================================
// ================== TOGGLE BOX ========================
// =====================================================

function toggleBox(id,btn){
  const box=document.getElementById(id);

  if(box.style.display==="none"){
    box.style.display="block";
    btn.innerText="Hide";
  }else{
    box.style.display="none";
    btn.innerText="Show";
  }
}



firebase.auth().onAuthStateChanged(user => {

  if(!user){
    location.href="admin-login.html";
    return;
  }

  const collegeId = user.uid;

  firebase.database()
    .ref("colleges/"+collegeId+"/easyId")
    .once("value")
    .then(snap=>{

      const code = snap.val();

      if(code){
        document.getElementById("collegeCodeBox").innerText = code;
      }else{
        document.getElementById("collegeCodeBox").innerText = "Not generated";
      }

    });

});
