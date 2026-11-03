// Offline audit reproductions. Executes existing source with in-memory substitutes.
// No Supabase requests, real API keys, browser storage, or application files are changed.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const ROOT = path.resolve(__dirname, '../..');
const results = [];
const log = new Proxy({}, { get: () => () => {} });
function environment(extra = {}) {
  const cache = new Map();
  const timers = new Map();
  const writes = [];
  let counter = 0;
  const cloud = {
    loadUserDataFromCloud: async () => null,
    saveUserDataToCloud: async (...args) => { writes.push(args); },
  };
  const sandbox = {
    console: { log() {}, info() {}, warn() {}, error() {}, time() {}, timeEnd() {} },
    URL, URLSearchParams, Date, crypto: require('node:crypto').webcrypto,
    setTimeout: (fn, ms) => { const id = ++counter; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id), setInterval: () => 0, clearInterval() {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    ...extra.globals,
  };
  function load(relative, stubs = {}) {
    const filename = path.resolve(ROOT, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    let source = fs.readFileSync(filename, 'utf8');
    source = source.replaceAll('import.meta.env.VITE_GEMINI_API_KEY', JSON.stringify('audit-env-key'));
    if (extra.transform) source = extra.transform(source, relative);
    const compiled = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    }}).outputText;
    const mod = { exports: {} }; cache.set(filename, mod);
    const req = spec => {
      if (Object.hasOwn(stubs, spec)) return stubs[spec];
      if (Object.hasOwn(extra.stubs || {}, spec)) return extra.stubs[spec];
      if (spec === 'zustand/middleware') return { persist: fn => fn };
      if (spec.endsWith('/cloudService')) return cloud;
      if (spec.endsWith('/sharingService')) return {};
      if (spec.endsWith('/logger')) return { storeLog: log, cloudLog: log, uploadLog: log };
      if (spec.endsWith('/supabase')) return { supabase: {}, TABLES: {} };
      if (spec.startsWith('.')) {
        const base = path.resolve(path.dirname(filename), spec);
        const resolved = ['.ts', '.tsx', '.js'].map(ext => base + ext).find(p => fs.existsSync(p));
        if (resolved) return load(path.relative(ROOT, resolved), stubs);
      }
      return require(spec);
    };
    vm.runInNewContext('(function(require,module,exports){' + compiled + '\n})', sandbox, { filename })(req, mod, mod.exports);
    return mod.exports;
  }
  return { load, cloud, writes, timers, sandbox,
    async flush(ms) {
      for (const [id, timer] of [...timers]) if (timer.ms === ms) {
        timers.delete(id); await timer.fn();
      }
    },
  };
}
function hooks() {
  const slots = []; let index = 0, effects = [], dirty = false;
  const same = (a,b) => a && b && a.length === b.length && a.every((x,i) => Object.is(x,b[i]));
  const api = {
    useState(initial) {
      const i = index++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; dirty = true; }];
    },
    useRef(value) { const i = index++; return slots[i] ||= { current: value }; },
    useMemo(fn, deps) { const i = index++; if (!slots[i] || !same(slots[i].deps,deps)) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useCallback(fn, deps) { return api.useMemo(() => fn, deps); },
    useEffect(fn, deps) {
      const i = index++; if (!slots[i] || !same(slots[i].deps, deps)) {
        const old = slots[i]; slots[i] = { deps }; effects.push(() => { old?.cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
  };
  return { api, render(fn, runEffects = true) {
    let result, passes = 0;
    do {
      assert.ok(++passes < 20, 'unexpected render loop'); dirty = false; index = 0; effects = [];
      result = fn(); if (runEffects) effects.forEach(f => f());
    } while (dirty);
    return result;
  }};
}
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'Fragment' };
const icons = new Proxy({}, { get: (_, key) => key === '__esModule' ? true : String(key) });
function find(tree, predicate, output = []) {
  if (!tree || typeof tree !== 'object') return output;
  if (predicate(tree)) output.push(tree);
  const children = tree.props?.children;
  (Array.isArray(children) ? children.flat(Infinity) : [children]).forEach(c => find(c, predicate, output));
  return output;
}
async function check(name, fn) {
  try { await fn(); results.push({ name, reproduced: true }); console.log('REPRODUCED:', name); }
  catch (error) { results.push({ name, reproduced: false, error: error.message }); console.error('NOT REPRODUCED:', name, error.message); process.exitCode = 1; }
}
(async () => {
  await check('A04: Failed initial cloud read enables a subsequent full-data write', async () => {
    const env = environment(); const { useStore } = env.load('store/useStore.ts');
    await useStore.getState().loadFromCloud();
    assert.equal(useStore.getState().isCloudLoaded, true);
    useStore.getState().updateInvitation({ groomName: 'Offline edit' }); await env.flush(2000);
    assert.equal(env.writes.length, 1);
    assert.equal(env.writes[0][1].invitation.groomName, 'Offline edit');
  });
  await check('A12: Settings weddingDate is not the date written to cloud', async () => {
    const env = environment(); const { useStore } = env.load('store/useStore.ts');
    await useStore.getState().loadFromCloud();
    await useStore.getState().updateUser(useStore.getState().user.uid, { weddingDate: '2028-12-01' });
    await env.flush(2000);
    assert.notEqual(env.writes[0][1].weddingDate, '2028-12-01');
  });
  await check('A07: Importing current backup fields resets invitation and procedures', async () => {
    const env = environment(); const { useStore } = env.load('store/useStore.ts');
    useStore.getState().updateInvitation({ groomName: 'Custom wedding' });
    const snapshot = useStore.getState();
    const backup = { guests: snapshot.guests, budgetItems: snapshot.budgetItems, fengShuiProfile: snapshot.fengShuiProfile, fengShuiResults: snapshot.fengShuiResults };
    useStore.getState().importData(backup);
    assert.notEqual(useStore.getState().invitation.groomName, 'Custom wedding');
  });
  await check('A06: saveUserDataToCloud resolves despite a rejected database write', async () => {
    const env = environment(); const tables = { USER_DATA:'user_data' };
    const service = env.load('services/cloudService.ts', { '../lib/supabase': {
      TABLES: tables, supabase: { from: () => ({ upsert: async () => ({ error: new Error('simulated permission denied') }) }) },
    }});
    const result = await service.saveUserDataToCloud('owner-1234', { guests: [], budgetItems: [] });
    assert.equal(result, undefined);
  });
  await check('A05: Even single-event RSVP submits a column absent from the SQL schema', async () => {
    const env = environment(); let inserted;
    const service = env.load('services/cloudService.ts', { '../lib/supabase': {
      TABLES: { INVITATION_RESPONSES:'invitation_responses' },
      supabase: { from: () => ({ insert: async data => { inserted = data; return { error: { code:'PGRST204' } }; } }) },
    }});
    const result = await service.submitRSVP('owner-1234', { name: 'Test Guest', attending: 'yes' });
    assert.ok(Object.hasOwn(inserted, 'selected_event_ids')); assert.equal(result, false);
    assert.ok(!fs.readFileSync(path.join(ROOT, 'supabase-migration.sql'), 'utf8').includes('selected_event_ids'));
  });
  await check('A11: General AI calls choose the environment key over a configured user key', async () => {
    const env = environment(); let key;
    const service = env.load('services/aiService.ts', { '@google/genai': { GoogleGenAI: class {
      constructor(options) { key = options.apiKey; this.models = { generateContent: async () => ({ text:'ok' }) }; }
    }}});
    const { useStore } = env.load('store/useStore.ts'); useStore.getState().setGeminiApiKey('audit-custom-key');
    await service.generateAIContent(useStore.getState().user, 'test', 'hello');
    assert.equal(key, 'audit-env-key'); assert.notEqual(key, useStore.getState().settings.geminiApiKey);
  });
  await check('A08: The editor clears undo history after its own debounced save', async () => {
    const h = hooks(); const storeEnv = environment(); const { useStore } = storeEnv.load('store/useStore.ts');
    const env = environment({ stubs: {
      react: h.api, 'react/jsx-runtime': jsx,
      '../../../store/useStore': { useStore: () => useStore.getState() },
      '../InvitationPreview': { default:'Preview', __esModule:true },
      './EditorTopBar': { default:'TopBar', __esModule:true },
      './EditorLeftSidebar': { default:'Sidebar', __esModule:true },
      './EditorContextPanel': { default:'Context', __esModule:true },
      '../TemplateGalleryModal': { default:'Gallery', __esModule:true },
    }, globals: { document: { querySelector: () => true }, window: { addEventListener() {}, removeEventListener() {} } } });
    const Page = env.load('components/invitation/editor/InvitationEditorPage.tsx').default;
    const top = () => find(h.render(() => Page({})), n => n.type === 'TopBar')[0].props;
    top().onChange({ groomName:'Edited name' }); assert.equal(top().canUndo, true);
    await env.flush(500); assert.equal(top().canUndo, false);
  });
  await check('A09: Preview ignores hidden sections and configured section order', async () => {
    const h = hooks(); const env = environment({ stubs: { react: h.api, 'react/jsx-runtime':jsx, 'lucide-react':icons } });
    const Preview = env.load('components/invitation/InvitationPreview.tsx').default;
    const initial = env.load('data/initialData.ts').INITIAL_INVITATION;
    const data = { ...initial, sectionVisibility:{ hero:false }, sectionOrder:['footer','hero'] };
    const tree = h.render(() => Preview({ data, editorConfig:{ onSectionClick() {} } }), false);
    const sections = find(tree, n => n.props?.['data-sec']).map(n => n.props['data-sec']);
    assert.ok(sections.includes('hero')); assert.notEqual(sections[0], 'footer');
  });
  await check('A10: InlineRichText ignores editor callback and is never editable', async () => {
    const env = environment({ stubs:{ react:{}, 'react/jsx-runtime':jsx }, globals:{
      NodeFilter: { SHOW_ELEMENT:1 }, document:{
        createElement: tag => tag === 'template' ? { content:{ cloneNode: () => ({}) } } : { appendChild() {}, innerHTML:'Name' },
        createTreeWalker: () => ({ nextNode: () => null }),
      },
    }});
    const { InlineRichText } = env.load('components/invitation/InlineRichText.tsx');
    const node = InlineRichText({ value:'Name', field:'groomName', ec:{ onFieldEdit() {} } });
    assert.equal(node.props.contentEditable, undefined); assert.equal(node.props.onBlur, undefined);
  });
  await check('A06: RSVP modal displays success even when its submit callback returns false', async () => {
    const h = hooks(); const originalUseState = h.api.useState;
    h.api.useState = initial => originalUseState(initial && typeof initial === 'object' && 'attending' in initial ? { ...initial, name:'Audit Guest' } : initial);
    const env = environment({ transform: (source, file) => file.endsWith('PublicInvitationView.tsx') ? source + '\nexport { RSVPModal };' : source,
      stubs:{ react:h.api, 'react/jsx-runtime':jsx, 'lucide-react':icons, './InvitationPreview':{ default:'Preview', __esModule:true } } });
    const { RSVPModal } = env.load('components/invitation/PublicInvitationView.tsx');
    const props = { groomName:'Groom', brideName:'Bride', onClose() {}, onSubmit:() => false };
    const first = h.render(() => RSVPModal(props), false);
    find(first, n => n.type === 'form')[0].props.onSubmit({ preventDefault() {} });
    const next = h.render(() => RSVPModal(props), false);
    assert.equal(find(next, n => n.type === 'form').length, 0);
    assert.ok(find(next, n => n.type === 'h3' && String(n.props.children).includes('Cảm ơn')).length > 0);
  });
  await check('A13: Importing a five-person RSVP creates only one guest', async () => {
    const file = path.join(ROOT, 'components/GuestManager.tsx');
    const source = ts.createSourceFile(file, fs.readFileSync(file,'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let initializer;
    function visit(node) {
      if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'handleImportRsvp') initializer = node.initializer.getText(source);
      ts.forEachChild(node, visit);
    }
    visit(source); assert.ok(initializer);
    const env = environment(); const types = env.load('types.ts'); let guest;
    const code = ts.transpileModule('var handler = ' + initializer, { compilerOptions:{ target:ts.ScriptTarget.ES2022 } }).outputText;
    const scope = { importedIds:new Set(), guests:[], setImportedIds() {}, generateId:() => 'audit-guest',
      GuestGroup:types.GuestGroup, AttendanceProbability:types.AttendanceProbability, addGuest:g => { guest = g; } };
    vm.runInNewContext(code, scope);
    scope.handler({ id:'rsvp-1', name:'Audit Family', attending:'yes', guestCount:5 });
    assert.equal(1 + guest.childrenCount, 1); assert.notEqual(1 + guest.childrenCount, 5);
  });
  fs.writeFileSync(path.join(__dirname, 'reproduction-results.json'), JSON.stringify({
    generated:'2026-11-03', scope:'offline source execution with mocked external services and a minimal React hook runner',
    warning:'Passing assertions confirm the current defects; these are audit reproductions, not regression tests for fixes.', results,
  }, null, 2) + '\n');
  console.log(`${results.filter(r => r.reproduced).length}/${results.length} defects reproduced`);
})();
