// Inject “Attendance Status” header
const table = document.getElementById("masterGridTable");
const headerRow = table?.querySelector("tr");
if (headerRow) {
  const th = document.createElement("th");
  th.textContent = "Attendance Status";
  th.style.textAlign = "center";
  headerRow.appendChild(th);
}

// Now process rows and append status cells
const rows = document.querySelectorAll("#masterGridTable tr");

// helper to parse ints (defaults to 0)
const getInt = (cell) => parseInt(cell?.textContent.trim(), 10) || 0;

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  const cells = row.querySelectorAll("td");
  if (cells.length < 9) continue;

  const subject = cells[2].textContent.trim().toLowerCase();
  // skip dates, paid rows or sessions
  if (
    !isNaN(Date.parse(subject)) ||
    subject.includes("paid") ||
    subject.includes("session")
  ) {
    continue;
  }

  const delivered = getInt(cells[5]);
  const attended = getInt(cells[6]);
  const dutyLeave = getInt(cells[11]);
  const medicalLeave = getInt(cells[12]);

  if (delivered === 0) {
    console.log(`Subject: ${subject}, ❌ Invalid data`);
    continue;
  }

  // Total effective attended
  const A = attended + dutyLeave + medicalLeave;
  // D = delivered, x = max bunks: solve A/(D+x) >= .75 → x <= A/.75 - D
  const bunkable = Math.floor(A / 0.85 - delivered);

  let status;
  if (bunkable > 0) {
    status = `🟢 Ahead by ${bunkable} classes (Can bunk)`;
  } else if (bunkable === 0) {
    status = `🟠 Exactly at 85%`;
  } else {
    // deficit case: how many to attend? solve (A+y)/(D+y)>=.75 → y >= (0.75 D - A)/(1 - .75)
// I change this for new 85% certiria, later i will add custom certiria changer option.
    const need = Math.ceil((0.85 * delivered - A) / 0.25);
    status = `🔴 Attend ${need} more to reach 85%`;
  }

  // Create the status cell
  const td = document.createElement("td");
  td.textContent = status;
  td.style.textAlign = "center";
  td.style.color = bunkable > 0 ? "green" : bunkable === 0 ? "orange" : "red";

  // Copy the background color from the first data cell
  const firstCell = cells[0];
  if (firstCell) {
    const bg = window.getComputedStyle(firstCell).backgroundColor;
    td.style.backgroundColor = bg;
  }

  row.appendChild(td);
}
