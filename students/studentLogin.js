console.log("student login js running");

// Firebase DB
const db = firebase.database();

async function loginStudent(){

    console.log("button clicked");

    const easyId = document.getElementById("easyId").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();

    if(!easyId || !email){
        alert("Enter college ID & email");
        return;
    }

    try{

        await firebase.auth().signInAnonymously();

        const colleges = await db.ref("colleges").once("value");

        let collegeId = null;

        colleges.forEach(c=>{
            if(c.child("easyId").val() === easyId){
                collegeId = c.key;
            }
        });

        if(!collegeId){
            alert("College not found");
            return;
        }

        const students = await db.ref(`colleges/${collegeId}/students`).once("value");

        let studentId = null;

        students.forEach(s=>{
            if(s.child("email").val().toLowerCase() === email){
                studentId = s.key;
            }
        });

        if(!studentId){
            alert("Not allowed. Contact admin.");
            return;
        }

        localStorage.setItem("collegeId", collegeId);
        localStorage.setItem("studentId", studentId);

        window.location.href="../routeSearch.html";

    }catch(err){
        console.error(err);
        alert("Login error");
    }
}

// make global
window.loginStudent = loginStudent;