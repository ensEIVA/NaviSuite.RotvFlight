import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import './AppLayout.css';

// ---------------------------------------------------------------------------
// AppLayout — OpenBridge light theme shell
//
// Structure:
//   <div.app-layout>
//     <header.topbar>          ← fixed, 48px
//     <div.app-body>
//       <nav.sidebar>          ← 320px wide, full remaining height
//       <main.main-content>    ← fills rest, page bg colour
//
// The Mantine AppShell is removed. All layout is vanilla CSS.
// StepperNav is removed — navigation lives in the Sidebar.
// ---------------------------------------------------------------------------

export function AppLayout() {
  return (
    <div className="app-layout">
      {/* Fixed topbar — always on top */}
      <Header />

      {/* Body: sidebar + routed content side-by-side */}
      <div className="app-body">
        <Sidebar />
        <main className="main-content" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
