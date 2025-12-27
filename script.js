var firebaseConfig = {
   apiKey: "XXXX",
   authDomain: "XXXX",
   databaseURL: "XXXX",
   projectId: "XXXX",
   storageBucket: "XXXX",
   messagingSenderId: "XXXX",
   appId: "XXXX"
};

firebase.initializeApp(firebaseConfig);
let db = firebase.database();

let currentRoll = "";
let serverOtp = "";

function loadCandidates(){
  db.ref("candidates").once("value", snap=>{
     let data = snap.val();
     let div = document.getElementById("candidateList");
     div.innerHTML="";

     Object.keys(data).forEach(id=>{
        let box = document.createElement("div");
        box.className="candidate";
        box.innerHTML = `
           <h3>${data[id].name}</h3>
           <button onclick="vote('${id}')">Vote</button>
        `;
        div.appendChild(box);
     })
  })
}

function sendOTP(){
   currentRoll = document.getElementById("roll").value;

   db.ref("users/"+currentRoll).once("value", snap=>{
      if(!snap.exists()){
         alert("Roll not registered");
         return;
      }

      fetch("/sendOTP",{
         method:"POST",
         headers:{"Content-Type":"application/json"},
         body:JSON.stringify({phone:snap.val().phone})
      })
      .then(r=>r.json())
      .then(res=>{
          serverOtp = res.otp;
          alert("OTP Sent!");

          document.getElementById("otp").style.display="block";
          document.getElementById("verifyBtn").style.display="inline-block";
      })
   })
}

function verifyOTP(){
   let userOtp = document.getElementById("otp").value;

   if(userOtp == serverOtp){
      alert("Verified!");
      db.ref("users/"+currentRoll+"/verified").set(true);
      document.getElementById("authBox").style.display="none";
      document.getElementById("voteSection").style.display="block";
      loadCandidates();
   } else alert("Wrong OTP");
}

function vote(candidateId){
   db.ref("users/"+currentRoll).once("value", snap=>{
      let user = snap.val();

      if(user.voted && user.changedOnce){
         alert("You cannot change vote again!");
         return;
      }

      if(user.voted && !user.changedOnce){
         db.ref("candidates/"+user.voted+"/votes").transaction(v=> (v||0)-1 );
         db.ref("users/"+currentRoll+"/changedOnce").set(true);
      }

      db.ref("candidates/"+candidateId+"/votes").transaction(v=> (v||0)+1 );
      db.ref("users/"+currentRoll+"/voted").set(candidateId);

      alert("Vote Recorded!");
   })
}
