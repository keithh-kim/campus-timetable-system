# Slotwise 🗓️

> A timetable and venue management system that prevents clashes before they happen, accounts for cross-phase travel time, and notifies everyone instantly when a session changes.

![status](https://img.shields.io/badge/status-in%20development-yellow)
![methodology](https://img.shields.io/badge/methodology-Agile%20Scrum-blue)

> **Current version: frontend-only prototype.** There is no backend yet. Data is saved in your browser, role switching stands in for logins, and notifications are shown inside the app rather than sent by email or SMS. Room names, capacities, lecturers and cohorts are placeholder data.

---

## Table of Contents
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Key Features](#key-features)
- [Campus Model](#campus-model)
- [Users](#users)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Methodology and Roadmap](#methodology-and-roadmap)
- [Contributing](#contributing)
- [Documentation](#documentation)
- [Team](#team)

---

## The Problem

Timetabling on a multi-building campus is messy:

- Venues get double-booked.
- Lecturers and student cohorts end up with overlapping sessions.
- Classes get put in rooms that are too small (or comically too big).
- Back-to-back classes in different phases leave no time to travel between them.
- Venue or time changes spread by rumor instead of reliable notifications.

## The Solution

Slotwise is an information system that models the campus layout, validates every session against clash and travel rules, and pushes change notifications to everyone affected.

## Key Features

**Core (MVP), working in the prototype**
- **Venue management:** add, edit, and delete rooms with their capacity, type, and equipment
- **Session scheduling:** create, edit, and cancel sessions, including weekly repeats and lectures shared by several cohorts
- **Clash detection:** same room, same lecturer, same student cohort
- **Travel-time validation:** warns when cross-phase back-to-back sessions leave too little gap
- **Capacity matching:** prevents allocating a room smaller than the class, counting every cohort in a shared lecture
- **Change notifications:** shows each student cohort and lecturer only the changes that affect them
- **Personal timetables:** students see their cohort's timetable and lecturers see their own
- **Room finder:** see which rooms are free at any date and time

**Not built yet**
- Backend, database, and real logins
- Sending notifications by email or SMS
- Adding or editing buildings, and modelling floors
- The Facilities/Security view
- Lecturer venue-change requests

**Stretch goals**
- Auto-generated timetables from constraints
- Exam timetable mode (no student with two exams at once)
- Room swap request workflow
- Utilisation analytics dashboard

## Campus Model

Venues are organised as a hierarchy:

```
Phase → Building → Floor → Room
```

| Phase | Buildings |
|-------|-----------|
| Phase 1 | Central Building |
| Phase 2 | MSB, STMB, Oval, Forge |

The cross-phase **travel buffer** is `TRAVEL_BUFFER_MIN` in [`frontend/src/lib/clash.ts`](frontend/src/lib/clash.ts). It is currently 15 minutes, a placeholder until it is validated with measured walking times.

## Users

| Role | What they do |
|------|--------------|
| **Timetabling Officer (Admin)** | Manages venues, creates and edits sessions, resolves clashes |
| **Lecturer** | Views schedule, requests venue changes |
| **Student** | Views personal timetable, receives change alerts, finds free rooms |
| **Facilities/Security** | Read-only view of room usage |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React, TypeScript, Vite |
| UI | shadcn/ui, Tailwind CSS |
| Routing | React Router |
| Data storage | Browser `localStorage` (no backend yet) |
| Notifications | Simulated inside the app |
| Testing | Vitest |

## Getting Started

### Prerequisites
- Git
- Node.js 22.12 or newer

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/keithh-kim/campus-timetable-system.git
cd campus-timetable-system/frontend

# 2. Install dependencies
npm install

# 3. Run the app, then open the address it prints
npm run dev
```

### Trying it out

- Use the role menu in the top bar to switch between Timetabling Officer, Lecturer, and Student. Lecturers and students also pick who they are viewing as.
- On **Schedule Session**, the **Load demo** buttons fill the form with a room clash, a travel warning, a shared lecture, and an all-clear example.
- **Reset demo data**, under the timetable, restores the original sessions and rooms.

### Running tests

```bash
cd frontend
npm test        # scheduling, notification, and venue rules
npm run lint
npm run build
```

## Project Structure

```
campus-timetable-system/
├── frontend/
│   └── src/
│       ├── lib/          # Scheduling rules and data, with no React (tests sit beside them)
│       ├── store/        # Shared app state, saved to localStorage
│       ├── pages/        # One file per screen
│       └── components/   # Screen parts; ui/ holds the shadcn components
└── README.md
```

Planned as the project grows:

```
├── backend/
├── docs/
│   ├── requirements/   # Functional, non-functional, and domain requirements
│   ├── diagrams/       # Use case, sequence, and interaction diagrams
│   ├── research/       # Interview notes, survey results, walking times
│   └── report/         # Report drafts
└── .github/            # Issue and PR templates
```

## Methodology and Roadmap

We follow **Agile (Scrum)** with 2-week sprints, because requirements are expected to evolve as we gather feedback from timetabling staff and users, and working increments let us validate early.

| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 0 | Repo setup, research, requirements, diagrams | ⬜ |
| Sprint 1 | Data model and basic room booking | ⬜ |
| Sprint 2 | Clash detection and travel buffer | ⬜ |
| Sprint 3 | Notifications, polish, testing | ⬜ |

Progress is tracked on the GitHub Projects board.

## Contributing

### Branching
- `main`: stable, demo-ready code only
- `develop`: integration branch
- `feature/<name>`: one branch per feature (e.g. `feature/clash-detection`)
- `docs/<name>`: documentation and diagram work

### Workflow
1. Branch off `develop`.
2. Commit using the convention below.
3. Open a Pull Request into `develop` and link the related requirement ID (e.g. `FR3`).
4. Get at least one teammate's approval before merging.

### Commit convention

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation or diagrams |
| `test:` | Tests |
| `refactor:` | Code cleanup, no behaviour change |
| `chore:` | Setup and config |

Example: `fix: treat back-to-back sessions as non-overlapping`

## Documentation

Not in the repository yet. Planned locations:

- Requirements: `docs/requirements/`
- Diagrams: `docs/diagrams/`
- Research and findings: `docs/research/`

## CASE Tools Used

| Purpose | Tool |
|---------|------|
| Diagramming / UML | `[draw.io / StarUML]` |
| Version control | Git and GitHub |
| Sprint planning | GitHub Projects |
| UI mockups | `[Figma]` |
| API testing | `[Postman]` |

## Team

| Name | Role |
|------|------|
| `[Name]` | Product Owner |
| `[Name]` | Scrum Master |
| `[Name]` | Developer |
| `[Name]` | Developer |

---

_Built as a Software Engineering group project at `[Institution]`, `[Year]`. This is an academic project and is not an official institutional system._