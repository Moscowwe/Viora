import { useDatabase } from "@/hooks/useDatabase";

export const seedData = async (db: ReturnType<typeof useDatabase>, userId: string | undefined) => {
  console.log("Starting data wipe...");
  
  // Wipe existing data
  await db.from("transactions").delete().neq("id", "none");
  await db.from("staff").delete().neq("id", "none");
  await db.from("children").delete().neq("id", "none");
  await db.from("archive_reports").delete().neq("id", "none");
  await db.from("audit_logs").delete().neq("id", "none");

  console.log("Wipe complete. Seeding children...");

  const arabicFirstNames = [
    "أحمد", "محمد", "ياسين", "عمر", "علي", "ليلى", "فاطمة", "مريم", "نور", "سلمى",
    "يوسف", "إبراهيم", "ادم", "خديجة", "زينب", "حمزة", "سيف", "جنى", "ريماس", "تاليا",
    "يحيى", "مصطفى", "كريم", "ملك", "حبيبة", "زياد", "إياد", "لجين", "سارة", "هنا",
    "باسل", "مازن", "إسماعيل", "حفصة", "عائشة", "رودينا", "كنزي", "ياسمينا", "فريدة", "حازم",
    "تامر", "شريف", "رامي", "نهى", "داليا", "رنا", "علا", "مروة", "عبير", "إيمان"
  ];

  const arabicLastNames = [
    "منصور", "زيدان", "عز الدين", "النجار", "مرسي", "السيد", "عامر", "صالح", "عثمان", "إبراهيم",
    "عبد الله", "زكي", "هاشم", "جمعة", "القاضي", "رزق", "كامل", "حامد", "شاكر", "سالم"
  ];

  const groups = ["Pre-K", "Toddlers", "Infants", "Preschool 1", "Preschool 2"];
  const statuses = ["Paid", "Partial", "Unpaid"];

  // Seed 50 Children
  const childrenToInsert = [];
  for (let i = 0; i < 50; i++) {
    const firstName = arabicFirstNames[i % arabicFirstNames.length];
    const lastName = arabicLastNames[Math.floor(Math.random() * arabicLastNames.length)];
    const parentName = arabicFirstNames[Math.floor(Math.random() * arabicFirstNames.length)] + " " + lastName;
    const feeAmount = 3000 + (Math.floor(Math.random() * 10) * 100);
    const status = statuses[i % 3]; // Rotate statuses for variety
    
    let paidAmount = 0;
    if (status === "Paid") paidAmount = feeAmount;
    else if (status === "Partial") paidAmount = feeAmount / 2;

    const child = {
      id: crypto.randomUUID(),
      name: `${firstName} ${lastName}`,
      age: (Math.floor(Math.random() * 5) + 1).toString(),
      group_name: groups[Math.floor(Math.random() * groups.length)],
      parent_name: parentName,
      phone: "01" + Math.floor(100000000 + Math.random() * 900000000),
      payment_status: status,
      fee_amount: feeAmount,
      paid_amount: paidAmount,
      discount_amount: 0
    };
    childrenToInsert.push(child);
    await db.from("children").insert(child);

    // Create transaction for payments
    if (paidAmount > 0) {
      await db.from("transactions").insert({
        id: crypto.randomUUID(),
        type: 'income',
        description: `Fee Payment - ${child.name}`,
        amount: paidAmount,
        category: 'Tuition Fees',
        date: new Date().toISOString().slice(0, 10),
        created_by: userId
      });
    }
  }

  console.log("Children seeded. Seeding staff...");

  // Seed 20 Staff
  const staffToInsert = [];
  const roles = [
    { name: "Teacher", salary: 5000 },
    { name: "Assistant Teacher", salary: 3500 },
    { name: "Administrator", salary: 7000 },
    { name: "Cleaner", salary: 2500 }
  ];

  for (let i = 0; i < 20; i++) {
    const role = roles[i % roles.length];
    const firstName = arabicFirstNames[(i + 20) % arabicFirstNames.length];
    const lastName = arabicLastNames[Math.floor(Math.random() * arabicLastNames.length)];

    const staffMember = {
      id: crypto.randomUUID(),
      name: `${firstName} ${lastName}`,
      role: role.name,
      phone: "01" + Math.floor(100000000 + Math.random() * 900000000),
      salary: role.salary + (Math.floor(Math.random() * 5) * 100)
    };
    staffToInsert.push(staffMember);
    await db.from("staff").insert(staffMember);
  }

  console.log("Adding monthly expenses...");
  const expenses = [
    { id: crypto.randomUUID(), type: 'expense', description: 'Rent', amount: 15000, category: 'Utilities', date: new Date().toISOString().slice(0, 10), created_by: userId },
    { id: crypto.randomUUID(), type: 'expense', description: 'Electricity', amount: 2000, category: 'Utilities', date: new Date().toISOString().slice(0, 10), created_by: userId },
    { id: crypto.randomUUID(), type: 'expense', description: 'Cleaning Supplies', amount: 1200, category: 'Supplies', date: new Date().toISOString().slice(0, 10), created_by: userId }
  ];

  for (const exp of expenses) {
    await db.from("transactions").insert(exp);
  }

  console.log("Seeding complete successfully!");
};
