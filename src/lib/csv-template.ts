export const CSV_TEMPLATE_HEADERS = ["Date", "Description", "Debit", "Credit"];

export const CSV_TEMPLATE_CONTENT = `Transaction ID,Date,Description,Debit,Credit,Balance
OB-20260501,01-05-2026,Opening Balance,,,15673.12
NEFT-20260501-0001,01-05-2026,Salary Credit - Nexus Solutions Pvt Ltd,,67415.5,83088.62
UPI-20260504-0005,04-05-2026,Mobile Recharge,334.76,,91570.52
CARD-20260505-0007,05-05-2026,Grocery - FreshMart,2848.78,,60721.74
ATM-20260527-0034,27-05-2026,ATM Cash Withdrawal,1714.61,,44827.83
IMPS-20260528-0036,28-05-2026,IMPS Credit - Self Transfer,,30787.58,75452.88`;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCSVStructure(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = content.trim().split("\n");
  if (lines.length < 2) {
    return { valid: false, errors: ["File is empty or has no data rows."], warnings };
  }

  const headerLine = lines[0].toLowerCase();
  const cols = headerLine.split(",").map((c) => c.trim().replace(/"/g, ""));

  // Check for required columns
  const hasDate = cols.some((c) => c.includes("date"));
  const hasDesc = cols.some((c) =>
    c.includes("narration") || c.includes("description") || c.includes("particular") || c.includes("remark") || c.includes("detail")
  );
  const hasDebit = cols.some((c) => c.includes("debit") || c.includes("withdrawal"));
  const hasCredit = cols.some((c) => c.includes("credit") || c.includes("deposit"));
  const hasAmount = cols.some((c) => c === "amount" || c.includes("amount"));

  if (!hasDate) errors.push("Missing 'Date' column.");
  if (!hasDesc) warnings.push("No description column found (narration/description/particular). Column 2 will be used.");
  if (!hasDebit && !hasCredit && !hasAmount) {
    errors.push("Missing amount columns. Need 'Debit'/'Credit' columns or an 'Amount' column.");
  }

  // Validate data rows
  let emptyRows = 0;
  let malformedRows = 0;
  const headerColCount = cols.length;

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row) { emptyRows++; continue; }
    const values = row.split(",");
    if (values.length < 2) malformedRows++;
    if (values.length !== headerColCount) {
      malformedRows++;
    }
  }

  if (emptyRows > 0) warnings.push(`${emptyRows} empty row(s) found and will be skipped.`);
  if (malformedRows > 0) warnings.push(`${malformedRows} row(s) have mismatched column count.`);

  return { valid: errors.length === 0, errors, warnings };
}

export function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE_CONTENT], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bank_statement_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}