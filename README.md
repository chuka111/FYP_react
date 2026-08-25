# PunchIn — Admin & Employee Dashboard (Frontend)

The admin and employee web dashboard for PunchIn, a facial recognition attendance system. Built with Next.js, this is where the employees and admin monitor live clock-in/clock-out status and manage employee records.

> Backend repo (face recognition + API): https://github.com/chuka111/FYP.git

## Features

- **Live attendance view** — see who's currently clocked in, updated in real time via Server-Sent Events pushed from the backend, no manual refresh needed
- **Secure login** — authentication handled through Firebase
- **Employee roster management** — admin can view and manage employee records
- **Reporting** — attendance history and status overview

## Tech stack

- **Next.js (App Router)** — frontend framework
- **React** — UI components
- **Firebase Authentication** — login and session handling
- **Server-Sent Events (SSE)** — live updates from the FastAPI backend, without polling

## Architecture

This frontend talks to the [PunchIn backend](https://github.com/chuka111/FYP.git) over REST, plus an SSE connection for live updates. The backend handles all the actual face recognition and liveness detection on the Raspberry Pi; this repo is purely the interface that employees and admins interact with.

```
Raspberry Pi (camera + face recognition) - FastAPI backend (clock events, SQLite) - SSE stream → Next.js dashboard
```

## Project background

Part of my final year project for a BEng (Hons) in Software and Electronic Engineering was writing a full end to end attendance system spanning embedded hardware, computer vision, and this web dashboard. I focused this side of the project on making the live status feel genuinely real-time for users rather than a static, refresh to see updates on the page.
