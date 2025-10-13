let mqttClient;
let editingPillId = null;


const saveSchedules = () => {
  localStorage.setItem('scheduledPills', JSON.stringify(scheduledPills.map(pill => ({ id: pill.id, medicationName: pill.medicationName, date: pill.date, time: pill.time, status: pill.status }))));
}


const loadSchedules = () => {
  const savedPills = JSON.parse(localStorage.getItem('scheduledPills'));
  if (savedPills) {
    savedPills.forEach(pill => {
      addScheduleEntry(pill.medicationName, pill.date, pill.time, pill.id);

      const lastAddedPill = scheduledPills.find(p => p.id === pill.id);
      if (lastAddedPill && pill.status === 'taken') {
        lastAddedPill.status = 'taken';
        lastAddedPill.row.querySelector('.inline-flex').textContent = 'Taken';
        lastAddedPill.row.querySelector('.inline-flex').classList.remove('bg-green-100', 'dark:bg-green-900', 'text-green-800', 'dark:text-green-200');
        lastAddedPill.row.querySelector('.inline-flex').classList.add('bg-blue-100', 'dark:bg-blue-900', 'text-blue-800', 'dark:text-blue-200');
      }
    });
  }
}

window.addEventListener("load", (event) => {
  connection();
  const publishBtn = document.querySelector(".publish");
  if (publishBtn) {
    publishBtn.addEventListener("click", () => {
      publishMessage();
    });
  }
  console.log("done!");

  loadSchedules();

  const addScheduleBtn = document.getElementById("addScheduleBtn");
  const addScheduleModal = document.getElementById("addScheduleModal");
  const saveScheduleModalBtn = document.getElementById("saveScheduleModalBtn");
  const closeScheduleModalBtn = document.getElementById("closeScheduleModalBtn");
  const medicationNameInput = document.getElementById("medicationName");
  const scheduleDateInput = document.getElementById("scheduleDate");
  const scheduleTimeInput = document.getElementById("scheduleTime");

  if (addScheduleBtn && addScheduleModal) {
    addScheduleBtn.addEventListener("click", () => {
      editingPillId = null;
      medicationNameInput.value = '';
      scheduleDateInput.value = '';
      scheduleTimeInput.value = '';
      addScheduleModal.classList.remove("hidden");
    });
  }

  if (closeScheduleModalBtn && addScheduleModal) {
    closeScheduleModalBtn.addEventListener("click", () => {
      addScheduleModal.classList.add("hidden");
    });
  }

  if (saveScheduleModalBtn) {
    saveScheduleModalBtn.addEventListener("click", () => {
      const medicationName = medicationNameInput.value;
      const scheduleDate = scheduleDateInput.value;
      const scheduleTime = scheduleTimeInput.value;
      if (medicationName && scheduleDate && scheduleTime) {
        if (editingPillId) {
          // Update existing schedule
          const pillIndex = scheduledPills.findIndex(p => p.id === Number(editingPillId));
          if (pillIndex !== -1) {
            scheduledPills[pillIndex].medicationName = medicationName;
            scheduledPills[pillIndex].date = scheduleDate;
            scheduledPills[pillIndex].time = scheduleTime;
            scheduledPills[pillIndex].status = 'pending';

            scheduledPills[pillIndex].row.children[0].textContent = `${scheduleDate} ${scheduleTime}`;
            scheduledPills[pillIndex].row.children[1].textContent = medicationName;

            const statusSpan = scheduledPills[pillIndex].row.children[3].querySelector('.inline-flex');
            statusSpan.textContent = 'Pending';
            statusSpan.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'text-blue-800', 'dark:text-blue-200');
            statusSpan.classList.add('bg-green-100', 'dark:bg-green-900', 'text-green-800', 'dark:text-green-200');
          }
          editingPillId = null;
        } else {
          addScheduleEntry(medicationName, scheduleDate, scheduleTime);
        }
        saveSchedules();
        medicationNameInput.value = '';
        scheduleDateInput.value = '';
        scheduleTimeInput.value = '';
        addScheduleModal.classList.add("hidden");
      } else {
        alert("Please enter medication name, date, and time.");
      }
    });
  }
});

let scheduledPills = [];

// add schedule rows
const addScheduleEntry = (medicationName, date, time, id = Date.now()) => {
  const scheduleTableBody = document.querySelector("#scheduleTable tbody");
  const newRow = scheduleTableBody.insertRow();
  newRow.dataset.id = id;

  newRow.className = "bg-white dark:bg-background-dark border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30";

  const dateTimeCell = newRow.insertCell();
  dateTimeCell.className = "px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap";
  dateTimeCell.textContent = `${date} ${time}`;

  const medicationCell = newRow.insertCell();
  medicationCell.className = "px-6 py-4";
  medicationCell.textContent = medicationName;

  const dosageCell = newRow.insertCell();
  dosageCell.className = "px-6 py-4";
  dosageCell.textContent = "1 tablet"; 

  const statusCell = newRow.insertCell();
  statusCell.className = "px-6 py-4";
  statusCell.innerHTML = `
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
      Pending
    </span>
  `;

  const actionsCell = newRow.insertCell();
  actionsCell.className = "px-6 py-4 text-right space-x-2";
  actionsCell.innerHTML = `
    <button class="edit-btn p-2 rounded-lg hover:bg-primary/10 text-primary" data-id="${id}">
      <span class="material-symbols-outlined text-base">edit</span>
    </button>
    <button class="delete-btn p-2 rounded-lg hover:bg-red-500/10 text-red-500" data-id="${id}">
      <span class="material-symbols-outlined text-base">delete</span>
    </button>
  `;

  scheduledPills.push({ id, medicationName, date, time, status: 'pending', row: newRow });


  newRow.querySelector('.edit-btn').addEventListener('click', (e) => editSchedule(e.currentTarget.dataset.id));
  newRow.querySelector('.delete-btn').addEventListener('click', (e) => deleteSchedule(e.currentTarget.dataset.id));
}

const deleteSchedule = (id) => {
  const pillIndex = scheduledPills.findIndex(pill => pill.id == id);
  if (pillIndex !== -1) {
    scheduledPills[pillIndex].row.remove();
    scheduledPills.splice(pillIndex, 1);
    saveSchedules();
  }
}

const editSchedule = (id) => {
  const pill = scheduledPills.find(p => p.id == id);
  if (pill) {
    editingPillId = id;
    document.getElementById("medicationName").value = pill.medicationName;
    document.getElementById("scheduleDate").value = pill.date;
    document.getElementById("scheduleTime").value = pill.time;
    document.getElementById("addScheduleModal").classList.remove("hidden");
  }
}

const getCurrentThaiDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const getCurrentThaiTime = () => {
  const now = new Date();
  const thaiTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok'
  }).format(now);
  return thaiTime;
}

const checkSchedule = () => {
  const currentDate = getCurrentThaiDate();
  const currentTime = getCurrentThaiTime();
  console.log("Current Thai Date:", currentDate, "Current Thai Time:", currentTime);

  scheduledPills.forEach(pill => {
    if (pill.status === 'pending' && pill.date === currentDate && pill.time === currentTime) {
      console.log(`Time to take ${pill.medicationName} on ${pill.date} at ${pill.time}!`);

      publishMessage(`Time to take ${pill.medicationName}!`);
      pill.status = 'taken';

      pill.row.querySelector('.inline-flex').textContent = 'Taken';
      pill.row.querySelector('.inline-flex').classList.remove('bg-green-100', 'dark:bg-green-900', 'text-green-800', 'dark:text-green-200');
      pill.row.querySelector('.inline-flex').classList.add('bg-blue-100', 'dark:bg-blue-900', 'text-blue-800', 'dark:text-blue-200');
    }
  });
}

setInterval(checkSchedule, 60 * 1000);

checkSchedule();

const connection = () => {
  const clientId = "client" + Math.random().toString(36).substring(7);
  const host = "wss://mqtt-dashboard.com:8884/mqtt";

  const options = {
    keepalive: 60,
    clientId: clientId,
    protocolId: "MQTT",
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    protocol: "wss",
  };
  mqttClient = mqtt.connect(host, options);
  mqttClient.on("error", (err) => {
    mqttClient.end();
    console.log("error");
  });
  mqttClient.on("reconnect", () => {
    console.log("Reconnecting...");
  });
  mqttClient.on("connect", () => {
    console.log("client connected:" + clientId);
  });
  console.log("connected");
};

const publishMessage = () => {
  const topic = "PillMate/20";

  mqttClient.publish(topic, "ถึงเวลากินยาแล้ว💊", {
    qos: 0,
    retain: false,
  });
};
