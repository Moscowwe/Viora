import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { Transaction, Staff, Child } from '@/types';

export const exportProfessionalExcel = async (transactions: Transaction[], staff: Staff[], children: Child[]) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Viora System';
  workbook.lastModifiedBy = 'Viora System';
  workbook.created = new Date();

  // --- SHEET 1: SUMMARY (لوحة التحكم) ---
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric / المؤشر', key: 'metric', width: 40 },
    { header: 'Value / القيمة', key: 'value', width: 25 },
  ];

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalSalaries = transactions.filter(t => t.type === 'expense' && t.category === 'Salaries').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const otherExpenses = transactions.filter(t => t.type === 'expense' && t.category !== 'Salaries').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpenses = totalSalaries + otherExpenses;
  const netProfit = totalIncome - totalExpenses;
  const totalDiscounts = children.reduce((sum, c) => sum + Number(c.discount_amount || 0), 0);

  summarySheet.addRows([
    { metric: 'Viora System Financial Audit Summary / ملخص مالي شامل', value: '' },
    { metric: 'Report Generation Date / تاريخ إصدار التقرير', value: new Date().toLocaleDateString() },
    {},
    { metric: 'Finance Overview / نظرة عامة على المالية', value: '' },
    { metric: 'Total Income / إجمالي الدخل', value: totalIncome },
    { metric: 'Total Salaries (Staff) / إجمالي رواتب الموظفين', value: totalSalaries },
    { metric: 'Other Operating Expenses / مصروفات تشغيلية أخرى', value: otherExpenses },
    { metric: 'Total Combined Expenses / إجمالي المصروفات الكلي', value: totalExpenses },
    { metric: 'Total Discounts Given / إجمالي الخصومات الممنوحة', value: totalDiscounts },
    { metric: 'Net Cash Position (Profit/Loss) / صافي الربح والخسارة', value: netProfit },
    {},
    { metric: 'Statistics / إحصائيات عامة', value: '' },
    { metric: 'Total Registered Students / إجمالي الطلاب', value: children.length },
    { metric: 'Total Staff Members / إجمالي الموظفين', value: staff.length },
    { metric: 'Total Monthly Transactions / إجمالي العمليات', value: transactions.length },
  ]);

  // Styling Summary
  summarySheet.getRow(1).font = { bold: true, size: 16, color: { argb: '003366' } };
  [5, 6, 7, 8, 9].forEach(rowIdx => {
    summarySheet.getRow(rowIdx).font = { bold: true };
    summarySheet.getCell(`B${rowIdx}`).numFmt = '#,##0 "EGP"';
  });
  summarySheet.getRow(10).font = { bold: true, size: 14, color: { argb: netProfit >= 0 ? '008000' : 'FF0000' } };
  summarySheet.getCell('B10').numFmt = '#,##0 "EGP"';
  [4, 12].forEach(rowIdx => {
    summarySheet.getRow(rowIdx).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
    summarySheet.getRow(rowIdx).font = { bold: true };
  });

  // --- SHEET 2: ALL TRANSACTIONS (سجل العمليات التفصيلي) ---
  const txSheet = workbook.addWorksheet('Transactions');
  txSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Description', key: 'description', width: 45 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'System ID', key: 'id', width: 30 }
  ];

  const txRows = transactions.map(t => ({
    date: t.date,
    type: t.type === 'income' ? 'Income' : 'Expense',
    category: t.category,
    description: t.description,
    amount: Number(t.amount),
    id: t.id
  }));
  txSheet.addRows(txRows);

  txSheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003366' } };
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center' };
  });
  txSheet.autoFilter = 'A1:E1';
  txSheet.views = [{ state: 'frozen', ySplit: 1 }];
  txSheet.getColumn('E').numFmt = '#,##0 "EGP"';
  
  // Conditional color mapping
  const txCount = txRows.length + 1;
  txSheet.addConditionalFormatting({
    ref: `B2:B${txCount}`,
    rules: [
      { type: 'expression', formulae: ['B2="Income"'], priority: 1, style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EBF1DE' } }, font: { color: { argb: '008000' } } } },
      { type: 'expression', formulae: ['B2="Expense"'], priority: 2, style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FDE9D9' } }, font: { color: { argb: 'FF0000' } } } }
    ]
  });

  // --- SHEET 3: STAFF PAYROLL (سجل رواتب الموظفين) ---
  const salarySheet = workbook.addWorksheet('Staff Payroll');
  salarySheet.columns = [
    { header: 'Employee Name / اسم الموظف', key: 'name', width: 35 },
    { header: 'Base Salary / الراتب الأساسي', key: 'base', width: 20 },
    { header: 'Amount Paid / المبلغ المدفوع', key: 'paid', width: 20 },
    { header: 'Payment Date / التاريخ', key: 'date', width: 15 }
  ];

  const payrollData = transactions
    .filter(t => t.type === 'expense' && t.category === 'Salaries')
    .map(t => {
      const eName = t.description.replace('Salary - ', '');
      const sMember = staff.find(s => s.name === eName);
      return {
        name: eName,
        base: sMember ? sMember.salary : 'N/A',
        paid: Number(t.amount),
        date: t.date
      };
    });
  
  salarySheet.addRows(payrollData);
  salarySheet.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003366' } };
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
  });
  salarySheet.getColumn('B').numFmt = '#,##0 "EGP"';
  salarySheet.getColumn('C').numFmt = '#,##0 "EGP"';

  // --- SHEET 4: STUDENT TUITION (سجل تحصيل الرسوم) ---
  const studentSheet = workbook.addWorksheet('Student Tuition');
  studentSheet.columns = [
    { header: 'Student Name / اسم الطالب', key: 'name', width: 35 },
    { header: 'Assigned Fee / الرسوم المقررة', key: 'fee', width: 20 },
    { header: 'Amount Collected / المبلغ المحصل', key: 'collected', width: 20 },
    { header: 'Discount / الخصم', key: 'discount', width: 15 },
    { header: 'Payment Date / التاريخ', key: 'date', width: 15 }
  ];

  const tuitionData = transactions
    .filter(t => t.type === 'income' && t.category === 'Tuition Fees')
    .map(t => {
      const cName = t.description.replace('Tuition - ', '');
      const child = children.find(c => c.name === cName);
      return {
        name: cName,
        fee: child ? child.fee_amount : 'N/A',
        collected: Number(t.amount),
        discount: child ? child.discount_amount : 0,
        date: t.date
      };
    });
  
  studentSheet.addRows(tuitionData);
  studentSheet.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003366' } };
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
  });
  studentSheet.getColumn('B').numFmt = '#,##0 "EGP"';
  studentSheet.getColumn('C').numFmt = '#,##0 "EGP"';
  studentSheet.getColumn('D').numFmt = '#,##0 "EGP"';

  // DOWNLOAD
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Viora_Full_Audit_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
