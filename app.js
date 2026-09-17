(function () {
  "use strict";

  var templateDNA = "TACCGAAAAATT";
  var targetRNA = "AUGGCUUUUUAA";
  var translationPlan = [
    { codon: "AUG", amino: "met", short: "מ", name: "מתיונין", color: "#c5f577", asset: "assets/3d/web/amino-methionine.webp" },
    { codon: "GCU", amino: "ala", short: "א", name: "אלנין", color: "#4ce7e1", asset: "assets/3d/web/amino-alanine.webp" },
    { codon: "UUU", amino: "phe", short: "פ", name: "פנילאלנין", color: "#ad8cff", asset: "assets/3d/web/amino-phenylalanine.webp" },
    { codon: "UAA", amino: "release", short: "", name: "סיום התירגום", color: "#ff7b8b" }
  ];

  var state = {
    scene: "cell",
    launched: false,
    studentName: "",
    startedAt: null,
    completedAt: null,
    thresholdSolved: false,
    cellRevealed: false,
    chromosomeMistakes: 0,
    transcriptionIndex: 0,
    baseMistakes: {},
    transferStep: 0,
    transferPassedGate: false,
    transferDragging: false,
    transferMoved: false,
    suppressCargoClickUntil: 0,
    ribosomeAssembly: 0,
    translationIndex: 0,
    points: 30,
    sound: true,
    quizIndex: 0,
    quizAnswered: false,
    quizCorrect: 0,
    maxUnlockedPhase: 0,
    sceneHistory: [],
    lastSceneByPhase: { cell: "cell" },
    missionByScene: {},
    milestones: {
      enteredNucleus: false,
      chromosomeFound: false,
      geneFound: false,
      transcriptionStarted: false,
      transcriptionComplete: false,
      transferStarted: false,
      transferComplete: false,
      translationStarted: false,
      translationComplete: false
    },
    performance: {
      thresholdMistakes: 0,
      organelleMistakes: 0,
      chromosomeMistakes: 0,
      geneMistakes: 0,
      transcriptionMistakes: 0,
      transferMistakes: 0,
      translationMistakes: 0,
      quizMistakes: 0,
      pointsLost: 0,
      quizAnswers: []
    },
    celebrationUntil: 0
  };

  var sceneIds = {
    cell: "cellScene",
    nucleus: "nucleusScene",
    gene: "geneScene",
    transcription: "transcriptionScene",
    transfer: "transferScene",
    translation: "translationScene",
    complete: "completeScene"
  };

  var phaseOrder = ["cell", "nucleus", "transcription", "transfer", "translation", "complete"];
  var scenePhase = {
    cell: "cell",
    nucleus: "nucleus",
    gene: "nucleus",
    transcription: "transcription",
    transfer: "transfer",
    translation: "translation",
    complete: "complete"
  };

  var depthNames = {
    cell: "מחוץ לתא",
    nucleus: "גרעין התא",
    gene: "רמת ה־DNA",
    transcription: "בתוך הגרעין",
    transfer: "מעטפת הגרעין",
    translation: "ציטופלזמה",
    complete: "הקוד פוענח"
  };

  var quizQuestions = [
    {
      question: "היכן מתרחש השעתוק בתא איקריוטי?",
      options: ["בגרעין", "על ממברנת התא", "בתוך הריבוזום"],
      correct: 0,
      explanation: "נכון: השעתוק מתרחש בגרעין, שבו נמצא רוב ה־DNA של התא."
    },
    {
      question: "איזה נוקלאוטיד RNA משלים ל־A ב־DNA?",
      options: ["T", "U", "G"],
      correct: 1,
      explanation: "ב־RNA אין T. הנוקלאוטיד U משלים ל־A שב־DNA."
    },
    {
      question: "מהו קודון?",
      options: ["שלושה נוקלאוטידים של RNA", "חומצה אמינית אחת", "כרומוזום שלם"],
      correct: 0,
      explanation: "קודון הוא רצף של שלושה נוקלאוטידים של RNA שמציין חומצה אמינית או אות עצירה."
    },
    {
      question: "מה תפקידו של UAA?",
      options: ["להתחיל שעתוק", "לקודד למתיונין", "לאותת על עצירה"],
      correct: 2,
      explanation: "UAA הוא קודון עצירה. אין לו חומצה אמינית תואמת; גורם שחרור מסיים את התרגום."
    },
    {
      question: "היכן מתרחש התרגום?",
      options: ["בריבוזום", "בגרעין", "על הכרומוזום"],
      correct: 0,
      explanation: "הריבוזום קורא את ה־RNA בציטופלזמה ובונה שרשרת חומצות אמיניות."
    }
  ];

  var initialMission = {
    kicker: "משימה 01",
    status: "ממתין לסריקה",
    symbol: "?",
    title: "חידת השער החי",
    description: "האות האבוד מסתתר מעבר לגבול התא. זהו את המבנה שמפריד בין פנים התא לסביבתו והפעילו את הסורק.",
    clueLabel: "חידת הסף",
    clue: "אני הגבול הגמיש של התא. אני בורר מה נכנס ומה יוצא, אך איני קיר אטום. מי אני?",
    fact: "ממברנת התא אינה קיר אטום: היא מווסתת אילו חומרים נכנסים לתא ויוצאים ממנו.",
    transmissionLabel: "תיק החירום // נקודת כניסה",
    transmission: "ה־<bdi dir='ltr'>DNA</bdi> המקורי עדיין שלם. הדרך אליו עוברת דרך הגבול החי של התא."
  };

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  var missionKicker = $("#missionKicker");
  var missionStatus = $("#missionStatus");
  var missionTitle = $("#missionTitle");
  var missionDescription = $("#missionDescription");
  var missionClue = $("#missionClue");
  var missionAction = $("#missionAction");
  var microFact = $("#microFact");
  var storyTransmission = $("#storyTransmission");
  var depthLabel = $("#depthLabel b");
  var stageMessage = $("#stageMessage");
  var stageMessageIcon = $("#stageMessageIcon");
  var stageMessageText = $("#stageMessageText");
  var messageTimer = 0;
  var sceneTransitionTimer = 0;
  var magnifierTimer = 0;
  var celebrationTimer = 0;
  var actionHandler = null;
  var audioContext = null;

  function setSignal() {}

  function setMission(config) {
    missionKicker.textContent = config.kicker;
    missionStatus.textContent = config.status;
    missionTitle.innerHTML = config.title;
    missionDescription.innerHTML = config.description;
    $("strong", missionClue).textContent = config.clueLabel || "היעד שלכם";
    $("small", missionClue).innerHTML = config.clue;
    $("span", microFact).textContent = config.factLabel || "טיפ מהמעבדה";
    $("p", microFact).innerHTML = config.fact;
    microFact.hidden = Boolean(config.hideFact);
    storyTransmission.hidden = Boolean(config.hideTransmission);
    if (config.transmission) {
      storyTransmission.hidden = false;
      $("span", storyTransmission).textContent = config.transmissionLabel || "שידור מוצפן // עדכון";
      $("p", storyTransmission).innerHTML = config.transmission;
    }
    if (config.action) {
      missionAction.hidden = false;
      $("span", missionAction).innerHTML = config.action;
      actionHandler = config.onAction || null;
    } else {
      missionAction.hidden = true;
      actionHandler = null;
    }
    state.missionByScene[state.scene] = config;
  }

  function showMessage(text, type, duration) {
    window.clearTimeout(messageTimer);
    stageMessageText.innerHTML = text;
    stageMessageIcon.textContent = type === "error" ? "×" : type === "success" ? "✓" : "i";
    stageMessage.classList.remove("is-error", "is-success");
    if (type) stageMessage.classList.add("is-" + type);
    stageMessage.classList.add("is-visible");
    messageTimer = window.setTimeout(function () {
      stageMessage.classList.remove("is-visible");
    }, duration || 2200);
  }

  function updatePhase(phaseName) {
    var current = phaseOrder.indexOf(phaseName);
    $$(".phase").forEach(function (phase, index) {
      var unlocked = index <= state.maxUnlockedPhase;
      phase.classList.toggle("is-current", index === current);
      phase.classList.toggle("is-complete", index < current && unlocked);
      phase.classList.toggle("is-unlocked", unlocked);
      phase.disabled = !unlocked;
      if (index === current) phase.setAttribute("aria-current", "step");
      else phase.removeAttribute("aria-current");
    });
  }

  function updateBackButton() {
    var button = $("#backButton");
    button.disabled = state.sceneHistory.length === 0;
    button.setAttribute("aria-disabled", String(button.disabled));
  }

  function snapshotCurrentMission() {
    var current = state.missionByScene[state.scene] || {};
    state.missionByScene[state.scene] = Object.assign({}, current, {
      kicker: missionKicker.textContent,
      status: missionStatus.textContent,
      title: missionTitle.innerHTML,
      description: missionDescription.innerHTML,
      clueLabel: $("strong", missionClue).textContent,
      clue: $("small", missionClue).innerHTML,
      factLabel: $("span", microFact).textContent,
      fact: $("p", microFact).innerHTML,
      hideFact: microFact.hidden,
      hideTransmission: storyTransmission.hidden,
      transmissionLabel: $("span", storyTransmission).textContent,
      transmission: storyTransmission.hidden ? "" : $("p", storyTransmission).innerHTML,
      action: missionAction.hidden ? "" : $("span", missionAction).innerHTML,
      onAction: actionHandler
    });
  }

  function showScene(name, remember) {
    if (state.scene === name) {
      updatePhase(scenePhase[name]);
      depthLabel.textContent = depthNames[name];
      updateBackButton();
      return;
    }

    if (remember !== false && state.sceneHistory[state.sceneHistory.length - 1] !== state.scene) {
      state.sceneHistory.push(state.scene);
    }
    snapshotCurrentMission();
    window.clearTimeout(sceneTransitionTimer);
    $$(".scene").forEach(function (scene) {
      scene.classList.remove("is-leaving");
      if (scene.dataset.scene !== state.scene) scene.classList.remove("is-active");
    });
    var previous = $("#" + sceneIds[state.scene]);
    var next = $("#" + sceneIds[name]);
    if (previous) {
      previous.classList.add("is-leaving");
      sceneTransitionTimer = window.setTimeout(function () {
        previous.classList.remove("is-active", "is-leaving");
      }, 560);
    }
    next.classList.remove("is-leaving");
    next.classList.add("is-active");
    var stage = next.closest(".stage");
    if (stage) stage.classList.toggle("stage--celebration", name === "complete" && !next.classList.contains("is-quiz"));
    state.scene = name;
    var phaseName = scenePhase[name];
    var phaseIndex = phaseOrder.indexOf(phaseName);
    state.maxUnlockedPhase = Math.max(state.maxUnlockedPhase, phaseIndex);
    state.lastSceneByPhase[phaseName] = name;
    depthLabel.textContent = depthNames[name];
    updatePhase(phaseName);
    updateBackButton();
    var codeDialog = $("#codeDialog");
    if (codeDialog && codeDialog.open) codeDialog.close();
  }

  function restoreScene(name, remember) {
    showScene(name, remember);
    if (state.missionByScene[name]) setMission(state.missionByScene[name]);
  }

  function goBack() {
    var target = state.sceneHistory.pop();
    while (target === state.scene && state.sceneHistory.length) target = state.sceneHistory.pop();
    if (!target) {
      updateBackButton();
      return;
    }
    restoreScene(target, false);
  }

  function jumpToPhase(phaseName) {
    var phaseIndex = phaseOrder.indexOf(phaseName);
    if (phaseIndex < 0 || phaseIndex > state.maxUnlockedPhase) return;
    var fallbackScenes = {
      cell: "cell",
      nucleus: "nucleus",
      transcription: "transcription",
      transfer: "transfer",
      translation: "translation",
      complete: "complete"
    };
    restoreScene(state.lastSceneByPhase[phaseName] || fallbackScenes[phaseName], true);
  }

  function initAudio() {
    if (!state.sound || audioContext) return;
    var AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return;
    audioContext = new AudioEngine();
  }

  function tone(frequency, duration, delay, wave, volume) {
    if (!state.sound) return;
    initAudio();
    if (!audioContext) return;
    if (audioContext.state === "suspended") audioContext.resume();
    var start = audioContext.currentTime + (delay || 0);
    var oscillator = audioContext.createOscillator();
    var gain = audioContext.createGain();
    oscillator.type = wave || "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume || 0.05, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  function soundCorrect() {
    tone(520, .18, 0, "sine", .045);
    tone(690, .2, .11, "sine", .04);
    tone(880, .24, .22, "triangle", .035);
  }

  function soundVictory(grandFinale) {
    var lift = grandFinale ? 1.12 : 1;
    tone(523 * lift, .2, 0, "triangle", .045);
    tone(659 * lift, .22, .13, "triangle", .045);
    tone(784 * lift, .25, .27, "triangle", .05);
    tone(1047 * lift, .48, .42, "sine", .04);
    tone(1319 * lift, .58, .5, "sine", .025);
  }

  function setCompletionMode(mode) {
    var scene = $("#completeScene");
    if (!scene) return;
    scene.classList.remove("is-prequiz", "is-quiz", "is-finale");
    scene.classList.add("is-" + mode);
    var stage = scene.closest(".stage");
    if (stage) stage.classList.toggle("stage--celebration", mode !== "quiz");
    if (mode === "quiz") {
      window.clearTimeout(celebrationTimer);
      $("#celebrationBurst").innerHTML = "";
      scene.classList.remove("is-celebrating");
    }
  }

  function launchCelebration(pieceCount) {
    var scene = $("#completeScene");
    var burst = $("#celebrationBurst");
    if (!scene || !burst) return;
    window.clearTimeout(celebrationTimer);
    burst.innerHTML = "";
    scene.classList.remove("is-celebrating");
    void scene.offsetWidth;
    scene.classList.add("is-celebrating");

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var colors = ["#4ce7e1", "#c5f577", "#ad8cff", "#ffbd67", "#ff7b8b", "#ffffff"];
      var fragment = document.createDocumentFragment();
      for (var index = 0; index < pieceCount; index += 1) {
        var particle = document.createElement("i");
        var side = index % 2 === 0 ? 1 : -1;
        particle.className = index % 7 === 0 ? "is-star" : index % 5 === 0 ? "is-dot" : "is-ribbon";
        particle.style.setProperty("--origin-x", side === 1 ? (2 + Math.random() * 8) + "%" : (90 + Math.random() * 8) + "%");
        particle.style.setProperty("--burst-x", (side * (100 + Math.random() * Math.max(220, window.innerWidth * .42))) + "px");
        particle.style.setProperty("--burst-y", (-(260 + Math.random() * Math.max(240, window.innerHeight * .48))) + "px");
        particle.style.setProperty("--landing-x", (side * (80 + Math.random() * Math.max(260, window.innerWidth * .58))) + "px");
        var spin = side * (620 + Math.random() * 1080);
        particle.style.setProperty("--mid-spin", (spin * .52) + "deg");
        particle.style.setProperty("--spin", spin + "deg");
        particle.style.setProperty("--delay", (Math.random() * .42) + "s");
        particle.style.setProperty("--duration", (3.1 + Math.random() * 1.35) + "s");
        particle.style.setProperty("--size", (6 + Math.random() * 7) + "px");
        particle.style.setProperty("--confetti-color", colors[index % colors.length]);
        fragment.appendChild(particle);
      }
      burst.appendChild(fragment);
    }

    celebrationTimer = window.setTimeout(function () {
      burst.innerHTML = "";
      scene.classList.remove("is-celebrating");
    }, 5200);
  }

  function animateFinalScore(target) {
    var output = $("#finalScore");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      output.textContent = String(target);
      return;
    }
    var started = performance.now();
    var duration = 1150;
    output.textContent = "0";
    function count(now) {
      var progress = Math.min(1, (now - started) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      output.textContent = String(Math.round(target * eased));
      if (progress < 1) window.requestAnimationFrame(count);
    }
    window.requestAnimationFrame(count);
  }

  function soundStep() {
    tone(310, .12, 0, "sine", .035);
    tone(465, .18, .08, "triangle", .03);
  }

  function soundWrong() {
    tone(170, .17, 0, "sawtooth", .025);
    tone(140, .2, .1, "sawtooth", .02);
  }

  function addPoints(amount) {
    state.points = Math.max(0, state.points + amount);
    var output = $("#sparkCount");
    output.textContent = String(state.points);
    output.parentElement.animate([
      { transform: "scale(1)" },
      { transform: "scale(1.12)", borderColor: amount < 0 ? "rgba(255,114,143,.8)" : "rgba(197,245,119,.65)" },
      { transform: "scale(1)" }
    ], { duration: 430, easing: "ease-out" });
  }

  function penalize(metric, amount) {
    state.performance[metric] += 1;
    state.performance.pointsLost += amount;
    addPoints(-amount);
    return " <strong class='point-loss'>−" + amount + " נקודות</strong>";
  }

  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function hideOrganelleMagnifier() {
    window.clearTimeout(magnifierTimer);
    var magnifier = $("#organelleMagnifier");
    if (!magnifier) return;
    magnifier.classList.remove("is-visible");
    magnifier.setAttribute("aria-hidden", "true");
  }

  function showOrganelleMagnifier(hotspot) {
    var magnifier = $("#organelleMagnifier");
    var viewport = $(".organelle-magnifier__viewport", magnifier);
    var zoomedImage = $("#organelleMagnifierImage");
    var cellWrap = $(".cell-wrap");
    var sourceImage = $(".cell-interior-asset");
    var wrapRect = cellWrap.getBoundingClientRect();
    var sourceRect = sourceImage.getBoundingClientRect();
    var targetRect = hotspot.getBoundingClientRect();
    var magnifierSize = Math.min(218, Math.max(142, wrapRect.width * .34));
    var centerX = targetRect.left + targetRect.width / 2 - wrapRect.left;
    var centerY = targetRect.top + targetRect.height / 2 - wrapRect.top;
    var proposedLeft = centerX < wrapRect.width / 2
      ? centerX + targetRect.width * .6
      : centerX - magnifierSize - targetRect.width * .6;
    var proposedTop = centerY - magnifierSize * .55;
    var left = Math.max(8, Math.min(wrapRect.width - magnifierSize - 8, proposedLeft));
    var top = Math.max(8, Math.min(wrapRect.height - magnifierSize - 34, proposedTop));
    var zoom = 2.65;
    var sourceX = targetRect.left + targetRect.width / 2 - sourceRect.left;
    var sourceY = targetRect.top + targetRect.height / 2 - sourceRect.top;

    magnifier.style.width = magnifierSize + "px";
    magnifier.style.left = left + "px";
    magnifier.style.top = top + "px";
    viewport.style.height = magnifierSize + "px";
    zoomedImage.style.width = (sourceRect.width * zoom) + "px";
    zoomedImage.style.height = (sourceRect.height * zoom) + "px";
    zoomedImage.style.left = (magnifierSize / 2 - sourceX * zoom) + "px";
    zoomedImage.style.top = (magnifierSize / 2 - sourceY * zoom) + "px";
    $("#organelleMagnifierLabel").textContent = hotspot.dataset.label || hotspot.getAttribute("aria-label");
    magnifier.dataset.for = hotspot.className.split(" ").filter(function (name) { return name.indexOf("organelle-hotspot--") === 0; })[0] || hotspot.dataset.organelle;
    hotspot.classList.remove("is-inspected");
    void hotspot.offsetWidth;
    hotspot.classList.add("is-inspected");
    magnifier.classList.add("is-visible");
    magnifier.setAttribute("aria-hidden", "false");
    window.clearTimeout(magnifierTimer);
    magnifierTimer = window.setTimeout(hideOrganelleMagnifier, 3200);
  }

  function answerThreshold(button) {
    if (state.thresholdSolved) return;
    if (button.dataset.answer !== "cell-membrane") {
      button.disabled = true;
      soundWrong();
      vibrate(45);
      showMessage("זה אינו הגבול הגמיש שמקיף את כל התא." + penalize("thresholdMistakes", 2), "error", 2600);
      return;
    }

    state.thresholdSolved = true;
    button.classList.add("is-correct");
    addPoints(8);
    soundCorrect();
    $("#thresholdAnswers").hidden = true;
    $("#cellShell").classList.add("is-unlocked");
    $("#cellShell").setAttribute("aria-label", "ממברנת התא — לחצו כדי להפוך אותה לשקופה");
    showMessage("נכון — זוהי ממברנת התא. עכשיו לחצו עליה כדי לחשוף את פנים התא.", "success", 3100);
    missionAction.hidden = false;
    $("span", missionAction).textContent = "הפכו את הממברנה לשקופה";
    actionHandler = revealCell;
  }

  function revealCell() {
    if (!state.thresholdSolved) {
      showMessage("תחילה פתרו את חידת הסף שבחלונית המשימה.", "error");
      return;
    }
    if (state.cellRevealed) return;
    state.cellRevealed = true;
    $("#cellScene").classList.add("is-scanning");
    $("#cellShell").setAttribute("aria-disabled", "true");
    window.setTimeout(function () {
      $(".cell-wrap").classList.add("is-revealed");
      $("#nucleusHotspot").tabIndex = 0;
      $$(".organelle-hotspot").forEach(function (item) { item.tabIndex = 0; });
      $("#cellLabel").lastChild.textContent = " תא בסריקה · הממברנה שקופה";
      addPoints(10);
      soundCorrect();
      showMessage("הסריקה הושלמה — אברוני התא נחשפו", "success", 2600);
      setMission({
        kicker: "משימה 02",
        status: "האברונים נחשפו",
        symbol: "◎",
        title: "חידת הכספת התאית",
        description: "ממברנת התא נעשתה שקופה. בין האברונים מסתתרת הכספת שמגינה על ההוראות המקוריות.",
        clueLabel: "חידת האברון",
        clue: "רוב ה־<bdi dir='ltr'>DNA</bdi> של התא שמור בתוכי",
        fact: "למיטוכונדריה יש מעט DNA משלה. אבל באיזה אברון שמור רוב ה־DNA של תא איקריוטי?",
        signal: 18,
        transmissionLabel: "שידור מוצפן // רשומה 01",
        transmission: "הסריקה קלטה שהמקור נמצא מאחורי מעטפת כפולה. זהו את הכספת ולחצו עליה."
      });
    }, 520);
    window.setTimeout(function () { $("#cellScene").classList.remove("is-scanning"); }, 1500);
  }

  function enterNucleus() {
    if (!state.cellRevealed) return;
    hideOrganelleMagnifier();
    if (state.milestones.enteredNucleus) {
      restoreScene("nucleus", true);
      return;
    }
    state.milestones.enteredNucleus = true;
    addPoints(15);
    soundStep();
    showMessage("נכנסתם לגרעין — הספרייה הגדולה של ה־DNA", "success", 2300);
    showScene("nucleus");
    setMission({
      kicker: "משימה 03",
      status: "סורק כרומוזומים",
      symbol: "⌬",
      title: "פענחו את כרומוזום המפתח",
      description: "ה־<bdi dir='ltr'>DNA</bdi> הארוך מאורגן בכרומוזומים. מה מספר הכרומוזום שבו נמצא הגן המבוקש?",
      clueLabel: "חידת המספר",
      clue: "מספר הכרומוזום הוא הסכום של מספר הנוקלאוטידים בקודון ושל מספר סוגי הנוקלאוטידים ב־<bdi dir='ltr'>DNA</bdi>.",
      fact: "כרומוזום הוא מולקולת DNA ארוכה המלופפת סביב חלבונים. לכל כרומוזום גנים רבים.",
      signal: 28,
      transmissionLabel: "שידור מוצפן // רשומה 02",
      transmission: "הקואורדינטות נמחקו. חשבו את המספר: נוקלאוטידים בקודון + סוגי נוקלאוטידים ב־<bdi dir='ltr'>DNA</bdi>."
    });
  }

  function selectChromosome(button) {
    if (button.dataset.chromosome !== "7") {
      state.chromosomeMistakes += 1;
      var loss = penalize("chromosomeMistakes", 3);
      button.animate([
        { transform: getComputedStyle(button).transform },
        { translate: "-6px 0" },
        { translate: "6px 0" },
        { translate: "0 0" }
      ], { duration: 360 });
      soundWrong();
      showMessage((state.chromosomeMistakes >= 2
        ? "רמז: קודון בנוי מ־3 נוקלאוטידים, וב־DNA יש 4 סוגי נוקלאוטידים. 3 + 4 = ?"
        : "זה אינו הכרומוזום המבוקש. פענחו שוב את המספר.") + loss, "error", 3200);
      return;
    }

    if (state.milestones.chromosomeFound) {
      restoreScene("gene", true);
      return;
    }
    state.milestones.chromosomeFound = true;
    button.classList.add("is-found");
    addPoints(20);
    soundCorrect();
    showMessage("כרומוזום 7 אותר — מתקרבים אל רצף ה־DNA", "success", 1900);
    window.setTimeout(function () {
      showScene("gene");
      setMission({
        kicker: "משימה 04",
        status: "מיפוי רצף DNA",
        symbol: "⌇",
        title: "גלו את קפסולת ההוראות",
        description: "לא כל הכרומוזום יועתק. ההודעה הפגומה כוללת ארבע שלשות, ובכל שלשה שלושה נוקלאוטידים. מצאו גן באורך המתאים.",
        clueLabel: "חידת הגן",
        clue: "4 שלשות × 3 נוקלאוטידים בכל שלשה = כמה נוקלאוטידים צריך להכיל הגן?",
        fact: "רק גן מסוים בכרומוזום נפתח ומשועתק בכל פעם — לא כל ה־DNA בבת אחת.",
        signal: 38,
        transmissionLabel: "שידור מוצפן // רשומה 03",
        transmission: "המקור קרוב. מצאו את קפסולת המידע שבתוך סליל ה־<bdi dir='ltr'>DNA</bdi>."
      });
    }, 850);
  }

  function selectGene(button) {
    if (button.dataset.gene !== "target") {
      soundWrong();
      showMessage("אורך הגן אינו מתאים. חשבו: 4 × 3 נוקלאוטידים." + penalize("geneMistakes", 2), "error");
      button.animate([{ scale: 1 }, { scale: .88 }, { scale: 1 }], { duration: 330 });
      return;
    }

    if (state.milestones.geneFound) {
      startTranscription();
      return;
    }
    state.milestones.geneFound = true;
    addPoints(25);
    soundCorrect();
    showMessage("הגן אותר! גדיל התבנית נחשף.", "success", 1800);
    window.setTimeout(startTranscription, 800);
  }

  function buildHelix() {
    var helix = $("#dnaHelix");
    if ($(".dna-asset", helix)) return;
    for (var i = 0; i < 33; i += 1) {
      var rung = document.createElement("i");
      var wave = i / 32 * Math.PI * 4;
      var scale = .24 + .76 * ((Math.cos(wave) + 1) / 2);
      rung.className = "helix-rung";
      rung.style.left = (i * 3.02) + "%";
      rung.style.top = (50 + Math.sin(wave) * 23) + "%";
      rung.style.height = (42 + scale * 28) + "%";
      rung.style.opacity = (.42 + scale * .58).toFixed(2);
      rung.style.transform = "translateY(-50%) rotate(" + (-34 + scale * 68) + "deg) scaleY(" + scale.toFixed(2) + ")";
      helix.appendChild(rung);
    }
  }

  function renderTranscription() {
    var templateRow = $("#templateRow");
    var rnaRow = $("#rnaRow");
    templateRow.innerHTML = "";
    rnaRow.innerHTML = "";

    templateDNA.split("").forEach(function (base, index) {
      var cell = document.createElement("span");
      cell.className = "base-cell" + (index === 0 ? " is-current" : "");
      cell.innerHTML = "<b>" + base + "</b>";
      cell.dataset.index = String(index);
      cell.style.setProperty("--strand-step", String(index));
      cell.style.setProperty("--strand-y", [8, 2, -3, -7, -10, -12, -12, -10, -7, -3, 2, 8][index] + "px");
      templateRow.appendChild(cell);

      var slot = document.createElement("span");
      slot.className = "base-cell" + (index === 0 ? " is-drop-target" : "");
      slot.innerHTML = index === 0 ? "<i aria-hidden='true'>+</i>" : "";
      slot.dataset.index = String(index);
      slot.style.setProperty("--strand-step", String(index));
      slot.style.setProperty("--strand-offset", (index % 2 ? 4 : 0) + "px");
      slot.style.setProperty("--molecule-angle", ((index - 5) * 3) + "deg");
      slot.setAttribute("aria-label", "מקום " + (index + 1) + " בשרשרת RNA");
      slot.addEventListener("dragover", function (event) {
        if (index === state.transcriptionIndex) event.preventDefault();
      });
      slot.addEventListener("drop", function (event) {
        event.preventDefault();
        chooseBase(event.dataTransfer.getData("text/base"));
      });
      rnaRow.appendChild(slot);
    });
  }

  function startTranscription() {
    if (state.milestones.transcriptionStarted) {
      restoreScene("transcription", true);
      return;
    }
    state.milestones.transcriptionStarted = true;
    state.transcriptionIndex = 0;
    state.baseMistakes = {};
    renderTranscription();
    $(".polymerase-machine").style.left = "15%";
    showScene("transcription");
    setMission({
      kicker: "משימה 05",
      status: "שעתוק בתהליך",
      symbol: "≋",
      title: "שחזרו את ההודעה הפגומה",
      description: "ה־<bdi dir='ltr'>DNA</bdi> חייב להישאר מוגן. בנו ממנו עותק <bdi dir='ltr'>RNA</bdi> מדויק — נוקלאוטיד שגוי עלול לשנות קודון ואת החומצה האמינית שיצור.",
      clueLabel: "חידת הזיווג",
      clue: "בתוך בועת השעתוק, בדקו את נוקלאוטיד ה־<bdi dir='ltr'>DNA</bdi> המואר ובחרו מן המגש את נוקלאוטיד ה־<bdi dir='ltr'>RNA</bdi> המשלים לו.",
      fact: "ב־RNA אין T; במקומו מופיע U. כל נוקלאוטיד מצטרף לפי כללי ההתאמה.",
      signal: 44,
      transmissionLabel: "שידור מוצפן // מקור נמצא",
      transmission: "רצף ה־<bdi dir='ltr'>RNA</bdi> שנקלט: <bdi dir='ltr'>AUG GCU UUU ???</bdi>. השלימו את כל 12 הנוקלאוטידים כדי לחשוף את הסיום."
    });
  }

  function baseName(base) {
    return { A: "A", U: "U", C: "C", G: "G" }[base] || base;
  }

  function chooseBase(base, sourceButton) {
    if (state.scene !== "transcription" || state.transcriptionIndex >= targetRNA.length) return;
    var expected = targetRNA[state.transcriptionIndex];
    var templateBase = templateDNA[state.transcriptionIndex];
    if (base !== expected) {
      state.baseMistakes[state.transcriptionIndex] = (state.baseMistakes[state.transcriptionIndex] || 0) + 1;
      soundWrong();
      vibrate(45);
      showMessage(baseName(base) + " אינו משלים ל־" + templateBase + ". בדקו את מפתח ההתאמה." + penalize("transcriptionMistakes", 2), "error", 2100);
      if (sourceButton) {
        sourceButton.classList.remove("is-wrong");
        void sourceButton.offsetWidth;
        sourceButton.classList.add("is-wrong");
      }
      if (state.baseMistakes[state.transcriptionIndex] >= 2) {
        var hint = $(".base-token[data-base='" + expected + "']");
        hint.animate([
          { boxShadow: "0 0 0 rgba(197,245,119,0)" },
          { boxShadow: "0 0 24px rgba(197,245,119,.75)" },
          { boxShadow: "0 0 0 rgba(197,245,119,0)" }
        ], { duration: 900, iterations: 2 });
      }
      return;
    }

    var index = state.transcriptionIndex;
    var templateCells = $$("#templateRow .base-cell");
    var rnaCells = $$("#rnaRow .base-cell");
    templateCells[index].classList.remove("is-current");
    rnaCells[index].classList.remove("is-drop-target");
    rnaCells[index].classList.add("is-filled");
    rnaCells[index].innerHTML = "";
    var nucleotideAsset = document.createElement("img");
    nucleotideAsset.className = "rna-nucleotide-asset";
    nucleotideAsset.src = "assets/3d/web/nucleotide-" + expected.toLowerCase() + ".webp";
    nucleotideAsset.alt = "נוקלאוטיד " + expected;
    var nucleotideLetter = document.createElement("b");
    nucleotideLetter.className = "rna-nucleotide-letter";
    nucleotideLetter.textContent = expected;
    rnaCells[index].appendChild(nucleotideAsset);
    rnaCells[index].appendChild(nucleotideLetter);
    state.transcriptionIndex += 1;
    addPoints(5);
    soundStep();
    setSignal(44 + Math.round(state.transcriptionIndex / targetRNA.length * 22));

    $("#transcriptionProgress").textContent = state.transcriptionIndex + " / 12";
    $("#transcriptionBar").style.width = (state.transcriptionIndex / 12 * 100) + "%";
    var polymeraseLimit = window.innerWidth <= 480 ? 67 : window.innerWidth <= 850 ? 72 : 76;
    $(".polymerase-machine").style.left = (15 + state.transcriptionIndex / targetRNA.length * (polymeraseLimit - 15)) + "%";

    if (state.transcriptionIndex < targetRNA.length) {
      templateCells[state.transcriptionIndex].classList.add("is-current");
      rnaCells[state.transcriptionIndex].classList.add("is-drop-target");
      rnaCells[state.transcriptionIndex].innerHTML = "<i aria-hidden='true'>+</i>";
      var nextTemplate = templateDNA[state.transcriptionIndex];
      var nextExpected = targetRNA[state.transcriptionIndex];
      $("small", missionClue).innerHTML = "בגדיל התבנית מואר כעת " + nextTemplate + ". איזה נוקלאוטיד <bdi dir='ltr'>RNA</bdi> משלים לו?";
      if (state.transcriptionIndex % 3 === 0) {
        showMessage("שלושה נוקלאוטידים נוספים הועתקו — אנזים השעתוק ממשיך", "success", 1350);
      }
      return;
    }

    finishTranscription();
  }

  function finishTranscription() {
    if (state.milestones.transcriptionComplete) return;
    state.milestones.transcriptionComplete = true;
    addPoints(20);
    soundCorrect();
    vibrate([30, 40, 30]);
    showMessage("ההודעה הועתקה: נוצרה מולקולת RNA בת 12 נוקלאוטידים", "success", 3200);
    setMission({
      kicker: "שעתוק הושלם",
      status: "RNA מוכן להעברה",
      symbol: "✓",
      title: "השלשה החסרה שוחזרה",
      description: "נוצר <bdi dir='ltr'>RNA</bdi> משלים בן 12 נוקלאוטידים. כעת העותק צריך לצאת מן הגרעין ולהגיע לריבוזום שבציטופלזמה.",
      clueLabel: "המשך המשימה",
      clue: "הוציאו את ההודעה דרך שער מבוקר במעטפת הגרעין",
      fact: "שעתוק הוא יצירת RNA לפי גדיל תבנית של DNA. בתא איקריוטי הוא מתרחש בגרעין.",
      signal: 68,
      hideTransmission: true,
      action: "קחו את ה־RNA אל הציטופלזמה",
      onAction: startTransfer
    });
  }

  function startTransfer() {
    if (state.milestones.transferStarted) {
      restoreScene("transfer", true);
      return;
    }
    state.milestones.transferStarted = true;
    showScene("transfer");
    state.transferStep = 0;
    state.transferPassedGate = false;
    setMission({
      kicker: "משימה 06",
      status: "ניווט בציטופלזמה",
      symbol: "↝",
      title: "העבירו את ההודעה",
      description: "ה־<bdi dir='ltr'>DNA</bdi> נשאר בכספת. רק העותק יכול לעבור אל אתר התרגום.",
      clueLabel: "מסלול ההעברה",
      clue: "בחרו את ה־<bdi dir='ltr'>RNA</bdi>, העבירו אותו דרך הנקב המשובץ במעטפת הגרעין, ומסרו אותו לריבוזום.",
      fact: "נקבי הגרעין הם שערים מבוקרים למעבר מולקולות בין הגרעין לציטופלזמה.",
      signal: 72,
      transmissionLabel: "מסלול מילוט // נעול",
      transmission: "בחרו את ה־<bdi dir='ltr'>RNA</bdi>, העבירו אותו דרך השער הנכון, ואז מסרו אותו לריבוזום."
    });
  }

  function selectCargo() {
    if (Date.now() < state.suppressCargoClickUntil || state.scene !== "transfer") return;
    state.transferStep = Math.max(state.transferStep, 1);
    $("#rnaCargo").classList.add("is-selected");
    $("#nuclearGate").classList.add("is-armed");
    soundStep();
    showMessage("ה־RNA מוכן. עכשיו זהו את השער והעבירו אותו דרכו.", "success");
  }

  function selectGate() {
    if (state.scene !== "transfer") return;
    if (state.transferStep < 1) {
      soundWrong();
      showMessage("קודם בחרו את מולקולת ה־RNA." + penalize("transferMistakes", 2), "error");
      return;
    }
    if (state.transferStep >= 2) return;
    var cargo = $("#rnaCargo");
    var worldRect = $(".transfer-world").getBoundingClientRect();
    var gateRect = $("#nuclearGate").getBoundingClientRect();
    var gateX = gateRect.left + gateRect.width / 2 - worldRect.left;
    var gateY = gateRect.top + gateRect.height / 2 - worldRect.top;
    cargo.style.transition = "left .48s cubic-bezier(.2,.8,.2,1), top .48s cubic-bezier(.2,.8,.2,1), transform .48s cubic-bezier(.2,.8,.2,1)";
    cargo.style.right = "auto";
    cargo.style.left = gateX + "px";
    cargo.style.top = gateY + "px";
    cargo.style.transform = "translate(-50%, -50%) scale(.68)";
    window.setTimeout(function () {
      state.transferStep = 2;
      state.transferPassedGate = true;
      $("#nuclearGate").classList.remove("is-armed");
      $("#nuclearGate").classList.add("is-passed");
      $("#ribosomeDock").classList.add("is-ready");
      cargo.style.left = Math.max(80, gateX - 120) + "px";
      setSignal(78);
      soundStep();
      showMessage("ה־RNA עבר דרך נקב הגרעין. כעת מסרו אותו לריבוזום.", "success");
    }, 500);
  }

  function selectRibosome() {
    if (state.scene !== "transfer") return;
    if (state.transferStep < 2 && !state.transferPassedGate) {
      soundWrong();
      showMessage("הדרך לריבוזום עוברת דרך נקב הגרעין." + penalize("transferMistakes", 2), "error");
      return;
    }
    finishTransfer();
  }

  function pointInside(element, x, y) {
    var rect = element.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function resetCargoPosition() {
    var cargo = $("#rnaCargo");
    cargo.style.transition = "left .5s cubic-bezier(.2,.8,.2,1), top .5s cubic-bezier(.2,.8,.2,1), right .5s cubic-bezier(.2,.8,.2,1), transform .5s cubic-bezier(.2,.8,.2,1)";
    window.requestAnimationFrame(function () {
      cargo.style.removeProperty("left");
      cargo.style.removeProperty("right");
      cargo.style.removeProperty("top");
      cargo.style.removeProperty("transform");
    });
    window.setTimeout(function () { cargo.style.transition = ""; }, 560);
  }

  function beginCargoDrag(event) {
    if (state.scene !== "transfer" || state.transferStep === 3) return;
    event.preventDefault();
    var cargo = $("#rnaCargo");
    var world = $(".transfer-world");
    var worldRect = world.getBoundingClientRect();
    var cargoRect = cargo.getBoundingClientRect();
    state.transferDragging = true;
    state.transferMoved = false;
    state.dragStartX = event.clientX;
    state.dragStartY = event.clientY;
    state.transferStep = Math.max(state.transferStep, 1);
    cargo.setPointerCapture(event.pointerId);
    cargo.classList.add("is-selected");
    $("#nuclearGate").classList.add("is-armed");
    cargo.style.right = "auto";
    cargo.style.left = (cargoRect.left + cargoRect.width / 2 - worldRect.left) + "px";
    cargo.style.top = (cargoRect.top + cargoRect.height / 2 - worldRect.top) + "px";
    cargo.style.transform = "translate(-50%, -50%)";
  }

  function moveCargo(event) {
    if (!state.transferDragging) return;
    event.preventDefault();
    var cargo = $("#rnaCargo");
    var worldRect = $(".transfer-world").getBoundingClientRect();
    var x = Math.max(35, Math.min(worldRect.width - 35, event.clientX - worldRect.left));
    var y = Math.max(35, Math.min(worldRect.height - 35, event.clientY - worldRect.top));
    if (Math.abs(event.clientX - state.dragStartX) + Math.abs(event.clientY - state.dragStartY) > 6) state.transferMoved = true;
    cargo.style.left = x + "px";
    cargo.style.top = y + "px";
    if (pointInside($("#nuclearGate"), event.clientX, event.clientY)) {
      state.transferPassedGate = true;
      state.transferStep = 2;
      $("#nuclearGate").classList.remove("is-armed");
      $("#nuclearGate").classList.add("is-passed");
      $("#ribosomeDock").classList.add("is-ready");
    }
  }

  function endCargoDrag(event) {
    if (!state.transferDragging) return;
    state.transferDragging = false;
    if (state.transferMoved) state.suppressCargoClickUntil = Date.now() + 350;
    var delivered = pointInside($("#ribosomeDock"), event.clientX, event.clientY);
    if (delivered && state.transferPassedGate) {
      finishTransfer();
      return;
    }
    if (delivered) {
      soundWrong();
      showMessage("כדי לצאת מן הגרעין, ה־RNA חייב לעבור דרך הנקב." + penalize("transferMistakes", 2), "error");
    } else if (state.transferMoved) {
      var missedGate = !state.transferPassedGate;
      showMessage((missedGate ? "כוונו אל נקב הגרעין הזוהר." : "כמעט! המשיכו עד הריבוזום.") + (missedGate ? penalize("transferMistakes", 1) : ""), "error");
    }
    resetCargoPosition();
  }

  function finishTransfer() {
    if (state.transferStep === 3 || state.milestones.transferComplete) return;
    state.milestones.transferComplete = true;
    state.transferStep = 3;
    var cargo = $("#rnaCargo");
    var worldRect = $(".transfer-world").getBoundingClientRect();
    var targetRect = $("#ribosomeDock").getBoundingClientRect();
    cargo.style.transition = "left .75s cubic-bezier(.2,.8,.2,1), top .75s cubic-bezier(.2,.8,.2,1), transform .75s cubic-bezier(.2,.8,.2,1), opacity .4s .55s";
    cargo.style.right = "auto";
    cargo.style.left = (targetRect.left + targetRect.width / 2 - worldRect.left) + "px";
    cargo.style.top = (targetRect.top + targetRect.height / 2 - worldRect.top) + "px";
    cargo.style.transform = "translate(-50%, -50%) scale(.55)";
    cargo.style.opacity = ".15";
    addPoints(20);
    setSignal(84);
    soundCorrect();
    vibrate([25, 30, 25]);
    showMessage("ה־RNA הגיע לריבוזום — אתר התרגום", "success", 2300);
    window.setTimeout(startTranslation, 1000);
  }

  function startTranslation() {
    if (state.milestones.translationStarted) {
      restoreScene("translation", true);
      return;
    }
    state.milestones.translationStarted = true;
    showScene("translation");
    state.ribosomeAssembly = 0;
    state.translationIndex = 0;
    $("#aminoLab").hidden = true;
    $("#codeButton").hidden = true;
    var machine = $("#translationMachine");
    var smallSubunit = $("#smallSubunit");
    var largeSubunit = $("#largeSubunit");
    var bindingStatus = $("#ribosomeBindingStatus");
    machine.classList.remove("is-auto-assembling", "is-assembled");
    smallSubunit.classList.remove("is-assembled");
    largeSubunit.classList.remove("is-assembled");
    bindingStatus.hidden = false;
    bindingStatus.classList.remove("is-complete");
    $("span", bindingStatus).textContent = "הריבוזום נקשר ל־RNA...";
    setMission({
      kicker: "משימה 07",
      status: "קישור אוטומטי",
      symbol: "◓",
      title: "הריבוזום נקשר ל־RNA",
      description: "צפו בשתי תת־היחידות מתקרבות יחד ומתארגנות סביב הודעת ה־<bdi dir='ltr'>RNA</bdi>. מיד לאחר הקישור ייפתח חלון הקריאה.",
      clueLabel: "צפו בתהליך",
      clue: "אין צורך לבחור או ללחוץ — הריבוזום ייקשר ל־<bdi dir='ltr'>RNA</bdi> באופן אוטומטי.",
      fact: "הריבוזום פועל כאשר שתי תת־היחידות שלו מאורגנות יחד סביב RNA.",
      signal: 84,
      transmissionLabel: "מכונת הפענוח // מתחברת",
      transmission: "הודעת ה־<bdi dir='ltr'>RNA</bdi> הגיעה. הריבוזום מתמקם סביבה לקראת קריאת ארבע השלשות."
    });
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        if (state.ribosomeAssembly !== 0) return;
        machine.classList.add("is-auto-assembling");
        smallSubunit.classList.add("is-assembled");
        largeSubunit.classList.add("is-assembled");
        if (state.scene === "translation") soundStep();
        window.setTimeout(finishAutomaticRibosomeBinding, 1250);
      });
    });
  }

  function finishAutomaticRibosomeBinding() {
    if (state.ribosomeAssembly >= 2) return;
    state.ribosomeAssembly = 2;
    var machine = $("#translationMachine");
    var bindingStatus = $("#ribosomeBindingStatus");
    machine.classList.remove("is-auto-assembling");
    machine.classList.add("is-assembled");
    bindingStatus.classList.add("is-complete");
    $("span", bindingStatus).textContent = "הריבוזום נקשר — חלון הקריאה מוכן";
    if (state.scene === "translation") {
      soundCorrect();
      showMessage("הריבוזום נקשר ל־RNA. חלון הקריאה מוכן לפענוח הקודון הראשון.", "success", 2400);
    }
    window.setTimeout(beginCodonQuest, 650);
  }

  function beginCodonQuest() {
    if (state.ribosomeAssembly < 2) return;
    shuffleAminoOptions();
    $("#aminoLab").hidden = false;
    $("#codeButton").hidden = false;
    $("#ribosomeBindingStatus").hidden = true;
    updateTranslationPrompt();
    var codonMission = {
      kicker: "משימה 08",
      status: "תרגום בתהליך",
      symbol: "⋯",
      title: "פענחו את הקוד הגנטי",
      description: "הריבוזום קורא את ה־<bdi dir='ltr'>RNA</bdi> בשלשות. השתמשו במפתח והביאו לכל קודון את החומצה האמינית הנכונה.",
      clueLabel: "חידת הקודון",
      clue: "פתחו את מפת הקוד הגנטי המלאה ובדקו מה פירוש AUG",
      fact: "קודון הוא שלושה נוקלאוטידים של RNA. בתא, כל חומצה אמינית מגיעה על גבי RNA נשא; במשימה אתם בוחרים את המטען שלה.",
      signal: 90,
      transmissionLabel: "פענוח סופי // 4 קודונים",
      transmission: "ארבע שלשות ממתינות לקריאה. השלשה האחרונה מתנהגת אחרת — פענחו אותה כדי להבין מדוע ההודעה נקטעה."
    };
    state.missionByScene.translation = codonMission;
    if (state.scene === "translation") setMission(codonMission);
  }

  function shuffleAminoOptions() {
    var container = $("#aminoOptions");
    var buttons = Array.from(container.children);
    var originalOrder = buttons.map(function (button) { return button.dataset.amino; }).join(",");
    for (var index = buttons.length - 1; index > 0; index -= 1) {
      var randomIndex = Math.floor(Math.random() * (index + 1));
      var temporary = buttons[index];
      buttons[index] = buttons[randomIndex];
      buttons[randomIndex] = temporary;
    }
    if (buttons.map(function (button) { return button.dataset.amino; }).join(",") === originalOrder) {
      var first = buttons[0];
      buttons[0] = buttons[1];
      buttons[1] = first;
    }
    buttons.forEach(function (button) { container.appendChild(button); });
    container.dataset.order = buttons.map(function (button) { return button.dataset.amino; }).join(",");
  }

  function updateTranslationPrompt() {
    var item = translationPlan[state.translationIndex];
    if (!item) return;
    $("#codonPrompt").textContent = "מה מייצג הקודון " + item.codon + "?";
    $("#codonIndex").textContent = String(state.translationIndex + 1);
    $("#currentCodonBadge").textContent = item.codon;
    $("#dialogCurrentCodon").textContent = item.codon;
    if (state.scene === "translation") {
      $("strong", missionClue).textContent = "חידת הקודון";
      $("small", missionClue).innerHTML = "הקודון הנוכחי: <bdi dir='ltr'>" + item.codon + "</bdi>. פתחו את מפת הקוד הגנטי המלאה ופענחו אותו.";
    }
  }

  function chooseAmino(amino, button) {
    if (state.scene !== "translation" || state.ribosomeAssembly < 2 || state.translationIndex >= translationPlan.length) return;
    var item = translationPlan[state.translationIndex];
    if (amino !== item.amino) {
      soundWrong();
      vibrate(45);
      if (button) {
        button.classList.remove("is-wrong");
        void button.offsetWidth;
        button.classList.add("is-wrong");
      }
      var text = item.amino === "release"
        ? "המטען הזה אינו מתאים ל־UAA. בדקו שוב את הסימון של UAA במפת הקוד."
        : "החומצה הזו אינה מתאימה ל־" + item.codon + ". היעזרו במפתח הקוד.";
      showMessage(text + penalize("translationMistakes", 3), "error", 2400);
      return;
    }

    var codons = $$(".codon");
    codons[state.translationIndex].classList.remove("is-current");
    codons[state.translationIndex].classList.add("is-read");
    $$(".translation-progress i")[state.translationIndex].classList.add("is-done");

    if (item.amino !== "release") {
      var aminoAsset = document.createElement("img");
      aminoAsset.className = "chain-amino-asset";
      aminoAsset.src = item.asset;
      aminoAsset.alt = item.name;
      aminoAsset.title = item.name;
      $("#peptideChain").appendChild(aminoAsset);
      showMessage(item.name + " צורפה — נוצר קשר פפטידי חדש", "success", 1700);
    } else {
      var releaseButton = $(".amino-token[data-amino='release']");
      $("b", releaseButton).textContent = "סיום התירגום הושלם";
      $("small", releaseButton).textContent = "השרשרת משתחררת";
      showMessage("UAA זוהה: התרגום נעצר והשרשרת משתחררת", "success", 2600);
    }

    state.translationIndex += 1;
    addPoints(15);
    setSignal(Math.min(99, 90 + state.translationIndex * 2));
    soundCorrect();
    if (state.translationIndex < translationPlan.length) {
      codons[state.translationIndex].classList.add("is-current");
      $(".reading-window").style.left = (11.5 + state.translationIndex * 19.55) + "%";
      $("#smallSubunit").style.left = (20.9 + state.translationIndex * 19.55) + "%";
      $("#largeSubunit").style.left = (20.9 + state.translationIndex * 19.55) + "%";
      $("#peptideChain").style.left = (17 + state.translationIndex * 19.55) + "%";
      updateTranslationPrompt();
    } else {
      $("#aminoLab").hidden = true;
      $("#codeButton").hidden = true;
      if ($("#codeDialog").open) $("#codeDialog").close();
      window.setTimeout(finishTranslation, 1050);
    }
  }

  function finishTranslation() {
    if (state.milestones.translationComplete) return;
    state.milestones.translationComplete = true;
    addPoints(25);
    state.celebrationUntil = performance.now() + 6500;
    showScene("complete");
    setCompletionMode("prequiz");
    launchCelebration(54);
    soundVictory(false);
    setMission({
      kicker: "פענוח הושלם",
      status: "חלבון שוחרר",
      symbol: "✦",
      title: "האות האבוד נמצא: חלבון האיתות פועל",
      description: "החלבון הקצר שבניתם הוא קריאת תגבור: הוא מזעיק תאי תמך ותאי חיסון סמוכים, שמפעילים הגנה ומסייעים לרקמה להתחיל להתאושש.",
      clueLabel: "אימות אחרון",
      clue: "השלימו את מבחן היציאה הקצר כדי לאטום את תיק המשימה",
      fact: "שעתוק יוצר RNA לפי DNA בגרעין; תרגום קורא את ה־RNA בריבוזום ובונה שרשרת חומצות אמיניות.",
      hideFact: true,
      signal: 100,
      transmissionLabel: "קריאת התגבור שוחזרה // שידור פעיל",
      transmission: "האות נקלט: תאי תמך ותאי חיסון באזור מתגייסים, מחזקים את ההגנה המקומית ומסייעים בסילוק גורם הנזק."
    });
  }

  function openCodeDialog() {
    var dialog = $("#codeDialog");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeCodeDialog() {
    var dialog = $("#codeDialog");
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    $("#codeButton").focus();
  }

  function openQuiz() {
    $("#completionCard").hidden = true;
    $("#quizCard").hidden = false;
    setCompletionMode("quiz");
    state.quizIndex = 0;
    state.quizAnswered = false;
    state.quizCorrect = 0;
    state.performance.quizAnswers = [];
    renderQuiz();
  }

  function renderQuiz() {
    var item = quizQuestions[state.quizIndex];
    state.quizAnswered = false;
    $("#quizCounter").textContent = "שאלה " + (state.quizIndex + 1) + " מתוך " + quizQuestions.length;
    $("#quizBar").style.width = ((state.quizIndex + 1) / quizQuestions.length * 100) + "%";
    $("#quizQuestion").textContent = item.question;
    $("#quizExplanation").hidden = true;
    $("#nextQuestion").hidden = true;
    $("#nextQuestion").firstChild.textContent = state.quizIndex === quizQuestions.length - 1 ? "לסיכום " : "לשאלה הבאה ";
    var options = $("#quizOptions");
    options.innerHTML = "";
    item.options.forEach(function (label, index) {
      var button = document.createElement("button");
      button.className = "quiz-option";
      button.type = "button";
      button.textContent = label;
      button.addEventListener("click", function () { answerQuiz(index, button); });
      options.appendChild(button);
    });
  }

  function answerQuiz(index, selectedButton) {
    if (state.quizAnswered) return;
    state.quizAnswered = true;
    var item = quizQuestions[state.quizIndex];
    var options = $$(".quiz-option", $("#quizOptions"));
    options.forEach(function (button, optionIndex) {
      button.disabled = true;
      if (optionIndex === item.correct) button.classList.add("is-correct");
    });
    state.performance.quizAnswers.push({
      question: item.question,
      selected: item.options[index],
      correctAnswer: item.options[item.correct],
      isCorrect: index === item.correct
    });
    if (index === item.correct) {
      state.quizCorrect += 1;
      addPoints(10);
      soundCorrect();
      showMessage("מדויק! הנקודות נשמרו.", "success", 1400);
    } else {
      selectedButton.classList.add("is-wrong");
      soundWrong();
      showMessage("כמעט — הביטו בהסבר ונסו לזכור למסע הבא." + penalize("quizMistakes", 4), "error", 2200);
    }
    $("#quizExplanation").textContent = item.explanation;
    $("#quizExplanation").hidden = false;
    $("#nextQuestion").hidden = false;
  }

  function nextQuizQuestion() {
    if (!state.quizAnswered) return;
    state.quizIndex += 1;
    if (state.quizIndex >= quizQuestions.length) {
      finishQuiz();
    } else {
      renderQuiz();
    }
  }

  function finishQuiz() {
    state.completedAt = Date.now();
    $("#quizCard").hidden = true;
    $("#finalCard").hidden = false;
    setCompletionMode("finale");
    animateFinalScore(state.points);
    $("#finalStudentName").textContent = "סוכן/סוכנת " + state.studentName;
    setMission({
      kicker: "המשימה הושלמה",
      status: "הידע אומת",
      symbol: "✦",
      title: "אתם מפענחי הקוד",
      description: "סיימתם את המסע מן התא, דרך הגרעין, אל הריבוזום — ובניתם חלבון איתות שמזעיק תאי תמך ותאי חיסון לקריאת תגבור.",
      clueLabel: "דו״ח משימה",
      clue: "עניתם נכון על " + state.quizCorrect + " מתוך " + quizQuestions.length + " שאלות",
      fact: "הדוגמה המרכזית מתארת זרימת מידע: DNA → RNA → חלבון.",
      hideFact: true,
      signal: 100,
      transmissionLabel: "תיק 07 // נסגר",
      transmission: "קריאת התגבור הושבה: התאים הסמוכים מפעילים מנגנוני הגנה ומסייעים לרקמה להתאושש. המסלול מן ה־<bdi dir='ltr'>DNA</bdi> לתוצר החלבוני תועד במלואו."
    });
    state.celebrationUntil = performance.now() + 9000;
    launchCelebration(76);
    soundVictory(true);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character];
    });
  }

  function downloadStudentReport() {
    var performance = state.performance;
    var transcriptionAccuracy = Math.round(12 / (12 + performance.transcriptionMistakes) * 100);
    var translationAccuracy = Math.round(4 / (4 + performance.translationMistakes) * 100);
    var rows = [
      ["זיהוי ממברנת התא", performance.thresholdMistakes, "הושלם"],
      ["איתור הגרעין", performance.organelleMistakes, "הושלם"],
      ["איתור כרומוזום 7", performance.chromosomeMistakes, "הושלם"],
      ["איתור הגן", performance.geneMistakes, "הושלם"],
      ["שעתוק", performance.transcriptionMistakes, transcriptionAccuracy + "% דיוק"],
      ["העברת RNA", performance.transferMistakes, "הושלם"],
      ["תרגום", performance.translationMistakes, translationAccuracy + "% דיוק"]
    ];
    var quizRows = performance.quizAnswers.map(function (answer, index) {
      return "<tr><td>" + (index + 1) + "</td><td>" + escapeHtml(answer.question) + "</td><td>" + escapeHtml(answer.selected) + "</td><td class='" + (answer.isCorrect ? "ok" : "bad") + "'>" + (answer.isCorrect ? "נכון" : "לא נכון — " + escapeHtml(answer.correctAnswer)) + "</td></tr>";
    }).join("");
    var taskRows = rows.map(function (row) {
      return "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td><td>" + row[2] + "</td></tr>";
    }).join("");
    var reportDate = new Intl.DateTimeFormat("he-IL", { dateStyle: "long", timeStyle: "short" }).format(new Date(state.completedAt || Date.now()));
    var durationMinutes = state.startedAt ? Math.max(1, Math.round(((state.completedAt || Date.now()) - state.startedAt) / 60000)) : 0;
    var reportHtml = "<!doctype html><html lang='he' dir='rtl'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width'><title>דו״ח תלמיד — " + escapeHtml(state.studentName) + "</title><style>body{margin:0;background:#071126;color:#eaf6ff;font-family:Arial,sans-serif}main{max-width:900px;margin:40px auto;padding:34px;background:#10213b;border:1px solid #2d617c;border-radius:24px}h1{margin:0;color:#4ce7e1}h2{margin-top:30px;color:#c5f577}p{color:#bdd0e2;line-height:1.6}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.summary div{padding:16px;background:#091831;border-radius:14px;text-align:center}.summary b{display:block;color:#fff;font-size:24px}.summary span{color:#8eabc2;font-size:13px}table{width:100%;border-collapse:collapse;background:#091831;border-radius:14px;overflow:hidden}th,td{padding:12px;border-bottom:1px solid #1d3c58;text-align:right}th{color:#4ce7e1}.ok{color:#c5f577}.bad{color:#ff8da0}@media(max-width:650px){main{margin:0;border-radius:0;padding:20px}.summary{grid-template-columns:1fr 1fr}table{font-size:12px}}</style></head><body><main><p>תיק משימה אישי</p><h1>הצופן החי — דו״ח תלמיד</h1><p><strong>שם:</strong> " + escapeHtml(state.studentName) + "<br><strong>מועד השלמה:</strong> " + escapeHtml(reportDate) + "</p><div class='summary'><div><b>" + state.points + "</b><span>נקודות</span></div><div><b>" + performance.pointsLost + "</b><span>נקודות שאבדו</span></div><div><b>" + state.quizCorrect + "/" + quizQuestions.length + "</b><span>מבחן יציאה</span></div><div><b>" + durationMinutes + "</b><span>דקות במשימה</span></div></div><h2>ביצועי המשימות</h2><table><thead><tr><th>משימה</th><th>טעויות</th><th>תוצאה</th></tr></thead><tbody>" + taskRows + "</tbody></table><h2>מבחן היציאה</h2><table><thead><tr><th>#</th><th>שאלה</th><th>תשובת התלמיד/ה</th><th>בדיקה</th></tr></thead><tbody>" + quizRows + "</tbody></table></main></body></html>";
    var blob = new Blob([reportHtml], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    var safeName = state.studentName.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-") || "תלמיד";
    link.href = url;
    link.download = "דוח-תלמיד-" + safeName + ".html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showMessage("דו״ח התלמיד הורד למחשב", "success", 2200);
  }

  function initParticles() {
    var canvas = $("#particleCanvas");
    var context = canvas.getContext("2d");
    var particles = [];
    var width = 0;
    var height = 0;
    var ratio = 1;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      var count = Math.max(24, Math.min(68, Math.floor(width / 22)));
      particles = Array.from({ length: count }, function (_, index) {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          radius: .45 + Math.random() * 1.65,
          speed: .08 + Math.random() * .25,
          drift: (Math.random() - .5) * .09,
          phase: Math.random() * Math.PI * 2,
          warm: index % 9 === 0
        };
      });
    }

    function draw(time) {
      context.clearRect(0, 0, width, height);
      var celebrating = time < state.celebrationUntil;
      particles.forEach(function (particle, index) {
        if (!reduced) {
          particle.y -= particle.speed * (celebrating ? 5 : 1);
          particle.x += Math.sin(time * .0005 + particle.phase) * particle.drift;
          if (particle.y < -10) {
            particle.y = height + 10;
            particle.x = Math.random() * width;
          }
        }
        var pulse = .35 + .35 * Math.sin(time * .001 + particle.phase);
        var color = celebrating
          ? (index % 3 === 0 ? "197,245,119" : index % 3 === 1 ? "76,231,225" : "173,140,255")
          : (particle.warm ? "255,187,103" : "76,231,225");
        context.beginPath();
        context.fillStyle = "rgba(" + color + "," + Math.max(.08, pulse) + ")";
        context.shadowBlur = celebrating ? 14 : 8;
        context.shadowColor = "rgba(" + color + ",.7)";
        context.arc(particle.x, particle.y, particle.radius * (celebrating ? 1.7 : 1), 0, Math.PI * 2);
        context.fill();
      });
      context.shadowBlur = 0;
      window.requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    window.requestAnimationFrame(draw);
  }

  function initEvents() {
    $("#launchButton").addEventListener("click", function () {
      var input = $("#studentName");
      var name = input.value.trim().replace(/\s+/g, " ");
      if (!name) {
        input.setCustomValidity("כתבו שם כדי לפתוח את תיק המשימה");
        input.reportValidity();
        input.focus();
        return;
      }
      input.setCustomValidity("");
      state.studentName = name;
      state.startedAt = Date.now();
      state.launched = true;
      initAudio();
      soundStep();
      $("#welcome").classList.add("is-dismissed");
      window.setTimeout(function () { $(".threshold-answers button:not(:disabled)").focus(); }, 850);
    });
    $("#studentName").addEventListener("input", function () { this.setCustomValidity(""); });
    $("#studentName").addEventListener("keydown", function (event) {
      if (event.key === "Enter") $("#launchButton").click();
    });

    $$("#thresholdAnswers button").forEach(function (button) {
      button.addEventListener("click", function () { answerThreshold(button); });
    });

    missionAction.addEventListener("click", function () {
      if (actionHandler) actionHandler();
    });
    $("#cellShell").addEventListener("click", revealCell);
    $("#nucleusHotspot").addEventListener("click", enterNucleus);
    $$(".organelle-hotspot").forEach(function (button) {
      button.addEventListener("click", function () {
        showOrganelleMagnifier(button);
        soundWrong();
        var messages = {
          mitochondrion: "זו מיטוכונדריה — תחנת אנרגיה בעלת כמות קטנה של DNA משלה. המשיכו לסרוק.",
          golgi: "זו מערכת גולג׳י — היא ממיינת ואורזת חלבונים. המשיכו לסרוק.",
          peroxisome: "זה פרוקסיזום — הוא מפרק חומצות שומן ומנטרל חומרים מזיקים. המשיכו לסרוק.",
          lysosome: "זה ליזוזום — הוא מפרק וממחזר חומרים בתא. המשיכו לסרוק."
        };
        var mistakeNumber = state.performance.organelleMistakes + 1;
        var delayedHint = mistakeNumber >= 2
          ? " רמז: חפשו את האברון הגדול בעל המעטפת הכפולה, שבו נשמר רוב ה־DNA — הגרעין."
          : "";
        showMessage(messages[button.dataset.organelle] + delayedHint + penalize("organelleMistakes", 2), "error", 3900);
      });
    });
    $$(".chromosome").forEach(function (button) {
      button.addEventListener("click", function () { selectChromosome(button); });
    });
    $$(".gene-segment").forEach(function (button) {
      button.addEventListener("click", function () { selectGene(button); });
    });
    $$(".base-token").forEach(function (button) {
      button.addEventListener("click", function () { chooseBase(button.dataset.base, button); });
      button.addEventListener("dragstart", function (event) {
        event.dataTransfer.setData("text/base", button.dataset.base);
        event.dataTransfer.effectAllowed = "copy";
      });
    });

    var cargo = $("#rnaCargo");
    cargo.addEventListener("click", selectCargo);
    cargo.addEventListener("pointerdown", beginCargoDrag);
    cargo.addEventListener("pointermove", moveCargo);
    cargo.addEventListener("pointerup", endCargoDrag);
    cargo.addEventListener("pointercancel", endCargoDrag);
    $("#nuclearGate").addEventListener("click", selectGate);
    $("#ribosomeDock").addEventListener("click", selectRibosome);
    $$(".amino-token").forEach(function (button) {
      button.addEventListener("click", function () { chooseAmino(button.dataset.amino, button); });
      button.addEventListener("dragstart", function (event) {
        event.dataTransfer.setData("text/amino", button.dataset.amino);
        event.dataTransfer.effectAllowed = "copy";
      });
    });
    $("#translationMachine").addEventListener("dragover", function (event) {
      if (state.ribosomeAssembly === 2) event.preventDefault();
    });
    $("#translationMachine").addEventListener("drop", function (event) {
      event.preventDefault();
      chooseAmino(event.dataTransfer.getData("text/amino"));
    });
    $("#startQuiz").addEventListener("click", openQuiz);
    $("#nextQuestion").addEventListener("click", nextQuizQuestion);
    $("#backButton").addEventListener("click", goBack);
    $$(".phase").forEach(function (button) {
      button.addEventListener("click", function () { jumpToPhase(button.dataset.phase); });
    });
    $("#codeButton").addEventListener("click", openCodeDialog);
    $("#closeCodeDialog").addEventListener("click", closeCodeDialog);
    $("#confirmCodeDialog").addEventListener("click", closeCodeDialog);
    $("#codeDialog").addEventListener("click", function (event) {
      if (event.target === this) closeCodeDialog();
    });
    $("#downloadReport").addEventListener("click", downloadStudentReport);
    $("#replayCelebration").addEventListener("click", function () {
      state.celebrationUntil = performance.now() + 6000;
      launchCelebration(76);
      soundVictory(true);
    });
    $("#restartButton").addEventListener("click", function () { window.location.reload(); });
    $("#soundToggle").addEventListener("click", function () {
      state.sound = !state.sound;
      var button = $("#soundToggle");
      button.setAttribute("aria-pressed", String(state.sound));
      button.setAttribute("aria-label", state.sound ? "כיבוי צלילים" : "הפעלת צלילים");
      if (state.sound) soundStep();
    });
  }

  function init() {
    buildHelix();
    renderTranscription();
    initParticles();
    initEvents();
    $("#sparkCount").textContent = String(state.points);
    actionHandler = null;
    setMission(initialMission);
    updatePhase("cell");
    updateBackButton();
  }

  init();
}());
