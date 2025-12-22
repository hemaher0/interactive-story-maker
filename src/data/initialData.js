export const INITIAL_FILES = [
  // =========================
  // Relation / Operator
  // =========================
  { id: 'cond-eq',       type: 'Condition', rel: 'equals',     label: '일치하다 (=)',              lvalue: null, rvalue: null },
  { id: 'cond-neq',      type: 'Condition', rel: 'not_equals', label: '다르다 (≠)',                lvalue: null, rvalue: null },
  { id: 'cond-gt',       type: 'Condition', rel: 'greater',    label: '크다 (>)',                  lvalue: null, rvalue: null },
  { id: 'cond-lt',       type: 'Condition', rel: 'smaller',    label: '작다 (<)',                  lvalue: null, rvalue: null },
  { id: 'cond-in',       type: 'Condition', rel: 'contains',   label: '포함하다 (contains)',       lvalue: null, rvalue: null },
  { id: 'cond-has',      type: 'Condition', rel: 'has',        label: '가지고 있다 (has)',         lvalue: null, rvalue: null },

  { id: 'cond-state-is', type: 'Condition', rel: 'is',         label: '이다 (state-to-state)',     lvalue: null, rvalue: null },

  { id: 'cond-exist',    type: 'Condition', rel: 'exist',      label: '존재한다 (exist)',          lvalue: null, rvalue: null },
  { id: 'cond-nexist',   type: 'Condition', rel: 'not_exist',  label: '존재하지 않다 (not exist)', lvalue: null, rvalue: null },



  // =========================
  // Global Goal
  // =========================
  {
    id: 'global-goal',
    type: 'Goal',
    owner: 'scene',
    name: 'Goal: 곰과 친구되기',
    condition: {
      id: 'goal-cond-1',
      type: 'Condition',
      rel: 'equals',
      lvalue: { objectRef: 'target', stateRef: 'st-rel' },
      rvalue: { kind: 'literal', value: '친구' }
    },
    endingDescription: '오해를 풀고 숲속에서 친구가 되었습니다.'
  },

  // =========================
  // Objects
  // =========================
  {
    id: 'obj-snow',
    type: 'Object',
    name: '백설공주',
    description: '플레이어 캐릭터',
    state: [
      { ref: 'st-loc', currentValue: {kind: 'Object', value: 'obj-forest' }},
      { ref: 'st-has-apple', currentValue: {kind: 'bool', value: true}}
    ]
  },
  {
    id: 'obj-bear',
    type: 'Object',
    name: '곰',
    description: '숲속의 주인',
    state: [
      { ref: 'st-rel', currentValue: { kind: 'literal', value: '경계함' } },
      { ref: 'st-hungry', currentValue: { kind: 'bool', value: true } }
    ]
  },
  {
    id: 'obj-hut',
    type: 'Object',
    name: '오두막',
    description: '작은 나무 집(장소)',
    state: [
      { ref: 'st-clean', currentValue: { kind: 'literal', value: '지저분함' } }
    ]
  },
  {
    id: 'obj-forest',
    type: 'Object',
    name: '깊은 숲',
    description: '장소',
    state: []
  },
  {
    id: 'obj-apple',
    type: 'Object',
    name: '사과',
    description: '선물용 물건',
    state: []
  },

  // =========================
  // States
  // =========================
  {
    id: 'st-loc',
    type: 'State',
    owner: null,
    name: '위치',
    description: '현재 머물고 있는 장소(Object ref)',
    values: [
      { kind: 'Object', value: 'obj-forest' },
      { kind: 'Object', value: 'obj-hut' }
    ]
  },
  {
    id: 'st-rel',
    type: 'State',
    owner: null,
    name: '관계',
    description: '상대방과의 친밀도',
    values: [
      { kind: 'literal', value: '경계함' },
      { kind: 'literal', value: '친구' }
    ]
  },
  {
    id: 'st-clean',
    type: 'State',
    owner: null,
    name: '청결도',
    description: '장소의 깨끗한 정도',
    values: [
      { kind: 'literal', value: '지저분함' },
      { kind: 'literal', value: '깨끗함' }
    ]
  },
  {
    id: 'st-hungry',
    type: 'State',
    owner: null,
    name: '배고픔',
    description: '배고픈 상태 여부',
    values: [
      { kind: 'bool', value: true },
      { kind: 'bool', value: false }
    ]
  },
  {
    id: 'st-has-apple',
    type: 'State',
    owner: null,
    name: '사과 소지',
    description: '사과를 가지고 있는지 여부',
    values: [
      { kind: 'bool', value: true },
      { kind: 'bool', value: false }
    ]
  },

  // =========================
  // Actions
  // =========================
  {
    id: 'act-enter',
    type: 'Action',
    owner: null,
    contentName: '이동하기',
    description: 'actor가 target로 이동합니다.',
    actor:  { kind: 'Object', ref: null }, // 예: 'obj-snow'
    target: { kind: 'Object', ref: null }, // 예: 'obj-hut' 또는 'obj-forest'
    condition: [
      // actor의 위치가 target과 다를 때만 이동 (slot-to-slot 비교)
      {
        id: 'act-enter-cond-1',
        type: 'Condition',
        lvalue: { objectRef: 'actor', stateRef: 'st-loc' },
        rvalue: { kind: 'object', value: null },
        rel: 'not_equals',
        value: 'target'
      }
    ],
    effect: [
      // actor의 위치를 target로 설정 (slot-to-slot 대입)
      {
        id: 'act-enter-eff-1',
        type: 'Effect',
        lvalue: { objectRef: 'actor', stateRef: 'st-loc' },
        rvalue: { kind: 'object', value: 'target' },
        rel: 'set',
        value: 'target'
      }
    ]
  },

  {
    id: 'act-clean',
    type: 'Action',
    owner: null,
    contentName: '청소하기',
    description: 'target(장소)을 청소합니다.',
    actor:  { type: 'Object', ref: null }, // 예: 'obj-snow'
    target: { type: 'Object', ref: null }, // 예: 'obj-hut'
    condition: [
      // actor가 target에 있을 때만 청소 가능 (slot-to-slot)
      {
        id: 'act-clean-cond-1',
        type: 'Condition',
        rel: 'equals',
        lvalue: { objectRef: 'actor', stateRef: 'st-loc' },
        rvalue: { kind: 'object', value: null } // 예: 'obj-hut'
      },
      {
        id: 'act-clean-cond-2',
        type: 'Condition',
        rel: 'equals',
        lvalue: { objectRef: 'target', stateRef: 'st-clean' },
        rvalue: { kind: 'literal', value: '지저분함' }
      }
    ],
    effect: [
      {
        id: 'act-clean-eff-1',
        type: 'Effect',
        rel: 'set',
        lvalue: { objectRef: 'target', stateRef: 'st-clean' },
        rvalue: { kind: 'literal', value: '깨끗함' }
      }
    ]
  },

  {
    id: 'act-give',
    type: 'Action',
    owner: null,
    contentName: '선물하기',
    description: 'actor가 target에게 선물을 건넵니다.',
    actor:  { type: 'Object', ref: null }, // 예: 'obj-snow'
    target: { type: 'Object', ref: null }, // 예: 'obj-bear'
    condition: [
      {
        id: 'act-give-cond-1',
        type: 'Condition',
        rel: 'is', // actor.st-loc 과 target.st-loc 비교(state-to-state)
        lvalue: { objectRef: 'actor', stateRef: 'st-loc' },
        rvalue: { kind: 'state', objectRef: 'target', stateRef: 'st-loc' }
      },
      {
        id: 'act-give-cond-2',
        type: 'Condition',
        rel: 'equals',
        lvalue: { objectRef: 'actor', stateRef: 'st-has-apple' },
        rvalue: { kind: 'bool', value: true }
      }
    ],
    effect: [
      {
        id: 'act-give-eff-1',
        type: 'Effect',
        rel: 'set',
        lvalue: { objectRef: 'actor', stateRef: 'st-has-apple' },
        rvalue: { kind: 'bool', value: false }
      },
      {
        id: 'act-give-eff-2',
        type: 'Effect',
        rel: 'set',
        lvalue: { objectRef: 'target', stateRef: 'st-rel' },
        rvalue: { kind: 'literal', value: '친구' }
      }
    ]
  },

  {
    id: 'act-eat',
    type: 'Action',
    owner: null,
    contentName: '먹기',
    description: 'actor가 target를 먹습니다.',
    actor:  { type: 'Object', ref: null }, // 예: 'obj-snow'
    target: { type: 'Object', ref: null }, // 예: 'obj-apple'
    condition: [
      {
        id: 'act-eat-cond-1',
        type: 'Condition',
        rel: 'equals',
        lvalue: { objectRef: 'actor', stateRef: 'st-has-apple' },
        rvalue: { kind: 'bool', value: true }
      }
      // 위치 제약이 필요하면(사과가 놓인 장소 모델이 있을 때):
      // { rel:'equals', lvalue:{objectRef:'actor',stateRef:'st-loc'}, rvalue:{kind:'object',value:'obj-hut'} }
    ],
    effect: [
      {
        id: 'act-eat-eff-1',
        type: 'Effect',
        rel: 'set',
        lvalue: { objectRef: 'actor', stateRef: 'st-has-apple' },
        rvalue: { kind: 'bool', value: false }
      }
    ]
  },
];
