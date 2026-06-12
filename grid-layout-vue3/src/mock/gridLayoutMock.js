export const gridLayoutMock = {
  label: 'Grid Table',
  showColumnHeader: true,
  columnWidths: [240, 240, 240],
  rowNum: 3,
  headerLabels: ['Name', 'Status', 'Owner'],
  cells: {
    '0:0': {
      componentIds: ['component-name'],
      backgroundColor: '#fff6d8',
    },
    '0:1': {
      componentIds: ['component-status'],
    },
    '0:2': {
      componentIds: ['component-owner'],
    },
    '1:0': {
      componentIds: ['component-note'],
      colSpan: 2,
      backgroundColor: '#e5f2ff',
    },
  },
  components: {
    'component-name': {
      id: 'component-name',
      type: 'text',
      label: 'Name',
      value: 'Door frame inspection',
    },
    'component-status': {
      id: 'component-status',
      type: 'select',
      label: 'Status',
      value: 'Open',
    },
    'component-owner': {
      id: 'component-owner',
      type: 'text',
      label: 'Owner',
      value: 'Mock user',
    },
    'component-note': {
      id: 'component-note',
      type: 'textarea',
      label: 'Note',
      value: 'This merged cell is rendered from local mock data.',
    },
  },
};
