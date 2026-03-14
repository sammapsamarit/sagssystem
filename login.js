import { auth, db } from "./firebase.js";

import {
signInWithEmailAndPassword,
createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import {
doc,
setDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";


// ELEMENTS

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginButton = document.getElementById("loginButton");

const message = document.getElementById("message");


// LOADING I BUTTON

function showLoading(){

loginButton.classList.add("loading");
loginButton.disabled = true;

}

function hideLoading(){

loginButton.classList.remove("loading");
loginButton.disabled = false;

}


// TABS

loginTab.onclick = ()=>{

loginForm.classList.remove("hidden");
registerForm.classList.add("hidden");

loginTab.classList.add("active");
registerTab.classList.remove("active");

message.innerText="";

};

registerTab.onclick = ()=>{

loginForm.classList.add("hidden");
registerForm.classList.remove("hidden");

registerTab.classList.add("active");
loginTab.classList.remove("active");

message.innerText="";

};


// LOGIN

loginForm.addEventListener("submit", async (e)=>{

e.preventDefault();

showLoading();

const email = document.getElementById("loginEmail").value;
const password = document.getElementById("loginPassword").value;

try{

await signInWithEmailAndPassword(auth,email,password);

window.location.href="forside.html";

}
catch(error){

hideLoading();

message.style.color="red";
message.innerText="Forkert email eller kode";

}

});


// REGISTER

registerForm.addEventListener("submit", async (e)=>{

e.preventDefault();

message.innerText="";

const name = document.getElementById("name").value;
const email = document.getElementById("email").value;
const phone = document.getElementById("phone").value;
const password = document.getElementById("password").value;

try{

const userCred = await createUserWithEmailAndPassword(auth,email,password);

await setDoc(doc(db,"users",userCred.user.uid),{

name:name,
email:email,
phone:phone,
role:"employee",
status:"pending",
created:new Date()

});

message.style.color="green";

message.innerText="Din bruger er oprettet og afventer godkendelse.";

registerForm.reset();

}
catch(error){

message.style.color="red";

message.innerText="Der skete en fejl under registrering.";

}

});