export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  mode: string;
  category: string;
  transactionId?: string;
}

export interface StatementUpload {
  id: string;
  fileName: string;
  uploadDate: string;
  transactions: Transaction[];
  totalCredit: number;
  totalDebit: number;
}

const STORE_KEY = "fintrack_statements";

function getStore(userId: string): StatementUpload[] {
  const raw = localStorage.getItem(`${STORE_KEY}_${userId}`);
  return raw ? JSON.parse(raw) : [];
}

function saveStore(userId: string, data: StatementUpload[]) {
  localStorage.setItem(`${STORE_KEY}_${userId}`, JSON.stringify(data));
}

export function getStatements(userId: string): StatementUpload[] {
  return getStore(userId);
}

export function addStatement(userId: string, upload: StatementUpload) {
  const store = getStore(userId);
  store.unshift(upload);
  saveStore(userId, store);
}

export function deleteStatement(userId: string, id: string) {
  const store = getStore(userId).filter((s) => s.id !== id);
  saveStore(userId, store);
}

//
// ---------------- PREFIX DETECTION ----------------
//
function getTxnPrefix(text: string): string {
  const txn = (text || "").toUpperCase();

  if (
    txn.includes("UPI") ||
    txn.includes("GPAY") ||
    txn.includes("PHONEPE") ||
    txn.includes("PAYTM") ||
    txn.includes("@")
  ) return "UPI";

  if (txn.includes("NEFT")) return "NEFT";
  if (txn.includes("IMPS")) return "IMPS";

  if (
    txn.includes("CARD") ||
    txn.includes("POS") ||
    txn.includes("SWIPE") ||
    txn.includes("VISA") ||
    txn.includes("MASTER")
  ) return "CARD";

  return "TXN";
}

//
// ---------------- DESCRIPTION BASED ----------------
//
function categorizeByDescription(description: string): string {
  const desc = (description || "").toLowerCase();

  if ([
    "swiggy","zomato","restaurant","cafe","food","blinkit",
    "dominos","mcdonald","kfc","pizza","burger","hotel",
    "bakery","dining","eat","kitchen","biryani","canteen"
  ].some(w => desc.includes(w))) return "Food";

  if ([
    "amazon","flipkart","myntra","meesho","ajio","nykaa",
    "snapdeal","shopping","mart","store","purchase","buy",
    "mall","retail","bigbasket","grofer","dmart"
  ].some(w => desc.includes(w))) return "Shopping";

  if ([
    "netflix","spotify","prime","hotstar","youtube","zee5",
    "sonyliv","subscription","entertainment","movie","cinema",
    "pvr","inox","bookmyshow","gaming","steam"
  ].some(w => desc.includes(w))) return "Entertainment";

  if ([
    "uber","ola","irctc","makemytrip","redbus","yatra",
    "cleartrip","airline","flight","train","bus","travel",
    "rapido","cab","auto","metro","toll","fuel","petrol"
  ].some(w => desc.includes(w))) return "Travel";

  if (["rent","landlord","housing","lease","pg ","hostel"]
    .some(w => desc.includes(w))) return "Rent";

  if ([
    "electricity","water","gas","broadband","airtel","jio",
    "bsnl","vi ","vodafone","idea","recharge","bill","utility",
    "tata power","bescom","mseb","internet","wifi"
  ].some(w => desc.includes(w))) return "Utilities";

  
  if ([
    "hospital","pharmacy","medical","doctor","apollo","1mg",
    "netmeds","pharmeasy","clinic","health"
  ].some(w => desc.includes(w))) return "Healthcare";

  if ([
    "school","college","course","fees","tuition","education"
  ].some(w => desc.includes(w))) return "Education";

  
  if ([
    "salary","income","interest","dividend","bonus","stipend",
    "refund","cashback"
  ].some(w => desc.includes(w))) return "Income";

  if ([
    "emi","loan","insurance","lic","sip",
    "mutual fund","investment"
  ].some(w => desc.includes(w))) return "Finance & Investment";

  return "Miscellaneous";

  
}

//
// ---------------- MAIN CATEGORIZATION ----------------
//
function categorize(transactionId: string, description: string): string {
  const prefix = getTxnPrefix(transactionId);
  const desc = (description || "").toLowerCase();

  if (prefix === "NEFT") {
    if (["salary","income","bonus","stipend","refund"].some(w => desc.includes(w)))
      return "Income";

    if (["rent","lease"].some(w => desc.includes(w)))
      return "Rent";

    if (["emi","loan","insurance"].some(w => desc.includes(w)))
      return "Finance & Investment";

    return "Bank Transfer";
  }

  if (prefix === "IMPS") {
    if (["rent","lease","pg","hostel"].some(w => desc.includes(w)))
      return "Rent";

    if (["salary","income","freelance","stipend"].some(w => desc.includes(w)))
      return "Income";

    return "Transfer";
  }

  if (prefix === "CARD") {
    return categorizeByDescription(description);
  }

  return categorizeByDescription(description);
}

//
// ---------------- CSV PARSER ----------------
//
export function parseCSV(content: string): Transaction[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const cols = header.split(/,|\t/).map((c) => c.trim().replace(/"/g, ""));

  const txnIdIdx = cols.findIndex((c) =>
    c.includes("txn") ||
    c.includes("ref") ||
    c.includes("id") ||
    c.includes("chq") ||
    c.includes("utr")
  );

  const dateIdx = cols.findIndex((c) => c.includes("date"));

  const descIdx = cols.findIndex((c) =>
    c.includes("narration") ||
    c.includes("description") ||
    c.includes("particular")
  );

  const debitIdx = cols.findIndex((c) =>
    c.includes("debit") || c.includes("withdrawal")
  );

  const creditIdx = cols.findIndex((c) =>
    c.includes("credit") || c.includes("deposit")
  );

  const amountIdx = cols.findIndex((c) =>
    c === "amount" || c.includes("amount")
  );

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]
      .split(/,|\t/)
      .map((v) => v.trim().replace(/"/g, ""));

    if (values.length < 2) continue;

    // ✅ CRITICAL FIX
    const transactionId =
      txnIdIdx >= 0 ? values[txnIdIdx] : values[0];

    const date = dateIdx >= 0 ? values[dateIdx] : "";
    const description =
      descIdx >= 0 ? values[descIdx] : values[2] || "";

    let amount = 0;
    let type: "credit" | "debit" = "debit";

    if (debitIdx >= 0 && creditIdx >= 0) {
      const debitVal = parseFloat(values[debitIdx]?.replace(/[^0-9.-]/g, "") || "0");
      const creditVal = parseFloat(values[creditIdx]?.replace(/[^0-9.-]/g, "") || "0");

      if (debitVal > 0) {
        amount = debitVal;
        type = "debit";
      } else if (creditVal > 0) {
        amount = creditVal;
        type = "credit";
      } else continue;
    } else if (amountIdx >= 0) {
      amount = parseFloat(values[amountIdx]?.replace(/[^0-9.-]/g, "") || "0");

      if (amount < 0) {
        amount = Math.abs(amount);
        type = "debit";
      } else {
        type = "credit";
      }
    } else continue;

    if (amount === 0) continue;

    const mode = getTxnPrefix(transactionId);
    const category = categorize(transactionId, description);

    transactions.push({
      date,
      description,
      amount,
      type,
      mode,
      category,
      transactionId,
    });
  }

  return transactions;
}