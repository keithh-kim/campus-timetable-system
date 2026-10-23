# Slotwise 🗓️

> A timetable and venue management system that prevents clashes before they happen, accounts for cross-phase travel time, and notifies everyone instantly when a session changes.

![status](https://img.shields.io/badge/status-in%20development-yellow)
![methodology](https://img.shields.io/badge/methodology-Agile%20Scrum-blue)

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

**Core (MVP)**
- **Venue management:** buildings, rooms, capacity, type, and equipment
- **Session scheduling:** create, edit, and cancel sessions
- **Clash detection:** same room, same lecturer, same student cohort
- **Travel-time validation:** warns when cross-phase back-to-back sessions leave too little gap
- **Capacity matching:** prevents allocating a room smaller than the class
- **Change notifications:** alerts affected students and lecturers when a session changes
- **Room finder:** see which rooms are free right now

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

The cross-phase **travel buffer** is configurable (default: `[X] minutes`, to be validated with measured walking times; see `docs/research/`).

## Users

| Role | What they do |
|------|--------------|
| **Timetabling Officer (Admin)** | Manages venues, creates and edits sessions, resolves clashes |
| **Lecturer** | Views schedule, requests venue changes |
| **Student** | Views personal timetable, receives change alerts, finds free rooms |
| **Facilities/Security** | Read-only view of room usage |

## Tech Stack

> _TBD: fill in once the team decides._

| Layer | Choice |
|-------|--------|
| Frontend | `[e.g. React / plain HTML+JS]` |
| Backend | `[e.g. Python (Flask/FastAPI) / Node.js (Express)]` |
| Database | `[e.g. PostgreSQL / MySQL / SQLite]` |
| Notifications | `[e.g. Email via SMTP / SMS API]` |
| Testing | `[e.g. pytest / Jest, Postman]` |

## Getting Started

> _Update these steps once the backend and frontend exist._

### Prerequisites
- Git
- `[Language runtime and version]`
- `[Database]`

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/<owner-username>/slotwise.git
cd slotwise

# 2. Switch to the develop branch
git checkout develop

# 3. Configure environment variables
cp .env.example .env
# then edit .env with your local settings

# 4. Install dependencies
# [add commands here]

# 5. Run the app
# [add commands here]
```

### Running tests

```bash
# [add test command here]
```

## Project Structure

```
slotwise/
├── docs/
│   ├── requirements/   # Functional, non-functional, and domain requirements
│   ├── diagrams/       # Use case, sequence, and interaction diagrams
│   ├── research/       # Interview notes, survey results, walking times
│   └── report/         # Report drafts
├── src/
│   ├── backend/
│   └── frontend/
├── tests/
├── .github/            # Issue and PR templates
└── README.md
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

- Requirements: [`docs/requirements/`](docs/requirements/)
- Diagrams: [`docs/diagrams/`](docs/diagrams/)
- Research and findings: [`docs/research/`](docs/research/)

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