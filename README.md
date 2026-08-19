# pvault

{
  "appName": "PVault",
  "appType": "Progressive Web App (PWA) - mobile-first",
  "oneLiner": "PVault is an offline-first mobile vault that organizes AI work by Project, saving Prompts & AI Tools side-by-side for fast reuse, export, & project workflows.",
  "summary": "PVault is a lightweight PWA that lets users create Projects (folders) and within each Project store two distinct collections: Prompts and AI Tools. Everything is stored locally using IndexedDB (Dexie.js recommended). Users can create tags, search, favorite, export bundles of prompts as .txt/.json, and install the app to their home screen. No cloud sync in MVP.",
  "problemStatement": "AI users stash prompts across notes, docs, screenshots, and bookmarks. Context is lost, discoverability is weak, and tools/resources are scattered. Users need a simple workspace to keep related prompts & tools together by project so they can find & reuse them fast.",
  "targetUsers": [
    "AI enthusiasts & hobbyists",
    "Content creators & social media managers",
    "Freelancers using AI for client work",
    "Students & researchers experimenting with AI prompts"
  ],
  "coreGoal": "Provide an offline, privacy-first, project-based workspace to save, organize, search, export, & reuse AI prompts & tools on mobile devices.",
  "constraints": [
    "Offline-first, no backend or cloud sync in MVP",
    "IndexedDB used for all persistence",
    "No OCR in MVP",
    "Simple, fast UX on mobile browsers",
    "Small install size, fast caching via Service Worker"
  ],
  "dataModel": {
    "stores": {
      "projects": {
        "description": "Top-level containers (folders) that group prompts & tools together.",
        "fields": {
          "id": "UUID",
          "name": "string",
          "description": "string (optional)",
          "tags": "array<string>",
          "createdAt": "timestamp",
          "updatedAt": "timestamp"
        },
        "indexes": ["name", "tags", "createdAt"]
      },
      "prompts": {
        "description": "A prompt entry that belongs to a project.",
        "fields": {
          "id": "UUID",
          "projectId": "UUID (references projects.id)",
          "title": "string",
          "content": "string",
          "tags": "array<string>",
          "category": "string (e.g., Writing, Code, Outreach)",
          "createdAt": "timestamp",
          "updatedAt": "timestamp",
          "lastUsedAt": "timestamp (null if never used)",
          "usageCount": "integer (default 0)",
          "isFavorite": "boolean"
        },
        "indexes": ["projectId", "title", "tags", "lastUsedAt", "isFavorite"]
      },
      "tools": {
        "description": "AI tools, links, or services related to a project.",
        "fields": {
          "id": "UUID",
          "projectId": "UUID (references projects.id)",
          "name": "string",
          "url": "string",
          "category": "string (e.g., Image, Text, Video, Workflow)",
          "notes": "string (optional)",
          "tags": "array<string>",
          "createdAt": "timestamp",
          "updatedAt": "timestamp"
        },
        "indexes": ["projectId", "name", "category", "tags"]
      },
      "exports": {
        "description": "History of exports created by user.",
        "fields": {
          "id": "UUID",
          "projectId": "UUID (optional)",
          "name": "string (user-given filename)",
          "format": "string (txt|json)",
          "promptIds": "array<UUID>",
          "createdAt": "timestamp",
          "fileSize": "integer (bytes, optional)"
        },
        "indexes": ["projectId", "createdAt"]
      },
      "settings": {
        "description": "Simple local settings for the PWA.",
        "fields": {
          "theme": "string (light|dark|system)",
          "sortPreference": "string (mostRecent|mostUsed|alpha)",
          "protectWithPIN": "boolean",
          "pinHash": "string (optional, stored client-side hashed)"
        }
      }
    },
    "relations": [
      "projects 1..* prompts",
      "projects 1..* tools",
      "projects 0..* exports"
    ]
  },
  "featureList": {
    "mustHave": [
      "Create / Edit / Delete Projects",
      "Create / Edit / Delete Prompts inside a Project",
      "Create / Edit / Delete Tools inside a Project",
      "Project-level tabs: Prompts & Tools",
      "Tags and categories for prompts & tools",
      "Search (within project by default, option to search all projects)",
      "Favorites for quick access",
      "Prompt usage tracking (usageCount, lastUsedAt)",
      "Export selected prompts to .txt and .json",
      "PWA installability (manifest.json, Service Worker)",
      "IndexedDB persistence with Dexie.js wrapper",
      "Responsive mobile-first UI"
    ],
    "niceToHave (phase 2)": [
      "Bulk import/export (JSON backup & restore)",
      "Project tags & color labels",
      "Light analytics: top prompts per project",
      "Dark mode toggle",
      "Local encrypted backup file (user downloads and stores)",
      "Cross-project search & filtering"
    ],
    "future (phase 3+)": [
      "OCR screenshot capture & prompt extraction",
      "Semantic search (embeddings) & smart suggestions",
      "Playbooks / workflows that chain prompts & tools",
      "Cloud sync & multi-device backup (optional, authenticated)",
      "Team sharing & workspace collaboration",
      "Marketplace for public playbooks"
    ]
  },
  "uiSpecification": {
    "global": {
      "layout": "mobile-first single-column, simple top nav, bottom action bar for core actions",
      "typography": "clean, high-contrast, big tappable targets",
      "designSystem": "Tailwind CSS utility tokens (or equivalent)",
      "accessibility": "tap targets >=44px, contrast ratio >=4.5:1"
    },
    "screens": {
      "projectsList": {
        "description": "Landing screen showing all Projects (folders).",
        "elements": [
          "Header with app name & settings",
          "Search bar (search projects & global)",
          "List of project cards (name, description, tag chips, quick counts: prompts/tools)",
          "+ New Project floating action button"
        ]
      },
      "projectView": {
        "description": "Project container with two tabs.",
        "tabs": [
          {
            "name": "Prompts",
            "elements": [
              "Search bar (scoped to project)",
              "Filter chips (tags, categories)",
              "List of prompt items (title, excerpt, favorite star, lastUsedAt)",
              "+ Add Prompt button"
            ]
          },
          {
            "name": "Tools",
            "elements": [
              "Search bar (scoped to project)",
              "Filter chips (category, tags)",
              "List of tools (name, link icon, notes preview)",
              "Add Tool button"
            ]
          }
        ]
      },
      "addEditPrompt": {
        "fields": [
          "Title (required)",
          "Content (multi-line) (required)",
          "Tags (comma or chips)",
          "Category (select)",
          "Save / Cancel"
        ],
        "behavior": "On Save, update IndexedDB, set createdAt/updatedAt"
      },
      "promptDetail": {
        "elements": [
          "Title, Full content, Tag list, Category",
          "Actions row: Copy, Share, Favorite toggle, Add to Export, Edit, Delete",
          "Metadata: usageCount, lastUsedAt"
        ]
      },
      "addEditTool": {
        "fields": [
          "Name (required)",
          "URL (optional but recommended)",
          "Category",
          "Notes",
          "Tags"
        ],
        "actions": "Open link, Edit, Delete"
      },
      "exportScreen": {
        "description": "Select prompts to export from current project or across projects.",
        "elements": [
          "Multi-select list of prompts",
          "Filename input",
          "Format select (.txt or .json)",
          "Export button (creates file and also logs entry in exports store)"
        ]
      },
      "settingsScreen": {
        "elements": [
          "Theme toggle, Sort preference, PIN enable/disable, Clear local data, About"
        ]
      },
      "onboarding": {
        "steps": [
          "Welcome screen (one-liner + CTA)",
          "Create first Project prompt or tools example",
          "Short tour: Create prompt, Copy, Export, Install to Home Screen"
        ]
      }
    }
  },
  "userFlows": {
    "saveUsePrompt": [
      "User opens app -> selects Project -> taps + Add Prompt",
      "Fills Title, Content, Tags, Category -> taps Save",
      "Later opens Project -> searches for keyword -> opens Prompt",
      "Taps Copy -> prompt copied to clipboard -> pastes into ChatGPT"
    ],
    "projectCreateAndOrganize": [
      "User taps + New Project -> enters name, optional description -> saves",
      "Inside project, user adds prompts & tools relevant to that project",
      "User can switch between Prompts & Tools tabs to manage context"
    ],
    "exportForMemory": [
      "User opens Project -> selects multiple prompts -> taps Export",
      "User enters filename, chooses format (.txt/.json) -> taps Export",
      "App generates download & stores export entry in exports store"
    ],
    "favoriteAndUsageTracking": [
      "When user copies a prompt or opens prompt detail and uses an action, app increments usageCount and updates lastUsedAt",
      "Favorites appear in a quick-access list on Home"
    ]
  },
  "techStack": {
    "frontend": "React (create-react-app or Vite) or Vanilla JS (for ultra-lean build)",
    "styling": "Tailwind CSS",
    "storage": "IndexedDB via Dexie.js (recommended)",
    "pwa": {
      "serviceWorker": "Workbox or manual service worker for asset caching",
      "manifest": "manifest.json with name, short_name, icons, display=standalone, start_url, theme_color"
    },
    "buildTools": "Vite for fast dev, easy PWA integration",
    "optionalLibs": ["uuid (for ids)", "file-saver (for export)"]
  },
  "implementationNotes": {
    "IndexedDBPatterns": [
      "Use Dexie.js to define DB schema, versioning and indexes",
      "Index projectId on prompts & tools for fast project-scoped queries",
      "Batch updates for usageCount increments to reduce write churn"
    ],
    "exportFormatExamples": {
      "txt": {
        "formatDescription": "Simple text file with prompts separated by clear delimiters.",
        "example": "### Prompt: Title 1\nPrompt content...\n\n---\n\n### Prompt: Title 2\nPrompt content..."
      },
      "json": {
        "formatDescription": "Array of objects containing id, title, content, tags, category, createdAt",
        "example": "[{\"id\":\"...\",\"title\":\"...\",\"content\":\"...\",\"tags\":[\"...\"],\"category\":\"...\"}]"
      }
    },
    "pwaTips": [
      "Cache shell assets on first load, use network-first for dynamic content if cloud sync is added later",
      "Ensure manifest icons include multiple sizes for Android & iOS",
      "Prompt user to install app after basic onboarding"
    ]
  },
  "securityAndPrivacy": {
    "offlineFirst": "All data stored locally in IndexedDB by default; no backend in MVP",
    "optionalPIN": "Enable a local PIN or biometric gate, store hashed PIN client-side only (never send anywhere)",
    "exportPrivacy": "Export files are user-initiated downloads; warn users that exports are not encrypted by default",
    "futureE2EE": "If cloud sync added later, plan end-to-end encryption so server never sees raw prompt content"
  },
  "acceptanceCriteria": {
    "projects": "User can create, rename, delete a project; project persists across reloads",
    "prompts": "User can add/edit/delete prompts inside a project; prompt appears in project list; copy action copies prompt content to clipboard",
    "tools": "User can add/edit/delete tools inside a project; tapping link opens in new tab",
    "search": "Project-scoped search returns matching prompts/tools within <200ms on typical mobile device for 500 items",
    "export": "Selected prompts export as .txt and .json files; export metadata logged in exports store",
    "pwaInstall": "App shows install prompt; installed app runs full-screen and persists data"
  },
  "metricsAndValidation": {
    "offlineMetrics": [
      "promptsSaved (total)",
      "promptsExported (count)",
      "uniqueProjectsCreated",
      "averagePromptsPerProject",
      "usageCountPerPrompt (top 10)"
    ],
    "validationPlan": [
      "Release MVP to 50 testers via a sharable URL",
      "Collect qualitative feedback in short survey after 3 days",
      "Track: prompts saved, exports made, retention after 7 days"
    ]
  },
  "roadmap": {
    "phase1_mvp (2-3 weeks)": [
      "Core CRUD for Projects, Prompts, Tools",
      "Project-based tabs & search",
      "IndexedDB persistence with Dexie.js",
      "Export .txt/.json",
      "PWA manifest & Service Worker",
      "Basic onboarding & install prompt"
    ],
    "phase2_postValidation (4-8 weeks)": [
      "Bulk import/export JSON backups",
      "Local analytics screen (top prompts)",
      "Favorites & sorting preferences",
      "Dark mode & minor UX polish"
    ],
    "phase3_scale (8+ weeks)": [
      "OCR screenshot capture",
      "Semantic search & embeddings",
      "Optional cloud sync & encrypted backup",
      "Workflows / Playbooks & sharing"
    ]
  },
  "developerDeliverables": {
    "design": [
      "Mobile UI screens: Projects List, Project View (Prompts/Tools tabs), Add/Edit Prompt, Prompt Detail, Add/Edit Tool, Export Screen, Settings, Onboarding",
      "Tailwind utility classes & components"
    ],
    "code": [
      "Dexie DB schema & version migrations",
      "CRUD endpoints for local storage (JS functions)",
      "Search util for indexed fields",
      "Export util for txt/json (FileSaver)",
      "Service Worker & manifest setup"
    ],
    "qa": [
      "Unit tests for DB operations (create, read, update, delete)",
      "E2E test for save->search->export flow",
      "Manual testing checklist for PWA install & offline usage"
    ]
  },
  "microcopyAndUXPrompts": {
    "welcomeHeadline": "PVault — Keep your prompts & tools, together by project",
    "emptyProjectCTA": "No prompts yet, add your first prompt",
    "exportSuccessToast": "Export complete, file downloaded",
    "installBanner": "Install PVault to your home screen for faster access"
  },
  "notes": "This JSON intentionally excludes personal ID or bank storage. It focuses solely on AI prompts, tools & project organization as specified. If you want, I can convert the dataModel into Dexie.js schema code, plus example React components for each screen."
}
```0

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5aed5451-f397-44b1-81fc-a2cad7b4ee0c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
