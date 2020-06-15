module.exports = {
  output: {
    path: 'self',
    dirname: '',
    // [name] is component name
    filename: 'README',
  },
  md: {
    methods: {
      title: 'Methods',
      titleTag: '##',
      headers: [
        { name: 'name', sourceKey: 'key' },
        { name: 'params', sourceKey: 'params' },
        { name: 'return', sourceKey: 'return' },
        { name: 'description', sourceKey: 'description' },
      ],
    },
    props: {
      title: 'Props',
      titleTag: '##',
      headers: [
        { name: 'name', sourceKey: 'key' },
        { name: 'type', sourceKey: 'type' },
        { name: 'default', sourceKey: 'default' },
        { name: 'description', sourceKey: 'description' },
      ],
    },
    events: {
      title: 'Event',
      titleTag: '##',
      headers: [
        { name: 'name', sourceKey: 'key' },
        { name: 'params', sourceKey: 'params' },
        { name: 'description', sourceKey: 'description' },
      ],
    },
    slots: {
      title: 'Slots',
      titleTag: '##',
      headers: [
        { name: 'name', sourceKey: 'key' },
      ],
    },
  },
};
