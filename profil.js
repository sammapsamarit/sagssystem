import { auth, db } from "./firebase.js";

import {
doc,
getDoc,
updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
onAuthStateChanged,
updateEmail,
updatePassword,
signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";


const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const password = document.getElementById("password");

const saveBtn = document.getElementById("saveBtn");

const menuButton = document.getElementById("menuButton");
const menuPopup = document.getElementById("menuPopup");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser;



/* MENU */

menuButton.onclick = () => {

menuPopup.classList.toggle("active");

};



/* LOGOUT */

if(logoutBtn){

logoutBtn.addEventListener("click", async () => {

await signOut(auth);

window.location.href = "login.html";

});

}



/* LOAD USER DATA */

onAuthStateChanged(auth, async (user)=>{

if(!user){

window.location.href = "login.html";
return;

}

currentUser = user;

const userRef = doc(db,"users",user.uid);
const snap = await getDoc(userRef);

if(!snap.exists()) return;

const data = snap.data();

const nameParts = (data.name || "").split(" ");

firstName.value = nameParts[0] || "";
lastName.value = nameParts.slice(1).join(" ");

email.value = data.email || "";
phone.value = data.phone || "";

});



/* SAVE PROFILE */

saveBtn.addEventListener("click", async ()=>{

if(!currentUser) return;

saveBtn.textContent = "Gemmer...";
saveBtn.disabled = true;

try{

const fullName = `${firstName.value} ${lastName.value}`;

const userRef = doc(db,"users",currentUser.uid);



/* UPDATE FIRESTORE */

await updateDoc(userRef,{

name: fullName,
email: email.value,
phone: phone.value

});



/* UPDATE EMAIL */

if(email.value !== currentUser.email){

await updateEmail(currentUser,email.value);

}



/* UPDATE PASSWORD */

if(password.value.length > 0){

await updatePassword(currentUser,password.value);

password.value = "";

}



alert("Profil opdateret ✅");

}catch(error){

console.error(error);

alert("Der opstod en fejl: " + error.message);

}

saveBtn.textContent = "Gem ændringer";
saveBtn.disabled = false;

});