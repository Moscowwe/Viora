# VIORA — Next-Gen Preschool & Nursery Management Cloud

![VIORA Platform](public/logo-light.png)

VIORA is an all-in-one cloud OS designed for modern kindergarten, nursery, and preschool management. It unifies digital child records, automated tuition billing, staff payroll, and seasonal summer camp operations in a seamless, secure workspace.

## ✨ Key Features

- **🌐 Single-Screen Cinematic Landing & Login**: Zero-scroll layout with rotating cosmic globe background, dynamic capability capsules, and spotlight-tracked login card.
- **⚡ Synchronous Shuttering Sidebar**: In-flow adaptive navigation dock (collapsing from 260px to 72px) that smoothly synchronizes with dashboard content without overlapping.
- **📊 Animated Financial Performance**: Interactive toggle between Bar and Monotone Wave Area charts with custom SVG gradients and live statistics.
- **👶 Student & Attendance Management**: Real-time student check-ins, medical notes, guardian contacts, and status tracking.
- **💳 Automated Tuition & Cashflow**: Smart fee schedules, installment tracking, sibling discounts, and live financial ledger.
- **💼 Staff Payroll & HR**: Educator salary disbursements, advance deductions, and work shift logs.
- **🏕️ Summer Camp Mode**: Instant toggle between regular preschool terms and seasonal activities.
- **👑 SuperAdmin Ecosystem**: Full tenant lifecycle oversight, subscription tiers, and system metrics.
- **🌍 Bilingual & RTL Ready**: Seamless one-click switching between English and Arabic.

## 🚀 Tech Stack

- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS with custom burgundy/crimson palette
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Data & Charts**: Recharts, TanStack Query
- **Backend & Auth**: Supabase

## 🛠️ Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Moscowwe/Viora.git
   cd Viora
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## 🌐 Deploy to Vercel

The project includes an optimized `vercel.json` configured for client-side single page app routing. You can deploy directly with:
```bash
npx vercel
```
Or import `Moscowwe/Viora` in your Vercel Dashboard.
