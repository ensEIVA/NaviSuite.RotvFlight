import { Outlet } from "react-router-dom";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import "./AppLayout.css";
import { AppShell } from "@mantine/core";

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
    <AppShell header={{ height: 52 }} navbar={{ width: 300, breakpoint: "sm" }}>
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Navbar>
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>

  );
}
