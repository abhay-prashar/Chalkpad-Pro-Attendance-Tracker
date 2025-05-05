const rows = document.querySelectorAll("#masterGridTable tr");

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  const cells = row.querySelectorAll("td");

  if (cells.length < 9) continue;
  const subject = cells[2].textContent.trim();

  if (
    !isNaN(Date.parse(subject)) ||
    subject.toLowerCase().includes("paid") ||
    subject.toLowerCase().includes("session")
  ) {
    break;
  }

  const delivered = parseInt(cells[5].textContent.trim());
  const attended = parseInt(cells[6].textContent.trim());
  const dutyLeave = parseInt(cells[8].textContent.trim());
  const medicalLeave = parseInt(cells[9].textContent.trim());

  if (isNaN(delivered) || isNaN(attended) || delivered === 0) {
    console.log(`Subject: ${subject}, ❌ Invalid data`);
    continue;
  }

  const totalAttended = attended + dutyLeave + medicalLeave;
  const required = Math.ceil(0.75 * delivered);
  const bunkable = totalAttended - required;

  let status;
  if (bunkable > 0) {
    status = `🟢 Ahead by ${bunkable} classes (Can bunk)`;
  } else if (bunkable === 0) {
    status = `🟠 Exactly at 75%`;
  } else {
    status = `🔴 Attend ${Math.abs(bunkable)} more to reach 75%`;
  }

  const statusCell = document.createElement("td");
  statusCell.textContent = status;
  if (bunkable > 0) statusCell.style.color = "green";
  else if (bunkable === 0) statusCell.style.color = "orange";
  else statusCell.style.color = "red";
  row.appendChild(statusCell);
}
