import { auth, db } from "./firebase.js";

import {
collection,
getDocs,
getDoc,
doc,
query,
where
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";


const welcomeText = document.getElementById("welcomeText");
const activeTasks = document.getElementById("activeTasks");
const weekHours = document.getElementById("weekHours");

const quickBtn = document.getElementById("quickTimeBtn");

const menuButton = document.getElementById("menuButton");
const menuPopup = document.getElementById("menuPopup");
const logoutBtn = document.getElementById("logoutBtn");
const chefBtn = document.getElementById("chefBtn");



/* MENU */

menuButton.onclick = () => {
menuPopup.classList.toggle("active");
};



/* LOGOUT */

if(logoutBtn){

logoutBtn.addEventListener("click", async () => {

await signOut(auth);
location.href = "login.html";

});

}



/* CHEF BUTTON */

if(chefBtn){

chefBtn.onclick = () => {

location.href = "chef.html";

};

}



/* QUICK TIMER */

quickBtn.onclick = () => {

location.href = "timer.html";

};



/* LOAD ACTIVE TASKS */

async function loadTasks(){

const snapshot = await getDocs(collection(db,"tasks"));

let count = 0;

snapshot.forEach(doc=>{

const task = doc.data();

if(task.status !== "completed"){
count++;
}

});

activeTasks.textContent = count;

}



/* FIND MANDAG */

function getWeekStart(){

const now = new Date();

const day = now.getDay();

const diff = now.getDate() - day + (day === 0 ? -6 : 1);

const monday = new Date(now.setDate(diff));

monday.setHours(0,0,0,0);

return monday;

}



/* LOAD WEEK HOURS */

async function loadWeekHours(userId){

const monday = getWeekStart();

const q = query(
collection(db,"time_entries"),
where("userId","==",userId)
);

const snap = await getDocs(q);

let minutes = 0;

snap.forEach(doc=>{

const data = doc.data();

const date = data.date?.toDate?.() || new Date(data.date);

if(date >= monday){
minutes += data.totalMinutes || 0;
}

});

const hours = Math.floor(minutes/60);
const mins = minutes % 60;

weekHours.textContent = `${hours}:${mins.toString().padStart(2,"0")}`;

}



/* AUTH */

onAuthStateChanged(auth, async (user)=>{

/* Hvis ikke logget ind */

if(!user){
location.href = "login.html";
return;
}



/* HENT BRUGER FRA FIRESTORE */

const userRef = doc(db,"users",user.uid);
const userSnap = await getDoc(userRef);

let name = "Bruger";

if(userSnap.exists()){

const data = userSnap.data();

name = data.name || "Bruger";

/* VIS CHEF KNAP */

if(data.email === "rene@malerfirma.dk" && chefBtn){
chefBtn.style.display = "block";
}

}



/* VIS NAVN */

welcomeText.textContent = `Hej ${name} 👋`;



/* LOAD DATA */

loadTasks();
loadWeekHours(user.uid);

});