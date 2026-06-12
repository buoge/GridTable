# Grid Table

`Grid Table` is a Vite + Vue 3 playground for extracting the current form designer GridTable behavior into a standalone
open source component.

The first version is intentionally local-only:

- local mock data from `src/mock/gridTableMock.js`;
- no backend services;
- no Vuex;
- no dynamic form APIs.

The playground includes local row and column editing, column resize, cell selection, merge and unmerge, background
color, click-to-add mock components, drag-to-drop mock components, JSON import, JSON refresh, and reset.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run build:demo
npm run test
```

- `npm run build` builds the reusable `GridTable` library.
- `npm run build:demo` builds the local playground.
- `npm run test` runs framework-independent core command tests with Node.

## Component Usage

```vue
<GridTable
  v-model="gridLayout"
  editable
/>
```

```js
import { GridTable, normalizeGridLayout } from 'grid-table';
import 'grid-table/style.css';
```

The user-facing name is `Grid Table`; the Vue component is exported as `GridTable`.

## Public Schema

```js
const gridLayout = normalizeGridLayout({
  label: 'Grid Table',
  columnWidths: [240, 240, 240],
  rowNum: 3,
  headerLabels: ['Name', 'Status', 'Owner'],
  cells: {
    '0:0': {
      componentIds: ['component-name'],
      backgroundColor: '#fff6d8',
    },
  },
  components: {
    'component-name': {
      id: 'component-name',
      type: 'text',
      label: 'Name',
      value: 'Mock inspection',
    },
  },
});
```
