const storageKey = "busBuddyLog";
const nameKey = "busBuddyNames";

const nameAInput = document.querySelector("#nameA");
const nameBInput = document.querySelector("#nameB");
const saveNamesButton = document.querySelector("#saveNames");
const logForm = document.querySelector("#logForm");
const logDate = document.querySelector("#logDate");
const logShift = document.querySelector("#logShift");
const logPerson = document.querySelector("#logPerson");
const logNotes = document.querySelector("#logNotes");
const logHoliday = document.querySelector("#logHoliday");
const summaryMonth = document.querySelector("#summaryMonth");
const balanceCard = document.querySelector("#balanceCard");
const summaryLists = document.querySelector("#summaryLists");
const logTable = document.querySelector("#logTable");

const today = new Date();

const toDateInputValue = (date) => date.toISOString().slice(0, 10);

const getMonthKey = (dateString) => dateString.slice(0, 7);

const formatDisplayDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const readLogs = () => {
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : [];
};

const saveLogs = (logs) => {
  localStorage.setItem(storageKey, JSON.stringify(logs));
};

const readNames = () => {
  const stored = localStorage.getItem(nameKey);
  return stored ? JSON.parse(stored) : ["Supervisor A", "Supervisor B"];
};

const saveNames = (names) => {
  localStorage.setItem(nameKey, JSON.stringify(names));
};

const setNames = () => {
  const [nameA, nameB] = readNames();
  nameAInput.value = nameA;
  nameBInput.value = nameB;
  logPerson.innerHTML = "";
  [nameA, nameB].forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    logPerson.append(option);
  });
};

const updateBalance = (logs, selectedMonth) => {
  const [nameA, nameB] = readNames();
  const monthLogs = logs.filter((log) => getMonthKey(log.date) === selectedMonth);
  const countedLogs = monthLogs.filter((log) => !log.holiday);

  const counts = countedLogs.reduce(
    (acc, log) => {
      acc[log.person] = (acc[log.person] || 0) + 1;
      return acc;
    },
    { [nameA]: 0, [nameB]: 0 },
  );

  const totalTrips = countedLogs.length;
  const difference = Math.abs(counts[nameA] - counts[nameB]);
  const lead = counts[nameA] === counts[nameB]
    ? "Perfectly balanced"
    : counts[nameA] > counts[nameB]
      ? `${nameA} is ahead by ${difference}`
      : `${nameB} is ahead by ${difference}`;

  balanceCard.innerHTML = `
    <div>${lead}</div>
    <span>${totalTrips} trip${totalTrips === 1 ? "" : "s"} logged this month (excluding holidays).</span>
  `;

  summaryLists.innerHTML = "";
  [nameA, nameB].forEach((name) => {
    const listCard = document.createElement("div");
    listCard.className = "list-card";
    const title = document.createElement("h3");
    title.textContent = `${name} (${counts[name]} trips)`;
    listCard.append(title);

    const list = document.createElement("ul");
    const personLogs = monthLogs.filter((log) => log.person === name && !log.holiday);
    if (personLogs.length === 0) {
      const empty = document.createElement("li");
      empty.textContent = "No trips logged yet.";
      list.append(empty);
    } else {
      personLogs
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((log) => {
          const item = document.createElement("li");
          item.textContent = `${formatDisplayDate(log.date)} • ${log.shift}`;
          list.append(item);
        });
    }

    listCard.append(list);
    summaryLists.append(listCard);
  });
};

const renderTable = (logs) => {
  logTable.innerHTML = "";
  const header = document.createElement("div");
  header.className = "table-row table-header";
  header.innerHTML = "<div>Date</div><div>Shift</div><div>Supervisor</div><div>Notes</div><div></div>";
  logTable.append(header);

  if (logs.length === 0) {
    const empty = document.createElement("div");
    empty.className = "table-row";
    empty.innerHTML = "<div>No entries yet.</div>";
    logTable.append(empty);
    return;
  }

  logs
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((log) => {
      const row = document.createElement("div");
      row.className = "table-row";
      row.innerHTML = `
        <div>${formatDisplayDate(log.date)}</div>
        <div>${log.shift}</div>
        <div>${log.person}</div>
        <div>${log.holiday ? "Holiday / no trip" : log.notes || "-"}</div>
        <div><button type="button" data-id="${log.id}">Remove</button></div>
      `;
      logTable.append(row);
    });
};

const refresh = () => {
  const logs = readLogs();
  const monthValue = summaryMonth.value || getMonthKey(toDateInputValue(today));
  summaryMonth.value = monthValue;
  updateBalance(logs, monthValue);
  renderTable(logs);
};

saveNamesButton.addEventListener("click", () => {
  const nameA = nameAInput.value.trim() || "Supervisor A";
  const nameB = nameBInput.value.trim() || "Supervisor B";
  saveNames([nameA, nameB]);
  setNames();
  refresh();
});

logForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const dateValue = logDate.value;
  if (!dateValue) {
    return;
  }

  const logs = readLogs();
  const entry = {
    id: crypto.randomUUID(),
    date: dateValue,
    shift: logShift.value,
    person: logPerson.value,
    notes: logNotes.value.trim(),
    holiday: logHoliday.checked,
  };

  logs.push(entry);
  saveLogs(logs);
  logForm.reset();
  logDate.value = dateValue;
  refresh();
});

summaryMonth.addEventListener("change", () => {
  refresh();
});

logTable.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  const id = button.dataset.id;
  if (!id) {
    return;
  }

  const logs = readLogs().filter((log) => log.id !== id);
  saveLogs(logs);
  refresh();
});

setNames();
logDate.value = toDateInputValue(today);
summaryMonth.value = getMonthKey(toDateInputValue(today));
refresh();
