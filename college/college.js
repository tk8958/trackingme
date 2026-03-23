// 🔹 Generate short readable college ID
function generateCollegeCode(name){
    const clean = name.replace(/\s+/g,'').toUpperCase().slice(0,4);
    const random = Math.floor(1000 + Math.random()*9000);
    return clean + random;
}

// ================= REGISTER =================
function registerCollege(){

    const name=document.getElementById("collegeName").value.trim();
    const email=document.getElementById("email").value.trim();
    const password=document.getElementById("password").value.trim();

    if(!name || !email || !password){
        alert("All fields required");
        return;
    }

    const buses=parseInt(prompt("Kitni buses ka subscription chahiye?\n₹1000 per bus / year"));

    if(!buses || buses<1){
        alert("Enter valid bus count");
        return;
    }

    const pricePerBus = 1;
    const totalAmount = buses * pricePerBus;

    const options = {
        key: "rzp_test_SSatdpeZIdnRYw",
        amount: totalAmount * 100,
        currency: "INR",
        name: "VUBUS Subscription",
        description: buses + " Bus Subscription (1 Year)",

        // ✅ FIXED HANDLER
        handler: async function (response) {

            try{

                const paymentId = response.razorpay_payment_id;

                if(!paymentId){
                    alert("Payment Failed");
                    return;
                }

                const tempRef = firebase.database().ref("tempPayments/" + paymentId);
                const snap = await tempRef.once("value");

                // 🔴 DUPLICATE CHECK (IMPORTANT)
                if(snap.exists()){
                    alert("Payment already used ❌");
                    return;
                }

                // ✅ SAVE PAYMENT
                await tempRef.set({
                    paymentId: paymentId,
                    amount: totalAmount,
                    status: "PENDING",
                    createdAt: Date.now()
                });

                // ✅ DIRECT REGISTRATION (NO EXTRA VERIFY)
                await completeRegistration(
                    buses,
                    totalAmount,
                    paymentId
                );

            }catch(e){
                console.error(e);
                alert("Payment failed ❌");
            }
        }
    };

    const rzp = new Razorpay(options);
    rzp.open();
}


// ================= COMPLETE REGISTRATION =================
async function completeRegistration(buses,totalAmount,paymentId){

    try{

        const name=document.getElementById("collegeName").value.trim();
        const email=document.getElementById("email").value.trim();
        const password=document.getElementById("password").value.trim();

        const cred = await firebase.auth().createUserWithEmailAndPassword(email,password);

        const user=cred.user;
        const collegeId=user.uid;
        const easyId=generateCollegeCode(name);

        const startDate=Date.now();
        const expiryDate=startDate + (365*24*60*60*1000);

        await firebase.database().ref("colleges/"+collegeId).set({
            collegeName:name,
            email:email,
            easyId:easyId,
            createdAt:startDate,
            status:"ACTIVE",

            subscription:{
                busesAllowed:buses,
                amountPaid:totalAmount,
                paymentId:paymentId,
                startDate:startDate,
                expiryDate:expiryDate,
                status:"ACTIVE"
            }
        });

        // ✅ MARK PAYMENT USED
        await firebase.database()
            .ref("tempPayments/" + paymentId)
            .update({
                status:"USED"
            });

        await user.sendEmailVerification();

        alert("Registration successful 🎉\nVerify email before login.");

        firebase.auth().signOut();

        window.location.href="collegeLogin.html";

    }catch(e){
        console.error(e);
        alert("Registration failed ❌");
    }
}


// ================= LOGIN =================
function loginCollege(){

    const email=document.getElementById("email").value.trim();
    const password=document.getElementById("password").value.trim();

    if(!email || !password){
        alert("Enter email & password");
        return;
    }

    firebase.auth().signInWithEmailAndPassword(email,password)
    .then(async (cred)=>{

        const user=cred.user;

        await user.reload();

        if(!user.emailVerified){
            alert("❌ Email verify karo pehle.");
            firebase.auth().signOut();
            return;
        }

        const collegeId=user.uid;

        const subSnap=await firebase.database()
            .ref("colleges/"+collegeId+"/subscription")
            .once("value");

        const sub=subSnap.val();

        if(!sub){
            alert("Subscription missing.");
            firebase.auth().signOut();
            return;
        }

        if(Date.now()>sub.expiryDate){
            alert("⚠ Subscription expired.");
            window.location.href="renew.html";
            return;
        }

        localStorage.setItem("collegeId",collegeId);

        window.location.href="../admin/admin.html";

    })
    .catch(err=>alert(err.message));
}


// global
window.registerCollege=registerCollege;
window.loginCollege=loginCollege;
window.completeRegistration=completeRegistration;
