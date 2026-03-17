import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";


const pendingUsers = document.getElementById("pendingUsers");
const materialsList = document.getElementById("materialsList");
const employeesList = document.getElementById("employeesList");

const materialName = document.getElementById("materialName");
const addMaterialBtn = document.getElementById("addMaterialBtn");

const overlay = document.getElementById("overlay");
const employeeModal = document.getElementById("employeeModal");
const closeEmployeeModal = document.getElementById("closeEmployeeModal");

const employeeName = document.getElementById("employeeName");
const employeeEmail = document.getElementById("employeeEmail");
const employeePhone = document.getElementById("employeePhone");
const employeeStatus = document.getElementById("employeeStatus");
const employeeHoursList = document.getElementById("employeeHoursList");

const CHEF_EMAIL = "rene@malerfirma.dk";



async function loadPendingUsers(){

  pendingUsers.innerHTML = `<p class="emptyText">Loader anmodninger...</p>`;

  const snapshot = await getDocs(collection(db,"users"));

  const pending = [];

  snapshot.forEach((docSnap)=>{

    const data = docSnap.data();

    if(data.status === "pending"){

      pending.push({
        id:docSnap.id,
        ...data
      });

    }

  });

  pendingUsers.innerHTML = "";

  if(pending.length === 0){

    pendingUsers.innerHTML = `<p class="emptyText">Der er ingen afventende login anmodninger.</p>`;
    return;

  }

  pending.forEach((user)=>{

    const card = document.createElement("div");
    card.className = "userCard";

    card.innerHTML = `
      <div class="userCardTop">
        <div class="userMain">
          <strong>${user.name || "-"}</strong>
          <span>${user.email || "-"}</span>
          <span>${user.phone || "-"}</span>
        </div>
        <div class="tag">Afventer</div>
      </div>

      <div class="actions">
        <button class="secondaryBtn approveBtn">Godkend</button>
        <button class="rejectBtn rejectUserBtn">Afvis</button>
      </div>
    `;

    const approveBtn = card.querySelector(".approveBtn");
    const rejectBtn = card.querySelector(".rejectUserBtn");

    approveBtn.addEventListener("click", async ()=>{

      await updateDoc(doc(db,"users",user.id),{
        status:"approved"
      });

      loadPendingUsers();
      loadEmployees();

    });

    rejectBtn.addEventListener("click", async ()=>{

      await updateDoc(doc(db,"users",user.id),{
        status:"rejected"
      });

      loadPendingUsers();
      loadEmployees();

    });

    pendingUsers.appendChild(card);

  });

}



async function loadMaterials(){

  materialsList.innerHTML = `<p class="emptyText">Loader materialer...</p>`;

  const snapshot = await getDocs(collection(db,"materials"));

  const items = [];

  snapshot.forEach((docSnap)=>{

    items.push({
      id:docSnap.id,
      ...docSnap.data()
    });

  });

  materialsList.innerHTML = "";

  if(items.length === 0){

    materialsList.innerHTML = `<p class="emptyText">Ingen materialer endnu.</p>`;
    return;

  }

  items.forEach((item)=>{

    const card = document.createElement("div");
    card.className = "materialCard";

    card.innerHTML = `
      <div class="materialRow">
        <span>${item.name || "-"}</span>
        <button class="smallBtn deleteMaterialBtn">Fjern</button>
      </div>
    `;

    card.querySelector(".deleteMaterialBtn").addEventListener("click",async()=>{

      await deleteDoc(doc(db,"materials",item.id));
      loadMaterials();

    });

    materialsList.appendChild(card);

  });

}



addMaterialBtn.addEventListener("click",async()=>{

  const name = materialName.value.trim();

  if(!name){

    alert("Skriv navnet på materialet.");
    return;

  }

  await addDoc(collection(db,"materials"),{
    name:name,
    created:new Date()
  });

  materialName.value = "";

  loadMaterials();

});



async function loadEmployees(){

  employeesList.innerHTML = `<p class="emptyText">Loader medarbejdere...</p>`;

  const snapshot = await getDocs(collection(db,"users"));

  const employees = [];

  snapshot.forEach((docSnap)=>{

    const data = docSnap.data();

    if(data.status === "approved"){

      employees.push({
        id:docSnap.id,
        ...data
      });

    }

  });

  employeesList.innerHTML = "";

  if(employees.length === 0){

    employeesList.innerHTML = `<p class="emptyText">Ingen medarbejdere fundet.</p>`;
    return;

  }

  employees.forEach((employee)=>{

    const card = document.createElement("div");
    card.className = "employeeCard";

    card.innerHTML = `
      <div class="employeeCardTop">
        <div class="employeeMain">
          <strong>${employee.name || "-"}</strong>
          <span>${employee.email || "-"}</span>
          <span>${employee.phone || "-"}</span>
        </div>
        <div class="tag">${employee.status || "-"}</div>
      </div>

      <div class="actions">
        <button class="smallBtn viewEmployeeBtn">Se medarbejder</button>
        <button class="rejectBtn removeEmployeeBtn">Fjern</button>
      </div>
    `;

    card.querySelector(".viewEmployeeBtn").addEventListener("click",async()=>{

      await openEmployeeModal(employee.id);

    });


    card.querySelector(".removeEmployeeBtn").addEventListener("click",async()=>{

      if(employee.email === CHEF_EMAIL){

        alert("Du kan ikke fjerne dig selv.");
        return;

      }

      const confirmDelete = confirm("Er du sikker på at du vil fjerne denne medarbejder?");

      if(!confirmDelete) return;

      await deleteDoc(doc(db,"users",employee.id));

      loadEmployees();

    });

    employeesList.appendChild(card);

  });

}



async function openEmployeeModal(userId){

  const userRef = doc(db,"users",userId);
  const userSnap = await getDoc(userRef);

  if(!userSnap.exists()) return;

  const userData = userSnap.data();

  employeeName.textContent = userData.name || "-";
  employeeEmail.textContent = userData.email || "-";
  employeePhone.textContent = userData.phone || "-";
  employeeStatus.textContent = userData.status || "-";

  employeeHoursList.innerHTML = `<p class="emptyText">Loader timer...</p>`;

  overlay.classList.add("active");
  employeeModal.classList.add("active");

  const hoursQuery = query(
    collection(db,"time_entries"),
    where("userId","==",userId)
  );

  const hoursSnapshot = await getDocs(hoursQuery);

  const hours = [];

  hoursSnapshot.forEach((docSnap)=>{
    hours.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  employeeHoursList.innerHTML = "";

  if(hours.length === 0){

    employeeHoursList.innerHTML = `<p class="emptyText">Ingen registrerede timer endnu.</p>`;
    return;

  }

  hours.forEach((entry)=>{

    const pause = Number(entry.pause || 0);
    const start = entry.start || "-";
    const end = entry.end || "-";
    const task = entry.taskName || "Ukendt opgave";

    let workedText = "Ukendt";

    if(start !== "-" && end !== "-"){

      const [sh,sm] = start.split(":").map(Number);
      const [eh,em] = end.split(":").map(Number);

      let minutes = (eh*60+em)-(sh*60+sm);
      minutes -= pause;

      if(minutes < 0) minutes = 0;

      const hoursWorked = Math.floor(minutes/60);
      const minsWorked = minutes % 60;

      workedText = `${hoursWorked}:${minsWorked.toString().padStart(2,"0")}`;

    }

    /* 🔥 NYT: DATO */
    let dateText = "-";

    if(entry.date){
      const d = entry.date.toDate ? entry.date.toDate() : new Date(entry.date);

      dateText = d.toLocaleDateString("da-DK",{
        day:"2-digit",
        month:"2-digit",
        year:"numeric"
      });
    }

    const card = document.createElement("div");
    card.className = "hourCard";

    card.innerHTML = `
      <strong>${task}</strong>
      <span>Dato: ${dateText}</span>
      <span>Start: ${start}</span>
      <span>Slut: ${end}</span>
      <span>Pause: ${pause} min</span>
      <span>${workedText} timer</span>
      <button class="rejectBtn deleteTimeBtn">Slet registrering</button>
    `;

    card.querySelector(".deleteTimeBtn").addEventListener("click", async ()=>{

      const confirmDelete = confirm("Er du sikker på at du vil slette denne tidsregistrering?");

      if(!confirmDelete) return;

      await deleteDoc(doc(db,"time_entries",entry.id));

      await openEmployeeModal(userId);

    });

    employeeHoursList.appendChild(card);

  });

}



function closeModal(){

  overlay.classList.remove("active");
  employeeModal.classList.remove("active");

}

closeEmployeeModal.addEventListener("click",closeModal);
overlay.addEventListener("click",closeModal);



loadPendingUsers();
loadMaterials();
loadEmployees();