const STORAGE_KEY = "hellaverse-studio-state-v1";
const PREFS_KEY = "hellaverse-studio-prefs-v1";

const CLEAN_RESET_KEY = "hellaverse-studio-clean-reset-v1";

(function purgeLegacyHellaverseDataOnce() {
  try {
    if (localStorage.getItem(CLEAN_RESET_KEY) === "1") return;

    const keep = new Set([STORAGE_KEY, PREFS_KEY, CLEAN_RESET_KEY]);
    const legacyExact = new Set([
      "hellaverse_dialogue_state_v1",
      "dialogue-lab-state-v1",
      "dialogue-lab-prefs-v1",
      "dialogue-lab-sample-events-v2",
      "dialogue-lab-sample-content-v3",
      "dialogue-lab-sample-affection-v5",
      "dialogue-lab-sample-emotion-v6"
    ]);

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key || keep.has(key)) continue;

      if (
        legacyExact.has(key) ||
        key.startsWith("hellaverse_dialogue") ||
        key.startsWith("hellaverse_collection") ||
        key.startsWith("hellaverse_gacha")
      ) {
        localStorage.removeItem(key);
      }
    }

    localStorage.setItem(CLEAN_RESET_KEY, "1");
  } catch (error) {
    console.warn("Legacy Hellaverse data cleanup skipped safely.", error);
  }
})();


const EMOTION_STATES = [
  ["calm", "평온"],
  ["joy", "기쁨"],
  ["embarrassed", "당황"],
  ["sad", "슬픔"],
  ["angry", "화남"],
  ["anxious", "불안"],
  ["curious", "호기심"],
  ["guarded", "경계"]
];

function emotionLabel(value) {
  return EMOTION_STATES.find(([id]) => id === value)?.[1] || "평온";
}

const createId = (prefix = "id") =>
  prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);

const clone = value =>
  typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

function makeEntry(type) {
  const base = {
    id: createId("entry"),
    condition: null,
    effects: [],
    affectionCondition: null,
    affectionEffects: [],
    emotionCondition: null,
    emotionEffects: []
  };

  if (type === "narration") {
    return { ...base, type: "narration", text: "" };
  }

  if (type === "choice") {
    return {
      ...base,
      type: "choice",
      prompt: "",
      options: [
        makeOption("선택지 1"),
        makeOption("선택지 2")
      ]
    };
  }

  return {
    ...base,
    type: "dialogue",
    speaker: "",
    text: ""
  };
}

function makeOption(label = "선택지") {
  return {
    id: createId("option"),
    label,
    entries: [],
    condition: null,
    effects: [],
    affectionCondition: null,
    affectionEffects: [],
    emotionCondition: null,
    emotionEffects: [],
    exitMode: "continue",
    targetEventId: ""
  };
}

function normalizeCondition(condition) {
  if (!condition || typeof condition !== "object") return null;
  return {
    variableId: condition.variableId || "",
    operator: condition.operator || "==",
    value: condition.value ?? ""
  };
}

function normalizeEffects(effects) {
  return Array.isArray(effects)
    ? effects.map(effect => ({
        id: effect.id || createId("effect"),
        variableId: effect.variableId || "",
        operation: effect.operation || "set",
        value: effect.value ?? ""
      }))
    : [];
}

function normalizeAffectionCondition(condition) {
  if (!condition || typeof condition !== "object") return null;
  return {
    targetId: condition.targetId || "",
    operator: condition.operator || ">=",
    value: Number.isFinite(Number(condition.value)) ? Number(condition.value) : 0
  };
}

function normalizeAffectionEffects(effects) {
  return Array.isArray(effects)
    ? effects.map(effect => ({
        id: effect.id || createId("affection-effect"),
        targetId: effect.targetId || "",
        amount: Number.isFinite(Number(effect.amount)) ? Number(effect.amount) : 0
      }))
    : [];
}

function normalizeEmotionCondition(condition) {
  if (!condition || typeof condition !== "object") return null;
  return {
    targetId: condition.targetId || "",
    state: EMOTION_STATES.some(([id]) => id === condition.state) ? condition.state : "",
    intensityOperator: ["==", "!=", ">", ">=", "<", "<="].includes(condition.intensityOperator)
      ? condition.intensityOperator
      : ">=",
    intensityValue: Math.min(100, Math.max(0, Number(condition.intensityValue) || 0))
  };
}

function normalizeEmotionEffects(effects) {
  return Array.isArray(effects)
    ? effects.map(effect => ({
        id: effect.id || createId("emotion-effect"),
        targetId: effect.targetId || "",
        state: EMOTION_STATES.some(([id]) => id === effect.state) ? effect.state : "calm",
        intensity: Math.min(100, Math.max(0, Number(effect.intensity) || 0))
      }))
    : [];
}

function normalizeEntry(entry) {
  const item = {
    ...entry,
    id: entry.id || createId("entry"),
    condition: normalizeCondition(entry.condition),
    effects: normalizeEffects(entry.effects),
    affectionCondition: normalizeAffectionCondition(entry.affectionCondition),
    affectionEffects: normalizeAffectionEffects(entry.affectionEffects),
    emotionCondition: normalizeEmotionCondition(entry.emotionCondition),
    emotionEffects: normalizeEmotionEffects(entry.emotionEffects)
  };

  if (item.type === "choice") {
    item.prompt = item.prompt || "";
    item.options = Array.isArray(item.options)
      ? item.options.map(option => {
          const oldBranch = Array.isArray(option.entries)
            ? option.entries
            : (Array.isArray(option.responses) ? option.responses : []);

          return {
            id: option.id || createId("option"),
            label: option.label || "",
            entries: oldBranch.map(normalizeEntry),
            condition: normalizeCondition(option.condition),
            effects: normalizeEffects(option.effects),
            affectionCondition: normalizeAffectionCondition(option.affectionCondition),
            affectionEffects: normalizeAffectionEffects(option.affectionEffects),
            emotionCondition: normalizeEmotionCondition(option.emotionCondition),
            emotionEffects: normalizeEmotionEffects(option.emotionEffects),
            exitMode: option.exitMode === "end" ? "end" : "continue",
            targetEventId: option.targetEventId || ""
          };
        })
      : [];
    return item;
  }

  if (item.type === "narration") {
    item.text = item.text || "";
    return item;
  }

  item.type = "dialogue";
  item.speaker = item.speaker || "";
  item.text = item.text || "";
  return item;
}

function normalizeEvent(event) {
  return {
    id: event.id || createId("event"),
    name: event.name || "새 이벤트",
    nextEventId: event.nextEventId || "",
    emotionExitMode: event.emotionExitMode === "reset" ? "reset" : "keep",
    entries: Array.isArray(event.entries) ? event.entries.map(normalizeEntry) : []
  };
}

function normalizeVariable(variable) {
  return {
    id: variable.id || createId("var"),
    name: variable.name || "새 변수",
    type: ["number", "boolean", "string"].includes(variable.type) ? variable.type : "number",
    defaultValue: variable.defaultValue ?? (variable.type === "boolean" ? "false" : "0")
  };
}

function normalizeAsset(asset) {
  return {
    id: asset.id || createId("asset"),
    type: ["image", "audio", "other"].includes(asset.type) ? asset.type : "image",
    name: asset.name || "새 리소스",
    source: asset.source || ""
  };
}

function normalizeAffectionTarget(target) {
  const initialValue = Math.min(100, Math.max(0, Number(target?.initialValue) || 0));
  return {
    id: target?.id || createId("affection"),
    name: target?.name || "새 대상",
    initialValue
  };
}

function normalizeEmotionTarget(target) {
  return {
    id: target?.id || createId("emotion"),
    name: target?.name || "새 대상",
    defaultState: EMOTION_STATES.some(([id]) => id === target?.defaultState)
      ? target.defaultState
      : "calm",
    defaultIntensity: Math.min(100, Math.max(0, Number(target?.defaultIntensity) || 0))
  };
}

function normalizeState(raw) {
  const events = Array.isArray(raw?.events) && raw.events.length
    ? raw.events.map(normalizeEvent)
    : [{
        id: "event-empty",
        name: "새 이벤트",
        nextEventId: "",
        emotionExitMode: "keep",
        entries: []
      }];

  const activeEventId = events.some(event => event.id === raw?.activeEventId)
    ? raw.activeEventId
    : events[0].id;

  return {
    activeEventId,
    events,
    variables: Array.isArray(raw?.variables) ? raw.variables.map(normalizeVariable) : [],
    assets: Array.isArray(raw?.assets) ? raw.assets.map(normalizeAsset) : [],
    affectionTargets: Array.isArray(raw?.affectionTargets)
      ? raw.affectionTargets.map(normalizeAffectionTarget)
      : [],
    emotionTargets: Array.isArray(raw?.emotionTargets)
      ? raw.emotionTargets.map(normalizeEmotionTarget)
      : []
  };
}

function loadState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch (error) {
    console.warn("저장된 프로젝트 데이터를 읽지 못했습니다.", error);
    return normalizeState(null);
  }
}

function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
    return {
      textSpeed: clampNumber(saved.textSpeed, 0, 80, 24),
      autoDelay: clampNumber(saved.autoDelay, 250, 3000, 900),
      stageClick: saved.stageClick !== false
    };
  } catch (error) {
    return {
      textSpeed: 24,
      autoDelay: 900,
      stageClick: true
    };
  }
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

let state = loadState();
let prefs = loadPrefs();

let runtime = createRuntime(state.activeEventId);
let draftState = null;
let draftActiveEventId = null;
let selectedEntryId = null;

let typing = {
  token: "",
  fullText: "",
  index: 0,
  done: true,
  timer: null
};

let modeTimer = null;
let autoMode = false;
let viewToken = "";

const el = {
  eventSelect: document.querySelector("#eventSelect"),
  eventBadge: document.querySelector("#eventBadge"),
  eventTitle: document.querySelector("#eventTitle"),
  stage: document.querySelector("#stage"),
  dialogueCard: document.querySelector("#dialogueCard"),
  speakerName: document.querySelector("#speakerName"),
  dialogueText: document.querySelector("#dialogueText"),
  progressText: document.querySelector("#progressText"),
  nextLine: document.querySelector("#nextLine"),
  choiceCard: document.querySelector("#choiceCard"),
  choicePrompt: document.querySelector("#choicePrompt"),
  choiceButtons: document.querySelector("#choiceButtons"),
  choiceDepth: document.querySelector("#choiceDepth"),
  emptyState: document.querySelector("#emptyState"),
  endState: document.querySelector("#endState"),
  openSettings: document.querySelector("#openSettings"),
  emptyOpenSettings: document.querySelector("#emptyOpenSettings"),

  autoButton: document.querySelector("#autoButton"),
  logButton: document.querySelector("#logButton"),
  affectionButton: document.querySelector("#affectionButton"),
  emotionButton: document.querySelector("#emotionButton"),
  affectionToast: document.querySelector("#affectionToast"),
  playSettingsButton: document.querySelector("#playSettingsButton"),


  gameModal: document.querySelector("#gameModal"),
  gameModalTitle: document.querySelector("#gameModalTitle"),
  gameModalBody: document.querySelector("#gameModalBody"),
  closeGameModal: document.querySelector("#closeGameModal"),

  settingsOverlay: document.querySelector("#settingsOverlay"),
  projectSettings: document.querySelector("#projectSettings"),
  cancelSettings: document.querySelector("#cancelSettings"),
  saveSettings: document.querySelector("#saveSettings"),
  newEvent: document.querySelector("#newEvent"),
  editorEventList: document.querySelector("#editorEventList"),
  eventNameInput: document.querySelector("#eventNameInput"),
  eventIdInput: document.querySelector("#eventIdInput"),
  eventNextSelect: document.querySelector("#eventNextSelect"),
  eventEmotionExitSelect: document.querySelector("#eventEmotionExitSelect"),
  deleteEvent: document.querySelector("#deleteEvent"),
  entryCount: document.querySelector("#entryCount"),
  entryList: document.querySelector("#entryList"),
  addTypeButtons: [...document.querySelectorAll("[data-add-type]")],

  emptyInspector: document.querySelector("#emptyInspector"),
  entryInspector: document.querySelector("#entryInspector"),
  inspectorBreadcrumb: document.querySelector("#inspectorBreadcrumb"),
  inspectorTypeBadge: document.querySelector("#inspectorTypeBadge"),
  inspectorTitle: document.querySelector("#inspectorTitle"),
  inspectorBody: document.querySelector("#inspectorBody"),
  moveEntryUp: document.querySelector("#moveEntryUp"),
  moveEntryDown: document.querySelector("#moveEntryDown"),
  duplicateEntry: document.querySelector("#duplicateEntry"),
  deleteEntry: document.querySelector("#deleteEntry"),

  projectPanel: document.querySelector("#projectPanel"),
  closeProjectPanel: document.querySelector("#closeProjectPanel"),
  addAffectionTarget: document.querySelector("#addAffectionTarget"),
  affectionTargetList: document.querySelector("#affectionTargetList"),
  addEmotionTarget: document.querySelector("#addEmotionTarget"),
  emotionTargetList: document.querySelector("#emotionTargetList"),
  addVariable: document.querySelector("#addVariable"),
  variableList: document.querySelector("#variableList"),
  addAsset: document.querySelector("#addAsset"),
  assetList: document.querySelector("#assetList")
};

/* ---------- STORAGE ---------- */

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function persistPrefs() {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/* ---------- VARIABLES / CONDITIONS ---------- */

function getVariableDef(variableId, sourceState = state) {
  return sourceState.variables.find(variable => variable.id === variableId) || null;
}

function parseVariableValue(variable, value) {
  if (!variable) return value;

  if (variable.type === "number") {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  if (variable.type === "boolean") {
    if (typeof value === "boolean") return value;
    return String(value).toLowerCase() === "true";
  }

  return String(value ?? "");
}

function makeDefaultVariables(sourceState = state) {
  const values = {};
  sourceState.variables.forEach(variable => {
    values[variable.id] = parseVariableValue(variable, variable.defaultValue);
  });
  return values;
}

function conditionPasses(condition) {
  if (!condition?.variableId) return true;

  const variable = getVariableDef(condition.variableId);
  if (!variable) return true;

  const current = runtime.variables[variable.id] ?? parseVariableValue(variable, variable.defaultValue);
  const expected = parseVariableValue(variable, condition.value);

  switch (condition.operator) {
    case "!=": return current !== expected;
    case ">": return Number(current) > Number(expected);
    case ">=": return Number(current) >= Number(expected);
    case "<": return Number(current) < Number(expected);
    case "<=": return Number(current) <= Number(expected);
    case "truthy": return Boolean(current);
    case "falsy": return !current;
    case "==":
    default: return current === expected;
  }
}

function applyEffects(effects) {
  normalizeEffects(effects).forEach(effect => {
    if (!effect.variableId) return;

    const variable = getVariableDef(effect.variableId);
    if (!variable) return;

    const current = runtime.variables[variable.id] ?? parseVariableValue(variable, variable.defaultValue);
    const value = parseVariableValue(variable, effect.value);

    switch (effect.operation) {
      case "add":
        runtime.variables[variable.id] = Number(current) + Number(value);
        break;
      case "subtract":
        runtime.variables[variable.id] = Number(current) - Number(value);
        break;
      case "toggle":
        runtime.variables[variable.id] = !Boolean(current);
        break;
      case "set":
      default:
        runtime.variables[variable.id] = value;
        break;
    }
  });
}

function getAffectionTargetDef(targetId, sourceState = state) {
  return sourceState.affectionTargets.find(target => target.id === targetId) || null;
}

function makeDefaultAffection(sourceState = state) {
  const values = {};
  sourceState.affectionTargets.forEach(target => {
    values[target.id] = Math.min(100, Math.max(0, Number(target.initialValue) || 0));
  });
  return values;
}

function affectionConditionPasses(condition) {
  if (!condition?.targetId) return true;
  const target = getAffectionTargetDef(condition.targetId);
  if (!target) return true;

  const current = Number(runtime.affection[target.id] ?? target.initialValue ?? 0);
  const expected = Number(condition.value) || 0;

  switch (condition.operator) {
    case ">": return current > expected;
    case "<": return current < expected;
    case "<=": return current <= expected;
    case "==": return current === expected;
    case "!=": return current !== expected;
    case ">=":
    default: return current >= expected;
  }
}

function ownerPasses(owner) {
  return conditionPasses(owner?.condition)
    && affectionConditionPasses(owner?.affectionCondition)
    && emotionConditionPasses(owner?.emotionCondition);
}

let statusToastTimer = null;

function showStatusToast(messages) {
  if (!el.affectionToast || !messages.length) return;
  if (statusToastTimer) clearTimeout(statusToastTimer);

  el.affectionToast.textContent = messages.join(" · ");
  el.affectionToast.hidden = false;

  statusToastTimer = setTimeout(() => {
    el.affectionToast.hidden = true;
    statusToastTimer = null;
  }, 1400);
}

function applyAffectionEffects(effects) {
  const messages = [];

  normalizeAffectionEffects(effects).forEach(effect => {
    if (!effect.targetId || !effect.amount) return;
    const target = getAffectionTargetDef(effect.targetId);
    if (!target) return;

    const current = Number(runtime.affection[target.id] ?? target.initialValue ?? 0);
    const next = Math.min(100, Math.max(0, current + Number(effect.amount)));
    const delta = next - current;
    runtime.affection[target.id] = next;

    if (delta !== 0) {
      messages.push(target.name + " 호감도 " + (delta > 0 ? "+" : "") + delta);
    }
  });

  showStatusToast(messages);
}

function getEmotionTargetDef(targetId, sourceState = state) {
  return sourceState.emotionTargets.find(target => target.id === targetId) || null;
}

function makeDefaultEmotions(sourceState = state) {
  const values = {};
  sourceState.emotionTargets.forEach(target => {
    values[target.id] = {
      state: target.defaultState,
      intensity: target.defaultIntensity
    };
  });
  return values;
}

function emotionConditionPasses(condition) {
  if (!condition?.targetId) return true;
  const target = getEmotionTargetDef(condition.targetId);
  if (!target) return true;

  const current = runtime.emotions[target.id] || {
    state: target.defaultState,
    intensity: target.defaultIntensity
  };

  if (condition.state && current.state !== condition.state) return false;

  const intensity = Number(current.intensity) || 0;
  const expected = Number(condition.intensityValue) || 0;

  switch (condition.intensityOperator) {
    case ">": return intensity > expected;
    case "<": return intensity < expected;
    case "<=": return intensity <= expected;
    case "==": return intensity === expected;
    case "!=": return intensity !== expected;
    case ">=":
    default: return intensity >= expected;
  }
}

function applyEmotionEffects(effects) {
  const messages = [];

  normalizeEmotionEffects(effects).forEach(effect => {
    if (!effect.targetId) return;
    const target = getEmotionTargetDef(effect.targetId);
    if (!target) return;

    runtime.emotions[target.id] = {
      state: effect.state,
      intensity: effect.intensity
    };

    messages.push(target.name + " 감정 → " + emotionLabel(effect.state) + " " + effect.intensity);
  });

  showStatusToast(messages);
}

function resetEmotionsToDefaults() {
  runtime.emotions = makeDefaultEmotions();
}

function applyEventEmotionExit(event) {
  if (event?.emotionExitMode === "reset") {
    resetEmotionsToDefaults();
  }
}

/* ---------- RUNTIME / SAVE ---------- */

function createRuntime(eventId) {
  const startEvent = state.events.some(event => event.id === eventId)
    ? eventId
    : state.events[0]?.id || "";

  return {
    eventId: startEvent,
    frames: startEvent
      ? [{ sourceType: "event", sourceId: startEvent, index: 0, label: "본편", exitMode: "continue", targetEventId: "" }]
      : [],
    variables: makeDefaultVariables(),
    affection: makeDefaultAffection(),
    emotions: makeDefaultEmotions(),
    log: [],
    choices: [],
    seenEntries: [],
    ended: false
  };
}

function normalizeRuntime(raw) {
  const base = createRuntime(raw?.eventId || state.activeEventId);
  if (!raw || typeof raw !== "object") return base;

  const eventId = state.events.some(event => event.id === raw.eventId)
    ? raw.eventId
    : base.eventId;

  const defaults = makeDefaultVariables();
  const variables = { ...defaults };

  if (raw.variables && typeof raw.variables === "object") {
    Object.keys(raw.variables).forEach(key => {
      const variable = getVariableDef(key);
      if (variable) variables[key] = parseVariableValue(variable, raw.variables[key]);
    });
  }

  const affection = makeDefaultAffection();
  if (raw.affection && typeof raw.affection === "object") {
    Object.keys(raw.affection).forEach(key => {
      if (getAffectionTargetDef(key)) {
        affection[key] = Math.min(100, Math.max(0, Number(raw.affection[key]) || 0));
      }
    });
  }

  const emotions = makeDefaultEmotions();
  if (raw.emotions && typeof raw.emotions === "object") {
    Object.keys(raw.emotions).forEach(key => {
      const target = getEmotionTargetDef(key);
      const source = raw.emotions[key];
      if (target && source && typeof source === "object") {
        emotions[key] = {
          state: EMOTION_STATES.some(([id]) => id === source.state) ? source.state : target.defaultState,
          intensity: Math.min(100, Math.max(0, Number(source.intensity) || 0))
        };
      }
    });
  }

  return {
    eventId,
    frames: Array.isArray(raw.frames) && raw.frames.length
      ? raw.frames.map(frame => ({
          sourceType: frame.sourceType === "option" ? "option" : "event",
          sourceId: frame.sourceId || eventId,
          index: Math.max(0, Number(frame.index) || 0),
          label: frame.label || "본편",
          exitMode: frame.exitMode === "end" ? "end" : "continue",
          targetEventId: frame.targetEventId || ""
        }))
      : [{ sourceType: "event", sourceId: eventId, index: 0, label: "본편", exitMode: "continue", targetEventId: "" }],
    variables,
    affection,
    emotions,
    log: Array.isArray(raw.log) ? raw.log.slice(-200) : [],
    choices: Array.isArray(raw.choices) ? raw.choices.slice(-200) : [],
    seenEntries: Array.isArray(raw.seenEntries) ? [...new Set(raw.seenEntries)] : [],
    ended: Boolean(raw.ended)
  };
}

/* ---------- PLAYBACK LOOKUP ---------- */

function getRuntimeEvent() {
  return state.events.find(event => event.id === runtime.eventId) || state.events[0] || null;
}

function findOptionById(optionId, entries = getRuntimeEvent()?.entries || []) {
  for (const entry of entries) {
    if (entry.type !== "choice") continue;

    for (const option of entry.options) {
      if (option.id === optionId) return option;
      const nested = findOptionById(optionId, option.entries);
      if (nested) return nested;
    }
  }
  return null;
}

function resolveFrameEntries(frame) {
  if (!frame) return [];

  if (frame.sourceType === "option") {
    return findOptionById(frame.sourceId)?.entries || [];
  }

  const event = state.events.find(item => item.id === frame.sourceId);
  return event?.entries || [];
}

function currentFrame() {
  return runtime.frames[runtime.frames.length - 1] || null;
}

function visibleOptions(entry) {
  return entry.options.filter(option => ownerPasses(option));
}

function jumpToEvent(eventId) {
  const departingEvent = getRuntimeEvent();
  const event = state.events.find(item => item.id === eventId);

  if (!event) {
    runtime.ended = true;
    return;
  }

  applyEventEmotionExit(departingEvent);

  runtime.eventId = event.id;
  runtime.frames = [{
    sourceType: "event",
    sourceId: event.id,
    index: 0,
    label: "본편",
    exitMode: "continue",
    targetEventId: ""
  }];
  runtime.ended = false;
  state.activeEventId = event.id;
  persistState();
  viewToken = "";
}

function finishCurrentEventNow() {
  const event = getRuntimeEvent();

  if (event?.nextEventId && state.events.some(item => item.id === event.nextEventId)) {
    jumpToEvent(event.nextEventId);
    return true;
  }

  applyEventEmotionExit(event);
  runtime.ended = true;
  return false;
}

function settlePlayback() {
  let guard = 0;

  while (guard++ < 1000) {
    if (runtime.ended) return false;

    const frame = currentFrame();
    if (!frame) {
      runtime.ended = true;
      return false;
    }

    const entries = resolveFrameEntries(frame);

    if (frame.index >= entries.length) {
      if (frame.sourceType === "option") {
        const target = frame.targetEventId;
        runtime.frames.pop();

        if (target) {
          jumpToEvent(target);
          continue;
        }

        if (frame.exitMode === "end") {
          finishCurrentEventNow();
          continue;
        }

        continue;
      }

      const event = getRuntimeEvent();
      if (event?.nextEventId && state.events.some(item => item.id === event.nextEventId)) {
        jumpToEvent(event.nextEventId);
        continue;
      }

      applyEventEmotionExit(event);
      runtime.ended = true;
      return false;
    }

    const entry = entries[frame.index];

    if (!ownerPasses(entry)) {
      frame.index += 1;
      continue;
    }

    if (entry.type === "choice" && visibleOptions(entry).length === 0) {
      frame.index += 1;
      continue;
    }

    return true;
  }

  console.warn("재생 흐름 보호 제한에 도달했습니다.");
  runtime.ended = true;
  return false;
}

function makeViewToken(entry) {
  const path = runtime.frames
    .map(frame => frame.sourceType + ":" + frame.sourceId + ":" + frame.index)
    .join("|");
  return runtime.eventId + "|" + path + "|" + entry.id;
}

/* ---------- TYPEWRITER / MODES ---------- */

function clearTypingTimer() {
  if (typing.timer) clearInterval(typing.timer);
  typing.timer = null;
}

function clearModeTimer() {
  if (modeTimer) clearTimeout(modeTimer);
  modeTimer = null;
}

function clearPlaybackTimers() {
  clearTypingTimer();
  clearModeTimer();
}

function startTyping(text, token) {
  clearTypingTimer();
  clearModeTimer();

  typing = {
    token,
    fullText: text || "",
    index: 0,
    done: false,
    timer: null
  };

  if (prefs.textSpeed === 0 || !typing.fullText) {
    finishTyping();
    return;
  }

  el.dialogueText.textContent = "";

  typing.timer = setInterval(() => {
    typing.index += 1;
    el.dialogueText.textContent = typing.fullText.slice(0, typing.index);

    if (typing.index >= typing.fullText.length) {
      clearTypingTimer();
      typing.done = true;
      scheduleModeAdvance();
    }
  }, prefs.textSpeed);
}

function finishTyping() {
  clearTypingTimer();
  typing.index = typing.fullText.length;
  typing.done = true;
  el.dialogueText.textContent = typing.fullText;
  scheduleModeAdvance();
}

function scheduleModeAdvance() {
  clearModeTimer();

  if (!typing.done || !el.choiceCard.hidden || runtime.ended) return;

  if (autoMode) {
    modeTimer = setTimeout(() => advanceDialogue(true), prefs.autoDelay);
  }
}

function updateModeButtons() {
  el.autoButton.classList.toggle("active", autoMode);
}

function toggleAuto() {
  autoMode = !autoMode;
  updateModeButtons();

  if (autoMode && typing.done) scheduleModeAdvance();
  else clearModeTimer();
}

/* ---------- LOG ---------- */

function addDialogueLog(entry, token) {
  if (viewToken === token) return;
  viewToken = token;

  runtime.log.push({
    kind: entry.type,
    speaker: entry.type === "narration" ? "" : (entry.speaker || ""),
    text: entry.text || "",
    eventName: getRuntimeEvent()?.name || "",
    time: Date.now()
  });

  if (runtime.log.length > 200) runtime.log.splice(0, runtime.log.length - 200);
}

function addChoiceLog(entry, option) {
  runtime.log.push({
    kind: "choice",
    speaker: "CHOICE",
    text: (entry.prompt || "선택") + " → " + (option.label || "선택지"),
    eventName: getRuntimeEvent()?.name || "",
    time: Date.now()
  });

  runtime.choices.push({
    entryId: entry.id,
    optionId: option.id,
    optionLabel: option.label || "",
    eventId: runtime.eventId,
    time: Date.now()
  });

  if (runtime.log.length > 200) runtime.log.splice(0, runtime.log.length - 200);
  if (runtime.choices.length > 200) runtime.choices.splice(0, runtime.choices.length - 200);
}

/* ---------- PLAYBACK RENDER ---------- */

function renderEventSelect() {
  el.eventSelect.innerHTML = "";

  state.events.forEach(event => {
    const option = document.createElement("option");
    option.value = event.id;
    option.textContent = event.name;
    option.selected = event.id === runtime.eventId;
    el.eventSelect.append(option);
  });
}

function hideAllStageCards() {
  el.dialogueCard.hidden = true;
  el.choiceCard.hidden = true;
  el.emptyState.hidden = true;
  el.endState.hidden = true;
}

function showDialogue(entry, frame) {
  const narration = entry.type === "narration";
  const token = makeViewToken(entry);

  hideAllStageCards();
  el.dialogueCard.hidden = false;
  el.dialogueCard.classList.toggle("narration", narration);

  el.eventBadge.textContent = narration
    ? "NARRATION"
    : (runtime.frames.length > 1 ? "BRANCH" : "DIALOGUE");
  el.speakerName.textContent = narration ? "" : (entry.speaker.trim() || "UNKNOWN");
  el.progressText.textContent =
    frame.label + " · " + (frame.index + 1) + " / " + resolveFrameEntries(frame).length;

  const isRootEnd =
    runtime.frames.length === 1 &&
    frame.index === resolveFrameEntries(frame).length - 1 &&
    !getRuntimeEvent()?.nextEventId;

  el.nextLine.textContent = isRootEnd ? "끝" : "다음";

  addDialogueLog(entry, token);

  if (typing.token !== token) {
    startTyping(entry.text || "", token);
  } else {
    el.dialogueText.textContent = typing.done
      ? typing.fullText
      : typing.fullText.slice(0, typing.index);
  }
}

function showChoice(entry) {
  clearPlaybackTimers();

  hideAllStageCards();
  el.choiceCard.hidden = false;
  el.eventBadge.textContent = "CHOICE";
  el.choicePrompt.textContent = entry.prompt || "무엇을 선택할까?";
  el.choiceDepth.textContent =
    runtime.frames.length > 1 ? "분기 " + (runtime.frames.length - 1) + "단계" : "본편";
  el.choiceButtons.innerHTML = "";

  updateModeButtons();

  visibleOptions(entry).forEach(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-play-button";
    button.textContent = option.label || "이름 없는 선택지";
    button.addEventListener("click", () => chooseOption(entry, option));
    el.choiceButtons.append(button);
  });
}

function renderStage() {
  const initialEvent = getRuntimeEvent();

  if (!initialEvent) {
    renderEventSelect();
    el.eventTitle.textContent = "";
    hideAllStageCards();
    el.endState.hidden = false;
    return;
  }

  const playable = settlePlayback();
  const event = getRuntimeEvent();

  renderEventSelect();
  el.eventTitle.textContent = event?.name || "";

  if (!playable) {
    hideAllStageCards();
    el.endState.hidden = false;
    el.eventBadge.textContent = "END";
    clearPlaybackTimers();
    return;
  }

  const frame = currentFrame();
  const entry = resolveFrameEntries(frame)[frame.index];

  if (!entry) {
    hideAllStageCards();
    el.endState.hidden = false;
    return;
  }

  if (entry.type === "choice") showChoice(entry);
  else showDialogue(entry, frame);
}

function renderApp() {
  renderStage();
}

function switchPlaybackEvent(eventId) {
  clearPlaybackTimers();
  runtime = createRuntime(eventId);
  state.activeEventId = runtime.eventId;
  persistState();

  autoMode = false;
  viewToken = "";
  typing.token = "";

  updateModeButtons();
  renderApp();
}

function advanceDialogue(fromMode = false) {
  const frame = currentFrame();
  if (!frame || runtime.ended) return;

  const entry = resolveFrameEntries(frame)[frame.index];
  if (!entry || entry.type === "choice") return;

  if (!typing.done && !fromMode) {
    finishTyping();
    return;
  }

  clearPlaybackTimers();
  applyEffects(entry.effects);
  applyAffectionEffects(entry.affectionEffects);
  applyEmotionEffects(entry.emotionEffects);

  if (!runtime.seenEntries.includes(entry.id)) {
    runtime.seenEntries.push(entry.id);
  }

  frame.index += 1;
  typing.token = "";
  renderStage();
}

function chooseOption(entry, option) {
  const frame = currentFrame();
  if (!frame) return;

  clearPlaybackTimers();
  applyEffects(entry.effects);
  applyAffectionEffects(entry.affectionEffects);
  applyEmotionEffects(entry.emotionEffects);
  applyEffects(option.effects);
  applyAffectionEffects(option.affectionEffects);
  applyEmotionEffects(option.emotionEffects);

  if (!runtime.seenEntries.includes(entry.id)) {
    runtime.seenEntries.push(entry.id);
  }

  addChoiceLog(entry, option);
  frame.index += 1;

  if (option.entries.length) {
    runtime.frames.push({
      sourceType: "option",
      sourceId: option.id,
      index: 0,
      label: option.label || "선택 분기",
      exitMode: option.exitMode === "end" ? "end" : "continue",
      targetEventId: option.targetEventId || ""
    });
  } else if (option.targetEventId) {
    jumpToEvent(option.targetEventId);
  } else if (option.exitMode === "end") {
    finishCurrentEventNow();
  }

  typing.token = "";
  renderStage();
}

/* ---------- TITLE ---------- */

/* ---------- GAME MODAL ---------- */

function openGameModal(title) {
  clearModeTimer();
  el.gameModalTitle.textContent = title;
  el.gameModalBody.innerHTML = "";
  el.gameModal.hidden = false;
}

function closeGameModal() {
  el.gameModal.hidden = true;
  if (autoMode && typing.done) scheduleModeAdvance();
}

function openLogModal() {
  openGameModal("대사 로그");

  const list = document.createElement("div");
  list.className = "log-list";

  if (!runtime.log.length) {
    const empty = document.createElement("div");
    empty.className = "empty-note";
    empty.textContent = "아직 기록된 대사가 없습니다.";
    list.append(empty);
  } else {
    runtime.log.slice().reverse().forEach(item => {
      const row = document.createElement("article");
      row.className = "log-item" + (item.kind === "choice" ? " choice-log" : "");

      const label = document.createElement("small");
      label.textContent =
        (item.eventName ? item.eventName + " · " : "") +
        (item.kind === "narration" ? "지문" : (item.speaker || "대사"));

      const text = document.createElement("p");
      text.textContent = item.text;

      row.append(label, text);
      list.append(row);
    });
  }

  el.gameModalBody.append(list);
}

function openAffectionModal() {
  openGameModal("호감도");

  const list = document.createElement("div");
  list.className = "affection-list";

  if (!state.affectionTargets.length) {
    const empty = document.createElement("div");
    empty.className = "empty-note";
    empty.textContent = "등록된 호감도 대상이 없습니다.";
    list.append(empty);
  } else {
    state.affectionTargets.forEach(target => {
      const value = Math.min(100, Math.max(0, Number(runtime.affection[target.id] ?? target.initialValue) || 0));

      const card = document.createElement("article");
      card.className = "affection-card";

      const head = document.createElement("div");
      head.className = "affection-card-head";

      const name = document.createElement("strong");
      name.textContent = target.name;

      const score = document.createElement("span");
      score.textContent = value + " / 100";

      head.append(name, score);

      const track = document.createElement("div");
      track.className = "affection-track";

      const fill = document.createElement("div");
      fill.className = "affection-fill";
      fill.style.width = value + "%";
      track.append(fill);

      const sub = document.createElement("div");
      sub.className = "affection-sub";
      sub.textContent = value < 25 ? "낮음" : value < 50 ? "관심" : value < 75 ? "가까움" : "높음";

      card.append(head, track, sub);
      list.append(card);
    });
  }

  el.gameModalBody.append(list);
}

function openEmotionModal() {
  openGameModal("감정 상태");

  const list = document.createElement("div");
  list.className = "emotion-list";

  if (!state.emotionTargets.length) {
    const empty = document.createElement("div");
    empty.className = "empty-note";
    empty.textContent = "등록된 감정 대상이 없습니다.";
    list.append(empty);
  } else {
    state.emotionTargets.forEach(target => {
      const current = runtime.emotions[target.id] || {
        state: target.defaultState,
        intensity: target.defaultIntensity
      };

      const card = document.createElement("article");
      card.className = "emotion-card";

      const head = document.createElement("div");
      head.className = "emotion-card-head";

      const name = document.createElement("strong");
      name.textContent = target.name;

      const badge = document.createElement("span");
      badge.className = "emotion-badge";
      badge.textContent = emotionLabel(current.state);

      head.append(name, badge);

      const track = document.createElement("div");
      track.className = "emotion-track";

      const fill = document.createElement("div");
      fill.className = "emotion-fill";
      fill.style.width = current.intensity + "%";
      track.append(fill);

      const sub = document.createElement("div");
      sub.className = "emotion-sub";
      sub.textContent = "강도 " + current.intensity + " / 100";

      card.append(head, track, sub);
      list.append(card);
    });
  }

  el.gameModalBody.append(list);
}

function openPlaySettingsModal() {
  openGameModal("플레이 설정");

  const speed = makeRangeSetting(
    "텍스트 속도",
    prefs.textSpeed,
    0,
    80,
    1,
    value => value === 0 ? "즉시" : value + "ms",
    value => {
      prefs.textSpeed = Number(value);
      persistPrefs();
    }
  );

  const auto = makeRangeSetting(
    "AUTO 대기",
    prefs.autoDelay,
    250,
    3000,
    50,
    value => value + "ms",
    value => {
      prefs.autoDelay = Number(value);
      persistPrefs();
    }
  );

  const checkLabel = document.createElement("label");
  checkLabel.className = "setting-check";
  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = prefs.stageClick;
  check.addEventListener("change", event => {
    prefs.stageClick = event.target.checked;
    persistPrefs();
  });
  const checkText = document.createElement("span");
  checkText.textContent = "대화 화면 클릭으로 진행";
  checkLabel.append(check, checkText);

  el.gameModalBody.append(speed, auto, checkLabel);
}

function makeRangeSetting(label, value, min, max, step, format, onChange) {
  const wrap = document.createElement("div");
  wrap.className = "play-setting";

  const head = document.createElement("div");
  head.className = "play-setting-head";
  const name = document.createElement("span");
  name.textContent = label;
  const output = document.createElement("strong");
  output.textContent = format(value);
  head.append(name, output);

  const input = document.createElement("input");
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener("input", event => {
    output.textContent = format(Number(event.target.value));
    onChange(event.target.value);
  });

  wrap.append(head, input);
  return wrap;
}

/* ---------- EDITOR STATE ---------- */

function getDraftEvent() {
  return draftState?.events.find(event => event.id === draftActiveEventId) || null;
}

function openSettings() {
  clearPlaybackTimers();
  draftState = clone(state);
  draftActiveEventId = state.activeEventId;
  const event = getDraftEvent();
  selectedEntryId = event?.entries[0]?.id || null;

  el.projectPanel.hidden = true;
  renderEditor();
  el.settingsOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function cancelSettings() {
  draftState = null;
  draftActiveEventId = null;
  selectedEntryId = null;
  el.projectPanel.hidden = true;
  el.settingsOverlay.hidden = true;
  document.body.style.overflow = "";
}

function sanitizeLinks(project) {
  const eventIds = new Set(project.events.map(event => event.id));

  function cleanEntries(entries) {
    entries.forEach(entry => {
      if (entry.type !== "choice") return;

      entry.options.forEach(option => {
        if (option.targetEventId && !eventIds.has(option.targetEventId)) {
          option.targetEventId = "";
        }
        cleanEntries(option.entries);
      });
    });
  }

  project.events.forEach(event => {
    if (event.nextEventId && !eventIds.has(event.nextEventId)) {
      event.nextEventId = "";
    }
    cleanEntries(event.entries);
  });
}

function saveSettings() {
  if (!draftState) return;

  draftState = normalizeState(draftState);
  sanitizeLinks(draftState);

  if (!draftState.events.some(event => event.id === draftActiveEventId)) {
    draftActiveEventId = draftState.events[0].id;
  }

  draftState.activeEventId = draftActiveEventId;
  state = clone(draftState);
  persistState();

  runtime = createRuntime(state.activeEventId);
  viewToken = "";
  typing.token = "";
  renderApp();
  cancelSettings();
}

function switchDraftEvent(eventId) {
  if (!draftState?.events.some(event => event.id === eventId)) return;

  draftActiveEventId = eventId;
  const event = getDraftEvent();
  selectedEntryId = event.entries[0]?.id || null;
  renderEditor();
}

function createNewEvent() {
  if (!draftState) return;

  const event = {
    id: createId("event"),
    name: "새 이벤트",
    nextEventId: "",
    emotionExitMode: "keep",
    entries: []
  };

  draftState.events.push(event);
  draftActiveEventId = event.id;
  selectedEntryId = null;
  renderEditor();
  el.eventNameInput.focus();
  el.eventNameInput.select();
}

function deleteCurrentEvent() {
  if (!draftState) return;

  const currentIndex = draftState.events.findIndex(event => event.id === draftActiveEventId);
  if (currentIndex < 0) return;

  draftState.events.splice(currentIndex, 1);

  if (!draftState.events.length) {
    draftState.events.push({
      id: createId("event"),
      name: "새 이벤트",
      nextEventId: "",
      emotionExitMode: "keep",
      entries: []
    });
  }

  sanitizeLinks(draftState);

  const nextIndex = Math.min(currentIndex, draftState.events.length - 1);
  draftActiveEventId = draftState.events[nextIndex].id;
  selectedEntryId = draftState.events[nextIndex].entries[0]?.id || null;
  renderEditor();
}

function updateDraftEventName(value) {
  const event = getDraftEvent();
  if (!event) return;
  event.name = value;
  renderEditorEventList();
  renderEventNextSelect();
}

/* ---------- EDITOR RENDER ---------- */

function renderEditor() {
  const event = getDraftEvent();

  renderEditorEventList();
  renderEventNextSelect();

  if (!event) {
    el.eventNameInput.value = "";
    el.eventIdInput.value = "";
    el.entryCount.textContent = "0개";
    el.entryList.innerHTML = "";
    renderInspector();
    return;
  }

  el.eventNameInput.value = event.name;
  el.eventIdInput.value = event.id;
  el.eventNextSelect.value = event.nextEventId || "";
  el.eventEmotionExitSelect.value = event.emotionExitMode || "keep";

  renderFlowList();
  renderInspector();
  renderProjectPanel();
}

function renderEditorEventList() {
  el.editorEventList.innerHTML = "";
  if (!draftState) return;

  draftState.events.forEach(event => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "event-item" + (event.id === draftActiveEventId ? " active" : "");
    button.addEventListener("click", () => switchDraftEvent(event.id));

    const main = document.createElement("span");
    main.className = "event-item-main";

    const name = document.createElement("strong");
    name.textContent = event.name || "이름 없는 이벤트";

    const id = document.createElement("small");
    id.textContent = event.id;

    main.append(name, id);

    const count = document.createElement("span");
    count.className = "event-count";
    count.textContent = event.entries.length + "개";

    button.append(main, count);
    el.editorEventList.append(button);
  });
}

function renderEventNextSelect() {
  if (!draftState) return;

  const current = getDraftEvent();
  const selected = current?.nextEventId || "";

  el.eventNextSelect.innerHTML = "";

  const none = document.createElement("option");
  none.value = "";
  none.textContent = "이벤트 종료";
  el.eventNextSelect.append(none);

  draftState.events.forEach(event => {
    if (event.id === current?.id) return;

    const option = document.createElement("option");
    option.value = event.id;
    option.textContent = event.name;
    el.eventNextSelect.append(option);
  });

  el.eventNextSelect.value = selected;
}

function entryKind(entry) {
  if (entry.type === "choice") return "CHOICE";
  if (entry.type === "narration") return "NARRATION";
  return "DIALOGUE";
}

function entryLabel(entry) {
  if (entry.type === "choice") return entry.prompt || "질문을 입력하세요";
  if (entry.type === "narration") return entry.text || "빈 지문";

  const prefix = entry.speaker ? entry.speaker + ": " : "";
  return prefix + (entry.text || "빈 대사");
}

function renderFlowList() {
  const event = getDraftEvent();
  el.entryList.innerHTML = "";

  if (!event) {
    el.entryCount.textContent = "0개";
    return;
  }

  el.entryCount.textContent = event.entries.length + "개";

  if (!event.entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty-note";
    empty.textContent = "위 버튼으로 첫 항목을 추가하세요.";
    el.entryList.append(empty);
    return;
  }

  event.entries.forEach((entry, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "flow-item" +
      (entry.type === "choice" ? " choice" : "") +
      (entry.id === selectedEntryId ? " active" : "");

    button.addEventListener("click", () => {
      selectedEntryId = entry.id;
      renderFlowList();
      renderInspector();
    });

    const number = document.createElement("span");
    number.className = "flow-index";
    number.textContent = String(index + 1).padStart(2, "0");

    const main = document.createElement("span");
    main.className = "flow-main";

    const kind = document.createElement("span");
    kind.className = "flow-kind";
    kind.textContent = entryKind(entry);

    const preview = document.createElement("span");
    preview.className = "flow-preview";
    preview.textContent = entryLabel(entry);

    main.append(kind, preview);
    button.append(number, main);
    el.entryList.append(button);
  });
}

/* ---------- ENTRY LOOKUP / EDIT ---------- */

function findEntryContext(id, entries = getDraftEvent()?.entries || [], ancestors = []) {
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];

    if (entry.id === id) {
      return { entry, list: entries, index, ancestors };
    }

    if (entry.type === "choice") {
      for (const option of entry.options) {
        const found = findEntryContext(
          id,
          option.entries,
          [...ancestors, { choice: entry, option }]
        );
        if (found) return found;
      }
    }
  }

  return null;
}

function selectEntry(id) {
  selectedEntryId = id;
  renderFlowList();
  renderInspector();
}

function addEntryToList(list, type) {
  const entry = makeEntry(type);
  list.push(entry);
  selectedEntryId = entry.id;
  renderFlowList();
  renderInspector();
}

function moveSelectedEntry(direction) {
  const context = findEntryContext(selectedEntryId);
  if (!context) return;

  const target = context.index + direction;
  if (target < 0 || target >= context.list.length) return;

  [context.list[context.index], context.list[target]] =
    [context.list[target], context.list[context.index]];

  renderFlowList();
  renderInspector();
}

function regenerateIds(entry) {
  entry.id = createId("entry");
  entry.effects = normalizeEffects(entry.effects).map(effect => ({
    ...effect,
    id: createId("effect")
  }));
  entry.affectionEffects = normalizeAffectionEffects(entry.affectionEffects).map(effect => ({
    ...effect,
    id: createId("affection-effect")
  }));
  entry.emotionEffects = normalizeEmotionEffects(entry.emotionEffects).map(effect => ({
    ...effect,
    id: createId("emotion-effect")
  }));

  if (entry.type === "choice") {
    entry.options.forEach(option => {
      option.id = createId("option");
      option.effects = normalizeEffects(option.effects).map(effect => ({
        ...effect,
        id: createId("effect")
      }));
      option.affectionEffects = normalizeAffectionEffects(option.affectionEffects).map(effect => ({
        ...effect,
        id: createId("affection-effect")
      }));
      option.emotionEffects = normalizeEmotionEffects(option.emotionEffects).map(effect => ({
        ...effect,
        id: createId("emotion-effect")
      }));
      option.entries.forEach(regenerateIds);
    });
  }
}

function duplicateSelectedEntry() {
  const context = findEntryContext(selectedEntryId);
  if (!context) return;

  const copy = clone(context.entry);
  regenerateIds(copy);

  context.list.splice(context.index + 1, 0, copy);
  selectedEntryId = copy.id;

  renderFlowList();
  renderInspector();
}

function deleteSelectedEntry() {
  const context = findEntryContext(selectedEntryId);
  if (!context) return;

  context.list.splice(context.index, 1);

  const sibling = context.list[Math.min(context.index, context.list.length - 1)];
  const parent = context.ancestors.at(-1)?.choice;

  selectedEntryId = sibling?.id || parent?.id || getDraftEvent()?.entries[0]?.id || null;

  renderFlowList();
  renderInspector();
}

/* ---------- INSPECTOR BUILDERS ---------- */

function makeField(labelText, control) {
  const label = document.createElement("label");
  label.className = "field";

  const title = document.createElement("span");
  title.textContent = labelText;

  label.append(title, control);
  return label;
}

function makeTextInput(value, placeholder, onInput) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = value || "";
  input.placeholder = placeholder || "";
  input.addEventListener("input", event => onInput(event.target.value));
  return input;
}

function makeTextarea(value, placeholder, onInput) {
  const textarea = document.createElement("textarea");
  textarea.value = value || "";
  textarea.placeholder = placeholder || "";
  textarea.addEventListener("input", event => onInput(event.target.value));
  return textarea;
}

function makeSelect(options, value, onChange) {
  const select = document.createElement("select");

  options.forEach(([optionValue, label]) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = label;
    select.append(option);
  });

  select.value = value || "";
  select.addEventListener("change", event => onChange(event.target.value));
  return select;
}

function makeSection(title, help) {
  const section = document.createElement("section");
  section.className = "inspector-section";

  const heading = document.createElement("h4");
  heading.textContent = title;
  section.append(heading);

  if (help) {
    const note = document.createElement("p");
    note.className = "section-help";
    note.textContent = help;
    section.append(note);
  }

  return section;
}

function variableOptions(sourceState = draftState) {
  return [
    ["", "선택 안 함"],
    ...(sourceState?.variables || []).map(variable => [variable.id, variable.name])
  ];
}

function eventOptions(sourceState = draftState) {
  return [
    ["", "상위 흐름 계속"],
    ...(sourceState?.events || []).map(event => [event.id, event.name])
  ];
}

function branchExitOptions(owner, sourceState = draftState) {
  return [
    ["continue", "상위 흐름 계속"],
    ["end", "현재 이벤트 종료"],
    ...(sourceState?.events || []).map(event => ["event:" + event.id, "이벤트 이동 · " + event.name])
  ];
}

function getBranchExitValue(owner) {
  if (owner.targetEventId) return "event:" + owner.targetEventId;
  return owner.exitMode === "end" ? "end" : "continue";
}

function renderConditionEditor(owner) {
  const wrap = document.createElement("div");

  if (!owner.condition) owner.condition = null;
  const condition = owner.condition || { variableId: "", operator: "==", value: "" };

  const grid = document.createElement("div");
  grid.className = "rule-grid";

  const variable = makeSelect(variableOptions(), condition.variableId, value => {
    if (!value) {
      owner.condition = null;
      renderInspector();
      return;
    }

    owner.condition = {
      variableId: value,
      operator: owner.condition?.operator || "==",
      value: owner.condition?.value ?? ""
    };
  });

  const operator = makeSelect([
    ["==", "="],
    ["!=", "≠"],
    [">", ">"],
    [">=", "≥"],
    ["<", "<"],
    ["<=", "≤"],
    ["truthy", "참"],
    ["falsy", "거짓"]
  ], condition.operator, value => {
    if (!owner.condition) return;
    owner.condition.operator = value;
  });

  const value = makeTextInput(condition.value, "비교 값", newValue => {
    if (!owner.condition) return;
    owner.condition.value = newValue;
  });

  grid.append(variable, operator, value);

  const label = document.createElement("p");
  label.className = "section-help";
  label.textContent = "조건이 맞을 때만 이 항목이 표시됩니다.";

  wrap.append(label, grid);
  return wrap;
}

function renderEffectsEditor(owner) {
  const wrap = document.createElement("div");
  const help = document.createElement("p");
  help.className = "section-help";
  help.textContent = "이 항목이 끝나거나 선택됐을 때 변수 값을 변경합니다.";
  wrap.append(help);

  const list = document.createElement("div");
  list.className = "effect-list";

  owner.effects = normalizeEffects(owner.effects);

  owner.effects.forEach((effect, index) => {
    const row = document.createElement("div");
    row.className = "effect-row";

    const variable = makeSelect(variableOptions(), effect.variableId, value => {
      effect.variableId = value;
    });

    const operation = makeSelect([
      ["set", "대입"],
      ["add", "더하기"],
      ["subtract", "빼기"],
      ["toggle", "토글"]
    ], effect.operation, value => {
      effect.operation = value;
    });

    const value = makeTextInput(effect.value, "값", newValue => {
      effect.value = newValue;
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "효과 삭제");
    remove.addEventListener("click", () => {
      owner.effects.splice(index, 1);
      renderInspector();
    });

    row.append(variable, operation, value, remove);
    list.append(row);
  });

  if (!owner.effects.length) {
    const empty = document.createElement("div");
    empty.className = "empty-note";
    empty.textContent = "변수 효과 없음";
    list.append(empty);
  }

  const add = document.createElement("button");
  add.type = "button";
  add.className = "inline-add";
  add.textContent = "+ 변수 효과 추가";
  add.addEventListener("click", () => {
    owner.effects.push({
      id: createId("effect"),
      variableId: draftState?.variables[0]?.id || "",
      operation: "set",
      value: "0"
    });
    renderInspector();
  });

  wrap.append(list, add);
  return wrap;
}

function affectionTargetOptions(sourceState = draftState) {
  return [
    ["", "대상 선택"],
    ...(sourceState?.affectionTargets || []).map(target => [target.id, target.name])
  ];
}

function renderAffectionConditionEditor(owner) {
  const wrap = document.createElement("div");

  const label = document.createElement("p");
  label.className = "affection-section-label";
  label.textContent = "호감도 조건";

  const condition = owner.affectionCondition || { targetId: "", operator: ">=", value: 0 };
  const grid = document.createElement("div");
  grid.className = "affection-condition-grid";

  const target = makeSelect(affectionTargetOptions(), condition.targetId, value => {
    if (!value) {
      owner.affectionCondition = null;
      renderInspector();
      return;
    }
    owner.affectionCondition = {
      targetId: value,
      operator: owner.affectionCondition?.operator || ">=",
      value: owner.affectionCondition?.value ?? 0
    };
  });

  const operator = makeSelect([
    [">=", "≥"],
    [">", ">"],
    ["==", "="],
    ["!=", "≠"],
    ["<=", "≤"],
    ["<", "<"]
  ], condition.operator, value => {
    if (!owner.affectionCondition) return;
    owner.affectionCondition.operator = value;
  });

  const amount = makeTextInput(String(condition.value ?? 0), "값", value => {
    if (!owner.affectionCondition) return;
    owner.affectionCondition.value = Number(value) || 0;
  });
  amount.type = "number";
  amount.min = "0";
  amount.max = "100";

  grid.append(target, operator, amount);
  wrap.append(label, grid);
  return wrap;
}

function renderAffectionEffectsEditor(owner) {
  const wrap = document.createElement("div");

  const label = document.createElement("p");
  label.className = "affection-section-label";
  label.textContent = "호감도 변화";

  const list = document.createElement("div");
  list.className = "option-affection-list";

  owner.affectionEffects = normalizeAffectionEffects(owner.affectionEffects);

  owner.affectionEffects.forEach((effect, index) => {
    const row = document.createElement("div");
    row.className = "option-affection-row";

    const target = makeSelect(affectionTargetOptions(), effect.targetId, value => {
      effect.targetId = value;
    });

    const amount = makeTextInput(String(effect.amount), "+ / -", value => {
      effect.amount = Number(value) || 0;
    });
    amount.type = "number";
    amount.className = "affection-amount";
    amount.min = "-100";
    amount.max = "100";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "inline-remove";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      owner.affectionEffects.splice(index, 1);
      renderInspector();
    });

    row.append(target, amount, remove);
    list.append(row);
  });

  if (!owner.affectionEffects.length) {
    const empty = document.createElement("div");
    empty.className = "affection-empty";
    empty.textContent = draftState?.affectionTargets?.length
      ? "변화 없음"
      : "프로젝트 설정에서 호감도 대상을 먼저 추가하세요.";
    list.append(empty);
  }

  const add = document.createElement("button");
  add.type = "button";
  add.className = "inline-add";
  add.textContent = "+ 호감도 변화";
  add.disabled = !draftState?.affectionTargets?.length;
  add.addEventListener("click", () => {
    owner.affectionEffects.push({
      id: createId("affection-effect"),
      targetId: draftState.affectionTargets[0]?.id || "",
      amount: 1
    });
    renderInspector();
  });

  wrap.append(label, list, add);
  return wrap;
}

function emotionTargetOptions(sourceState = draftState) {
  return [
    ["", "대상 선택"],
    ...(sourceState?.emotionTargets || []).map(target => [target.id, target.name])
  ];
}

function emotionStateOptions(includeAny = false) {
  return [
    ...(includeAny ? [["", "감정 무관"]] : []),
    ...EMOTION_STATES
  ];
}

function renderEmotionConditionEditor(owner) {
  const wrap = document.createElement("div");

  const label = document.createElement("p");
  label.className = "emotion-section-label";
  label.textContent = "감정 조건";

  const condition = owner.emotionCondition || {
    targetId: "",
    state: "",
    intensityOperator: ">=",
    intensityValue: 0
  };

  const grid = document.createElement("div");
  grid.className = "emotion-condition-grid";

  const target = makeSelect(emotionTargetOptions(), condition.targetId, value => {
    if (!value) {
      owner.emotionCondition = null;
      renderInspector();
      return;
    }
    owner.emotionCondition = {
      targetId: value,
      state: owner.emotionCondition?.state || "",
      intensityOperator: owner.emotionCondition?.intensityOperator || ">=",
      intensityValue: owner.emotionCondition?.intensityValue ?? 0
    };
  });

  const stateSelect = makeSelect(emotionStateOptions(true), condition.state, value => {
    if (!owner.emotionCondition) return;
    owner.emotionCondition.state = value;
  });

  const operator = makeSelect([
    [">=", "강도 ≥"],
    [">", "강도 >"],
    ["==", "강도 ="],
    ["!=", "강도 ≠"],
    ["<=", "강도 ≤"],
    ["<", "강도 <"]
  ], condition.intensityOperator, value => {
    if (!owner.emotionCondition) return;
    owner.emotionCondition.intensityOperator = value;
  });

  const intensity = makeTextInput(String(condition.intensityValue ?? 0), "강도", value => {
    if (!owner.emotionCondition) return;
    owner.emotionCondition.intensityValue = Math.min(100, Math.max(0, Number(value) || 0));
  });
  intensity.type = "number";
  intensity.min = "0";
  intensity.max = "100";
  intensity.className = "emotion-intensity";

  grid.append(target, stateSelect, operator, intensity);
  wrap.append(label, grid);
  return wrap;
}

function renderEmotionEffectsEditor(owner) {
  const wrap = document.createElement("div");

  const label = document.createElement("p");
  label.className = "emotion-section-label";
  label.textContent = "감정 변화";

  const list = document.createElement("div");
  list.className = "option-emotion-list";

  owner.emotionEffects = normalizeEmotionEffects(owner.emotionEffects);

  owner.emotionEffects.forEach((effect, index) => {
    const row = document.createElement("div");
    row.className = "option-emotion-row";

    const target = makeSelect(emotionTargetOptions(), effect.targetId, value => {
      effect.targetId = value;
    });

    const stateSelect = makeSelect(emotionStateOptions(), effect.state, value => {
      effect.state = value;
    });

    const intensity = makeTextInput(String(effect.intensity), "강도", value => {
      effect.intensity = Math.min(100, Math.max(0, Number(value) || 0));
    });
    intensity.type = "number";
    intensity.min = "0";
    intensity.max = "100";
    intensity.className = "emotion-intensity";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "inline-remove";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      owner.emotionEffects.splice(index, 1);
      renderInspector();
    });

    row.append(target, stateSelect, intensity, remove);
    list.append(row);
  });

  if (!owner.emotionEffects.length) {
    const empty = document.createElement("div");
    empty.className = "emotion-empty";
    empty.textContent = draftState?.emotionTargets?.length
      ? "감정 변화 없음"
      : "프로젝트 설정에서 감정 대상을 먼저 추가하세요.";
    list.append(empty);
  }

  const add = document.createElement("button");
  add.type = "button";
  add.className = "inline-add";
  add.textContent = "+ 감정 변화";
  add.disabled = !draftState?.emotionTargets?.length;
  add.addEventListener("click", () => {
    const target = draftState.emotionTargets[0];
    owner.emotionEffects.push({
      id: createId("emotion-effect"),
      targetId: target?.id || "",
      state: target?.defaultState || "calm",
      intensity: target?.defaultIntensity || 0
    });
    renderInspector();
  });

  wrap.append(label, list, add);
  return wrap;
}

function renderAdvancedDetails(owner, includeTarget = false, skipAffectionEffects = false, skipEmotionEffects = false) {
  const details = document.createElement("details");
  details.className = "advanced-details";

  const summary = document.createElement("summary");
  summary.textContent = includeTarget
    ? "고급 · 조건 / 호감도 / 감정 / 변수 / 이벤트 이동"
    : "고급 · 조건 / 호감도 / 감정 / 변수";

  const body = document.createElement("div");
  body.className = "advanced-body";

  const condition = document.createElement("div");
  condition.append(renderConditionEditor(owner));

  const affection = document.createElement("div");
  affection.append(renderAffectionConditionEditor(owner));
  if (!skipAffectionEffects) {
    affection.append(renderAffectionEffectsEditor(owner));
  }

  const emotion = document.createElement("div");
  emotion.append(renderEmotionConditionEditor(owner));
  if (!skipEmotionEffects) {
    emotion.append(renderEmotionEffectsEditor(owner));
  }

  const effects = document.createElement("div");
  effects.append(renderEffectsEditor(owner));

  body.append(condition, affection, emotion, effects);

  if (includeTarget) {
    const exit = makeSelect(branchExitOptions(owner), getBranchExitValue(owner), value => {
      if (value.startsWith("event:")) {
        owner.targetEventId = value.slice(6);
        owner.exitMode = "continue";
      } else {
        owner.targetEventId = "";
        owner.exitMode = value === "end" ? "end" : "continue";
      }
    });
    body.append(makeField("분기 종료 후", exit));
  }

  details.append(summary, body);
  return details;
}

/* ---------- INSPECTOR RENDER ---------- */

function renderInspector() {
  const context = findEntryContext(selectedEntryId);
  const hasEntry = Boolean(context);

  el.emptyInspector.hidden = hasEntry;
  el.entryInspector.hidden = !hasEntry;

  if (!context) return;

  const entry = context.entry;
  el.inspectorTypeBadge.textContent = entryKind(entry);
  el.inspectorTitle.textContent =
    entry.type === "choice" ? "선택지 편집" :
    entry.type === "narration" ? "지문 편집" : "대사 편집";

  el.moveEntryUp.disabled = context.index === 0;
  el.moveEntryDown.disabled = context.index === context.list.length - 1;

  renderBreadcrumb(context);
  el.inspectorBody.innerHTML = "";

  if (entry.type === "choice") {
    renderChoiceInspector(entry);
  } else if (entry.type === "narration") {
    renderNarrationInspector(entry);
  } else {
    renderDialogueInspector(entry);
  }
}

function renderBreadcrumb(context) {
  el.inspectorBreadcrumb.innerHTML = "";

  const root = document.createElement("span");
  root.textContent = "본편";
  el.inspectorBreadcrumb.append(root);

  context.ancestors.forEach(({ choice, option }) => {
    const slash = document.createElement("span");
    slash.textContent = " / ";
    el.inspectorBreadcrumb.append(slash);

    const choiceButton = document.createElement("button");
    choiceButton.type = "button";
    choiceButton.textContent = choice.prompt || "선택지";
    choiceButton.addEventListener("click", () => selectEntry(choice.id));
    el.inspectorBreadcrumb.append(choiceButton);

    const optionText = document.createElement("span");
    optionText.textContent = " → " + (option.label || "분기");
    el.inspectorBreadcrumb.append(optionText);
  });
}

function renderDialogueInspector(entry) {
  const section = makeSection("대사 내용", "화자와 화면에 표시될 문장을 입력합니다.");

  const speaker = makeTextInput(entry.speaker, "화자 이름", value => {
    entry.speaker = value;
    renderFlowList();
  });

  const text = makeTextarea(entry.text, "대사를 입력하세요.", value => {
    entry.text = value;
    renderFlowList();
  });

  section.append(
    makeField("화자", speaker),
    makeField("대사", text),
    renderAdvancedDetails(entry)
  );

  el.inspectorBody.append(section);
}

function renderNarrationInspector(entry) {
  const section = makeSection("지문 내용", "화자 없이 표시되는 설명 문장입니다.");

  const text = makeTextarea(entry.text, "지문을 입력하세요.", value => {
    entry.text = value;
    renderFlowList();
  });

  section.append(
    makeField("글", text),
    renderAdvancedDetails(entry)
  );

  el.inspectorBody.append(section);
}

function renderChoiceInspector(choice) {
  const questionSection = makeSection(
    "질문 / 상황",
    "플레이 화면에서 선택지 버튼 위에 표시됩니다."
  );

  const prompt = makeTextarea(choice.prompt, "무엇을 선택할까?", value => {
    choice.prompt = value;
    renderFlowList();
  });

  questionSection.append(
    makeField("표시 문구", prompt),
    renderAdvancedDetails(choice)
  );
  el.inspectorBody.append(questionSection);

  const optionsSection = makeSection(
    "선택지",
    "각 선택지마다 별도의 분기 흐름, 조건, 변수 효과, 이벤트 이동을 설정할 수 있습니다."
  );

  const list = document.createElement("div");
  list.className = "option-list";

  choice.options.forEach((option, index) => {
    list.append(renderOptionCard(choice, option, index));
  });

  if (!choice.options.length) {
    const empty = document.createElement("div");
    empty.className = "empty-note";
    empty.textContent = "선택지가 없습니다.";
    list.append(empty);
  }

  const add = document.createElement("button");
  add.type = "button";
  add.className = "add-option";
  add.textContent = "+ 선택지 추가";
  add.addEventListener("click", () => {
    choice.options.push(makeOption("선택지 " + (choice.options.length + 1)));
    renderInspector();
  });

  optionsSection.append(list, add);
  el.inspectorBody.append(optionsSection);

  const note = document.createElement("div");
  note.className = "info-note";
  note.textContent =
    "분기 내용이 끝나면 상위 흐름으로 복귀합니다. 선택지에 이벤트 이동을 지정하면 분기 종료 후 해당 이벤트로 넘어갑니다.";
  el.inspectorBody.append(note);
}

function renderOptionCard(choice, option, optionIndex) {
  const card = document.createElement("article");
  card.className = "option-card";

  const header = document.createElement("div");
  header.className = "option-header";

  const labelInput = makeTextInput(option.label, "선택지 문구", value => {
    option.label = value;
  });
  header.append(makeField("선택지 " + (optionIndex + 1), labelInput));

  const actions = document.createElement("div");
  actions.className = "option-actions";

  const up = document.createElement("button");
  up.type = "button";
  up.textContent = "↑";
  up.title = "위로 이동";
  up.disabled = optionIndex === 0;
  up.addEventListener("click", () => {
    [choice.options[optionIndex - 1], choice.options[optionIndex]] =
      [choice.options[optionIndex], choice.options[optionIndex - 1]];
    renderInspector();
  });

  const down = document.createElement("button");
  down.type = "button";
  down.textContent = "↓";
  down.title = "아래로 이동";
  down.disabled = optionIndex === choice.options.length - 1;
  down.addEventListener("click", () => {
    [choice.options[optionIndex + 1], choice.options[optionIndex]] =
      [choice.options[optionIndex], choice.options[optionIndex + 1]];
    renderInspector();
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "×";
  remove.title = "선택지 삭제";
  remove.className = "remove-option";
  remove.addEventListener("click", () => {
    choice.options.splice(optionIndex, 1);
    renderInspector();
  });

  actions.append(up, down, remove);
  header.append(actions);

  const branchArea = document.createElement("div");
  branchArea.className = "branch-area";

  const branchTop = document.createElement("div");
  branchTop.className = "branch-top";

  const branchLabel = document.createElement("span");
  branchLabel.textContent = "선택 후 재생 · " + option.entries.length + "개";

  const branchAdds = document.createElement("div");
  branchAdds.className = "branch-adds";

  [
    ["dialogue", "+ 대사"],
    ["narration", "+ 지문"],
    ["choice", "+ 선택지"]
  ].forEach(([type, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    if (type === "choice") button.className = "nested-choice";
    button.addEventListener("click", () => addEntryToList(option.entries, type));
    branchAdds.append(button);
  });

  branchTop.append(branchLabel, branchAdds);

  const branchList = document.createElement("div");
  branchList.className = "branch-list";

  if (!option.entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty-note";
    empty.textContent = "선택 후 바로 상위 흐름으로 이어집니다.";
    branchList.append(empty);
  } else {
    option.entries.forEach((entry, index) => {
      branchList.append(renderBranchRow(option, entry, index));
    });
  }

  const affectionEditor = document.createElement("div");
  affectionEditor.className = "option-affection";
  affectionEditor.append(renderAffectionEffectsEditor(option));

  const emotionEditor = document.createElement("div");
  emotionEditor.className = "option-emotion";
  emotionEditor.append(renderEmotionEffectsEditor(option));

  branchArea.append(branchTop, branchList, renderAdvancedDetails(option, true, true, true));
  card.append(header, affectionEditor, emotionEditor, branchArea);
  return card;
}

function renderBranchRow(option, entry, index) {
  const row = document.createElement("div");
  row.className = "branch-row";

  const main = document.createElement("button");
  main.type = "button";
  main.className = "branch-row-main";
  main.addEventListener("click", () => selectEntry(entry.id));

  const kind = document.createElement("small");
  kind.textContent = entryKind(entry);

  const preview = document.createElement("span");
  preview.textContent = entryLabel(entry);

  main.append(kind, preview);

  const actions = document.createElement("div");
  actions.className = "branch-row-actions";

  const up = document.createElement("button");
  up.type = "button";
  up.textContent = "↑";
  up.title = "위로 이동";
  up.disabled = index === 0;
  up.addEventListener("click", () => {
    [option.entries[index - 1], option.entries[index]] =
      [option.entries[index], option.entries[index - 1]];
    renderInspector();
  });

  const down = document.createElement("button");
  down.type = "button";
  down.textContent = "↓";
  down.title = "아래로 이동";
  down.disabled = index === option.entries.length - 1;
  down.addEventListener("click", () => {
    [option.entries[index + 1], option.entries[index]] =
      [option.entries[index], option.entries[index + 1]];
    renderInspector();
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "×";
  remove.title = "삭제";
  remove.addEventListener("click", () => {
    option.entries.splice(index, 1);
    if (selectedEntryId === entry.id) selectedEntryId = null;
    renderFlowList();
    renderInspector();
  });

  actions.append(up, down, remove);
  row.append(main, actions);
  return row;
}

/* ---------- PROJECT PANEL ---------- */

function renderProjectPanel() {
  if (!draftState) return;
  renderAffectionTargetList();
  renderEmotionTargetList();
  renderVariableList();
  renderAssetList();
}

function renderAffectionTargetList() {
  el.affectionTargetList.innerHTML = "";

  draftState.affectionTargets.forEach((target, index) => {
    const row = document.createElement("div");
    row.className = "affection-target-row";

    const name = makeTextInput(target.name, "대상 이름", value => {
      target.name = value;
    });

    const initial = makeTextInput(String(target.initialValue), "시작값", value => {
      target.initialValue = Math.min(100, Math.max(0, Number(value) || 0));
    });
    initial.type = "number";
    initial.min = "0";
    initial.max = "100";
    initial.className = "affection-initial";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "inline-remove";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      const targetId = target.id;
      draftState.affectionTargets.splice(index, 1);
      removeAffectionReferences(targetId);
      renderProjectPanel();
      renderInspector();
    });

    row.append(name, initial, remove);
    el.affectionTargetList.append(row);
  });

  if (!draftState.affectionTargets.length) {
    const empty = document.createElement("div");
    empty.className = "empty-note";
    empty.textContent = "등록된 호감도 대상이 없습니다.";
    el.affectionTargetList.append(empty);
  }
}

function removeAffectionReferences(targetId) {
  function cleanOwner(owner) {
    if (owner.affectionCondition?.targetId === targetId) owner.affectionCondition = null;
    owner.affectionEffects = normalizeAffectionEffects(owner.affectionEffects)
      .filter(effect => effect.targetId !== targetId);
  }

  function cleanEntries(entries) {
    entries.forEach(entry => {
      cleanOwner(entry);
      if (entry.type === "choice") {
        entry.options.forEach(option => {
          cleanOwner(option);
          cleanEntries(option.entries);
        });
      }
    });
  }

  draftState.events.forEach(event => cleanEntries(event.entries));
}

function renderEmotionTargetList() {
  el.emotionTargetList.innerHTML = "";

  draftState.emotionTargets.forEach((target, index) => {
    const row = document.createElement("div");
    row.className = "emotion-target-row";

    const name = makeTextInput(target.name, "대상 이름", value => {
      target.name = value;
    });

    const stateSelect = makeSelect(emotionStateOptions(), target.defaultState, value => {
      target.defaultState = value;
    });

    const intensity = makeTextInput(String(target.defaultIntensity), "강도", value => {
      target.defaultIntensity = Math.min(100, Math.max(0, Number(value) || 0));
    });
    intensity.type = "number";
    intensity.min = "0";
    intensity.max = "100";
    intensity.className = "emotion-intensity";

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "inline-remove";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      const targetId = target.id;
      draftState.emotionTargets.splice(index, 1);
      removeEmotionReferences(targetId);
      renderProjectPanel();
      renderInspector();
    });

    row.append(name, stateSelect, intensity, remove);
    el.emotionTargetList.append(row);
  });

  if (!draftState.emotionTargets.length) {
    const empty = document.createElement("div");
    empty.className = "empty-note";
    empty.textContent = "등록된 감정 대상이 없습니다.";
    el.emotionTargetList.append(empty);
  }
}

function removeEmotionReferences(targetId) {
  function cleanOwner(owner) {
    if (owner.emotionCondition?.targetId === targetId) owner.emotionCondition = null;
    owner.emotionEffects = normalizeEmotionEffects(owner.emotionEffects)
      .filter(effect => effect.targetId !== targetId);
  }

  function cleanEntries(entries) {
    entries.forEach(entry => {
      cleanOwner(entry);
      if (entry.type === "choice") {
        entry.options.forEach(option => {
          cleanOwner(option);
          cleanEntries(option.entries);
        });
      }
    });
  }

  draftState.events.forEach(event => cleanEntries(event.entries));
}

function renderVariableList() {
  el.variableList.innerHTML = "";

  draftState.variables.forEach((variable, index) => {
    const row = document.createElement("div");
    row.className = "project-row";

    const name = makeTextInput(variable.name, "변수 이름", value => {
      variable.name = value;
    });

    const type = makeSelect([
      ["number", "숫자"],
      ["boolean", "참/거짓"],
      ["string", "문자"]
    ], variable.type, value => {
      variable.type = value;
    });

    const initial = makeTextInput(variable.defaultValue, "초기값", value => {
      variable.defaultValue = value;
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "inline-remove";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      const removedId = variable.id;
      draftState.variables.splice(index, 1);
      removeVariableReferences(removedId);
      renderProjectPanel();
      renderInspector();
    });

    row.append(name, type, initial, remove);
    el.variableList.append(row);
  });

  if (!draftState.variables.length) {
    const empty = document.createElement("div");
    empty.className = "empty-note";
    empty.textContent = "등록된 변수가 없습니다.";
    el.variableList.append(empty);
  }
}

function removeVariableReferences(variableId) {
  function cleanOwner(owner) {
    if (owner.condition?.variableId === variableId) owner.condition = null;
    owner.effects = normalizeEffects(owner.effects).filter(effect => effect.variableId !== variableId);
  }

  function cleanEntries(entries) {
    entries.forEach(entry => {
      cleanOwner(entry);
      if (entry.type === "choice") {
        entry.options.forEach(option => {
          cleanOwner(option);
          cleanEntries(option.entries);
        });
      }
    });
  }

  draftState.events.forEach(event => cleanEntries(event.entries));
}

function renderAssetList() {
  el.assetList.innerHTML = "";

  draftState.assets.forEach((asset, index) => {
    const row = document.createElement("div");
    row.className = "project-row asset-row";

    const type = makeSelect([
      ["image", "이미지"],
      ["audio", "오디오"],
      ["other", "기타"]
    ], asset.type, value => {
      asset.type = value;
    });

    const name = makeTextInput(asset.name, "리소스 이름", value => {
      asset.name = value;
    });

    const source = makeTextInput(asset.source, "파일 또는 URL", value => {
      asset.source = value;
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "inline-remove";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      draftState.assets.splice(index, 1);
      renderAssetList();
    });

    row.append(type, name, source, remove);
    el.assetList.append(row);
  });

  if (!draftState.assets.length) {
    const empty = document.createElement("div");
    empty.className = "empty-note";
    empty.textContent = "등록된 리소스가 없습니다.";
    el.assetList.append(empty);
  }
}

/* ---------- UI EVENTS ---------- */

el.eventSelect.addEventListener("change", event => {
  switchPlaybackEvent(event.target.value);
});

el.nextLine.addEventListener("click", () => advanceDialogue(false));
el.openSettings.addEventListener("click", openSettings);
el.emptyOpenSettings.addEventListener("click", openSettings);

el.autoButton.addEventListener("click", toggleAuto);
el.logButton.addEventListener("click", openLogModal);
el.affectionButton.addEventListener("click", openAffectionModal);
el.emotionButton.addEventListener("click", openEmotionModal);
el.playSettingsButton.addEventListener("click", openPlaySettingsModal);


el.closeGameModal.addEventListener("click", closeGameModal);
el.gameModal.addEventListener("click", event => {
  if (event.target === el.gameModal) closeGameModal();
});

el.projectSettings.addEventListener("click", () => {
  el.projectPanel.hidden = false;
  renderProjectPanel();
});
el.closeProjectPanel.addEventListener("click", () => {
  el.projectPanel.hidden = true;
});
el.cancelSettings.addEventListener("click", cancelSettings);
el.saveSettings.addEventListener("click", saveSettings);
el.newEvent.addEventListener("click", createNewEvent);
el.deleteEvent.addEventListener("click", deleteCurrentEvent);

el.eventNameInput.addEventListener("input", event => {
  updateDraftEventName(event.target.value);
});

el.eventNextSelect.addEventListener("change", event => {
  const current = getDraftEvent();
  if (current) current.nextEventId = event.target.value;
});

el.eventEmotionExitSelect.addEventListener("change", event => {
  const current = getDraftEvent();
  if (current) current.emotionExitMode = event.target.value === "reset" ? "reset" : "keep";
});

el.addTypeButtons.forEach(button => {
  button.addEventListener("click", () => {
    const event = getDraftEvent();
    if (!event) return;
    addEntryToList(event.entries, button.dataset.addType);
  });
});

el.moveEntryUp.addEventListener("click", () => moveSelectedEntry(-1));
el.moveEntryDown.addEventListener("click", () => moveSelectedEntry(1));
el.duplicateEntry.addEventListener("click", duplicateSelectedEntry);
el.deleteEntry.addEventListener("click", deleteSelectedEntry);

el.addAffectionTarget.addEventListener("click", () => {
  if (!draftState) return;

  draftState.affectionTargets.push({
    id: createId("affection"),
    name: "새 대상",
    initialValue: 0
  });

  renderProjectPanel();
  renderInspector();
});

el.addEmotionTarget.addEventListener("click", () => {
  if (!draftState) return;

  draftState.emotionTargets.push({
    id: createId("emotion"),
    name: "새 대상",
    defaultState: "calm",
    defaultIntensity: 0
  });

  renderProjectPanel();
  renderInspector();
});

el.addVariable.addEventListener("click", () => {
  if (!draftState) return;

  draftState.variables.push({
    id: createId("var"),
    name: "새 변수",
    type: "number",
    defaultValue: "0"
  });

  renderProjectPanel();
  renderInspector();
});

el.addAsset.addEventListener("click", () => {
  if (!draftState) return;

  draftState.assets.push({
    id: createId("asset"),
    type: "image",
    name: "새 리소스",
    source: ""
  });

  renderAssetList();
});

el.stage.addEventListener("click", event => {
  if (!prefs.stageClick || !el.gameModal.hidden || !el.settingsOverlay.hidden) return;

  const tag = event.target?.tagName;
  if (["BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;

  if (!el.choiceCard.hidden) return;
  advanceDialogue(false);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (!el.gameModal.hidden) {
      closeGameModal();
      return;
    }

    if (!el.settingsOverlay.hidden) {
      cancelSettings();
      return;
    }
  }

  if (!el.settingsOverlay.hidden || !el.gameModal.hidden) return;

  if (event.key === " " || event.key === "Enter") {
    if (document.activeElement === el.eventSelect || !el.choiceCard.hidden) return;
    event.preventDefault();
    advanceDialogue(false);
  }
});

/* ---------- BOOT ---------- */

state = normalizeState(state);
persistState();
persistPrefs();
renderApp();
updateModeButtons();