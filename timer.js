import { auth, db } from "./firebase.js";

import {
collection,
addDoc,
getDocs,
query,
where
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";


const taskSelect = document.getElementById("taskSelect");
const startTime = document.getElementById("startTime");
const endTime = document.getElementById("endTime");
const pauseTime = document.getElementById("pauseTime");
const result = document.getElementById("hoursResult");
const saveBtn = document.getElementById("saveBtn");
const timeList = document.getElementById("timeList");

const menuButton = document.getElementById("menuButton");
const menuPopup = document.getElementById("menuPopup");


/* MENU */

menuButton.onclick = () => {
menuPopup.classList.toggle("active");
};



/* BEREGN TIMER KORREKT */

function calculateHours(){

const start = startTime.value;
const end = endTime.value;
const pause = parseInt(pauseTime.value) || 0;

if(!start || !end) return;

const [sh, sm] = start.split(":").map(Number);
const [eh, em] = end.split(":").map(Number);

let totalMinutes = (eh * 60 + em) - (sh * 60 + sm);

totalMinutes -= pause;

if(totalMinutes < 0) totalMinutes = 0;

const hours = Math.floor(totalMinutes / 60);
const minutes = totalMinutes % 60;

result.textContent = `${hours}:${minutes.toString().padStart(2,"0")}`;

return totalMinutes;

}

startTime.oninput = calculateHours;
endTime.oninput = calculateHours;
pauseTime.oninput = calculateHours;



/* LOAD TASKS */

async function loadTasks(){

taskSelect.innerHTML = "<option>Vælg opgave</option>";

const snap = await getDocs(collection(db,"tasks"));

snap.forEach(doc=>{

const task = doc.data();

if(task.status !== "completed"){

const option = document.createElement("option");

option.value = doc.id;
option.textContent = task.name;

taskSelect.appendChild(option);

}

});

}



/* LOAD USER TIMES */

async function loadTimes(userId){

timeList.innerHTML = "";

const q = query(
collection(db,"time_entries"),
where("userId","==",userId)
);

const snap = await getDocs(q);

snap.forEach(doc=>{

const data = doc.data();

const card = document.createElement("div");

card.className = "timeCard";

card.innerHTML = `

<h3>${data.taskName}</h3>
<p>${data.start} - ${data.end}</p>
<p>${data.hours}</p>

`;

timeList.appendChild(card);

});

}



/* SAVE TIME */

async function saveTime(userId){

const taskId = taskSelect.value;
const taskName = taskSelect.options[taskSelect.selectedIndex].text;

const totalMinutes = calculateHours();

const hours = Math.floor(totalMinutes / 60);
const minutes = totalMinutes % 60;

const timeString = `${hours}:${minutes.toString().padStart(2,"0")}`;

await addDoc(collection(db,"time_entries"),{

taskId,
taskName,
start:startTime.value,
end:endTime.value,
pause:pauseTime.value,
hours:timeString,
totalMinutes:totalMinutes,
userId,
date:new Date()

});

location.reload();

}



/* AUTH */

onAuthStateChanged(auth,user=>{

if(!user) return;

loadTasks();
loadTimes(user.uid);

saveBtn.onclick = () => saveTime(user.uid);

});
