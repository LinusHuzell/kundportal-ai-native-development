# UI Specification

## Design Philosophy

The Contractor Service Portal should feel like a modern Scandinavian B2B application.

Keywords:

- Professional
- Trustworthy
- Minimalistic
- Clear information hierarchy
- Suitable for office staff managing service tickets

---

# Color Palette

## Primary Background

Dark navy blue

Approximate color:

#0F1C2E

Used for:

- Navigation bar
- Main content panels
- Ticket list
- Ticket details

---

## Secondary Background

Dark blue

Approximate color:

#16283D

Used for:

- Cards
- Form controls
- Content sections

---

## Accent Color

Teal

Approximate color:

#2FB1A5

Used for:

- Call-to-action buttons
- Links
- Active indicators
- Statistics

---

## Text

Primary text:

#FFFFFF

Secondary text:

#AAB6C5

Muted text:

#7E8B9A

---

## Status Colors

New:
#2563EB

In Progress:
#F59E0B

Waiting For Customer:
#64748B

Closed:
#16A34A

---

## Priority Colors

Low:
#64748B

Medium:
#F59E0B

High:
#DC2626

---

# Page Layout

The page consists of three major sections:

1. Top Navigation Bar
2. Page Header Area
3. Main Content Area

---

# Top Navigation

Height: approximately 60px

Contains:

- Company logo
- Company name
- Active ticket counter
- Create Work Order button
- User avatar

Background:

Dark navy

---

# Main Content

Centered container.

Maximum width approximately 1200px.

Layout uses a two-column structure.

---

# Left Column

Width approximately 40%.

Contains:

- Search field
- Filter dropdown
- Ticket list

The ticket list should be vertically scrollable.

---

# Right Column

Width approximately 60%.

Contains:

- Selected ticket details
- Description card
- Ticket metadata
- Customer information

---

# Ticket List Item

Each ticket item should display:

- Ticket number
- Title
- Customer name
- Customer company
- Priority badge
- Status badge
- Created date

Selected ticket should display:

- Different background color
- Highlight border

---

# Search Field

Located above the ticket list.

Contains:

- Search icon
- Placeholder text

Rounded corners.

Dark background.

---

# Filter Dropdown

Located next to the search field.

Used for filtering ticket categories or statuses.

---

# Statistics Widget

Located above the content area.

Contains summary counters:

- Total tickets
- New tickets
- High-priority tickets

Displayed in horizontal cards.

---

# Cards

All cards use:

- Rounded corners
- Subtle borders
- Soft shadows

No heavy visual effects.

---

# Typography

Font:

Inter or similar modern sans-serif font.

Headings:

- Bold
- Large
- High contrast

Body text:

- Medium weight
- Easy readability

Metadata:

- Small
- Muted color

---

# Responsiveness

Desktop-first design.

For smaller screens:

- Columns stack vertically.
- Ticket list appears before ticket details.
- Statistics move above main content.

---

# Source Of Truth

The approved Figma design is the primary visual reference.
If AI does not have access to the Figma design, this document should be used as the implementation reference.