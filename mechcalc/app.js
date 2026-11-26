(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var navButtons = Array.prototype.slice.call(document.querySelectorAll(".nav-item"));
  var views = Array.prototype.slice.call(document.querySelectorAll(".view"));
  var viewNames = { home: "Overview", calculators: "Engineering calculators", scientific: "Scientific calculator", converter: "Unit converter", ask: "Ask MECHCALC", formulas: "Formula library", about: "About & limitations" };

  function go(view) {
    if (!viewNames[view]) return;
    views.forEach(function (el) { el.classList.toggle("active", el.id === "view-" + view); });
    navButtons.forEach(function (el) { el.classList.toggle("active", el.getAttribute("data-view") === view); });
    $("pageCrumb").textContent = viewNames[view];
    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  navButtons.forEach(function (button) { button.addEventListener("click", function () { go(button.dataset.view); }); });
  document.querySelectorAll("[data-go]").forEach(function (button) { button.addEventListener("click", function () { go(button.dataset.go); }); });
  var sidebar = $("sidebar"), overlay = $("mobileOverlay");
  function closeMenu() { sidebar.classList.remove("open"); overlay.classList.remove("show"); }
  $("menuToggle").addEventListener("click", function () { sidebar.classList.toggle("open"); overlay.classList.toggle("show"); });
  overlay.addEventListener("click", closeMenu);

  var pumpDefaults = { pumpD: "150", pumpL: "300", pumpN: "60", pumpQ: "4", pumpH: "20", pumpP: "1.5", pumpRho: "1000", pumpG: "9.81", pumpRod: "0" };
  $("pumpMode").addEventListener("change", function () { $("rodField").hidden = this.value !== "double"; });
  $("resetPump").addEventListener("click", function () {
    Object.keys(pumpDefaults).forEach(function (id) { $(id).value = pumpDefaults[id]; });
    $("pumpMode").value = "single"; $("pumpDUnit").value = "mm"; $("pumpLUnit").value = "mm"; $("pumpQUnit").value = "ls"; $("pumpHUnit").value = "m"; $("pumpPUnit").value = "kw"; $("pumpRodUnit").value = "mm";
    $("rodField").hidden = true; $("pumpResults").hidden = true; $("pumpError").hidden = true;
  });
  function pumpInput() {
    return {
      configuration: $("pumpMode").value,
      diameter: $("pumpD").value, diameterUnit: $("pumpDUnit").value,
      stroke: $("pumpL").value, strokeUnit: $("pumpLUnit").value,
      speed: $("pumpN").value, actualDischarge: $("pumpQ").value, dischargeUnit: $("pumpQUnit").value,
      head: $("pumpH").value, headUnit: $("pumpHUnit").value,
      inputPower: $("pumpP").value, powerUnit: $("pumpPUnit").value,
      density: $("pumpRho").value, gravity: $("pumpG").value,
      rodDiameter: $("pumpRod").value, rodUnit: $("pumpRodUnit").value
    };
  }
  function metric(label, value, unit) {
    return '<div class="result-metric"><small>' + label + '</small><strong>' + value + '</strong><em>' + unit + '</em></div>';
  }
  $("solvePump").addEventListener("click", function () {
    $("pumpError").hidden = true;
    try {
      var r = window.MechCalcEngineering.solveReciprocatingPump(pumpInput());
      var f = window.MechCalcEngineering.formatNumber;
      var html = '<div class="results-title"><h3>Calculated performance</h3><span class="level-label">SI RESULTS</span></div><div class="result-grid">';
      html += metric("Theoretical discharge", f(r.theoreticalDischarge * 1000), "L/s");
      html += metric("Slip (Qth − Qactual)", f(r.slip * 1000), "L/s");
      html += metric("Volumetric efficiency", f(r.volumetricEfficiency, 5), "%");
      html += metric("Water power", f(r.waterPower), "W");
      html += metric("Overall efficiency", f(r.overallEfficiency, 5), "%");
      html += metric("Piston area", f(r.area), "m²");
      html += metric("Actual discharge", f(r.actualDischarge * 1000), "L/s");
      html += metric("Shaft input power", f(r.inputPower), "W");
      html += '</div><div class="solution-steps"><h4>Step-by-step solution</h4>';
      html += step(1, "Convert all input data to SI units", "D = " + f(r.diameterM) + " m; L = " + f(r.strokeM) + " m; Qactual = " + f(r.actualDischarge) + " m³/s; H = " + f(r.headM) + " m; Pin = " + f(r.inputPower) + " W.");
      html += step(2, "Calculate piston area", "A = πD²/4 = π × (" + f(r.diameterM) + ")² / 4 = " + f(r.area) + " m².");
      var dispFormula = r.configuration === "single" ? "Qth = ALN/60" : "Qth = (2A − a)LN/60";
      html += step(3, "Calculate theoretical discharge", dispFormula + ". Qth = " + f(r.theoreticalDischarge) + " m³/s = " + f(r.theoreticalDischarge * 1000) + " L/s.");
      html += step(4, "Calculate slip", "Slip = Qth − Qactual = " + f(r.theoreticalDischarge) + " − " + f(r.actualDischarge) + " = " + f(r.slip) + " m³/s.");
      html += step(5, "Calculate volumetric efficiency", "ηv = (Qactual / Qth) × 100 = (" + f(r.actualDischarge) + " / " + f(r.theoreticalDischarge) + ") × 100 = " + f(r.volumetricEfficiency, 5) + "%.");
      html += step(6, "Calculate water power", "Pw = ρgQactualH = " + f(Number(pumpInput().density)) + " × " + f(Number(pumpInput().gravity)) + " × " + f(r.actualDischarge) + " × " + f(r.headM) + " = " + f(r.waterPower) + " W.");
      html += step(7, "Calculate overall efficiency", "ηo = (Pw / Pin) × 100 = (" + f(r.waterPower) + " / " + f(r.inputPower) + ") × 100 = " + f(r.overallEfficiency, 5) + "%.");
      html += '</div><div class="mini-callout"><strong>Assumptions:</strong> ' + r.assumptions.join(" ") + '</div>';
      if (r.warnings.length) html += '<div class="result-warning"><strong>Check these results</strong><br>' + r.warnings.map(escapeHtml).join("<br>") + '</div>';
      else html += '<div class="result-ok">No basic physical-plausibility warning was triggered. This is not a professional design approval.</div>';
      $("pumpResults").innerHTML = html; $("pumpResults").hidden = false;
    } catch (error) { $("pumpError").textContent = error.message; $("pumpError").hidden = false; $("pumpResults").hidden = true; }
  });
  function step(number, title, description) { return '<div class="step"><span class="step-num">' + number + '</span><div><strong>' + title + '</strong><p>' + description + '</p></div></div>'; }
  function escapeHtml(text) { return String(text).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }

  // Safe recursive-descent expression parser: no eval() or Function().
  var angleMode = "DEG", answer = 0, memory = 0, expression = "";
  var funcs = {
    sin: function (x) { return Math.sin(angleMode === "DEG" ? x * Math.PI / 180 : x); },
    cos: function (x) { return Math.cos(angleMode === "DEG" ? x * Math.PI / 180 : x); },
    tan: function (x) { return Math.tan(angleMode === "DEG" ? x * Math.PI / 180 : x); },
    asin: function (x) { return angleMode === "DEG" ? Math.asin(x) * 180 / Math.PI : Math.asin(x); },
    acos: function (x) { return angleMode === "DEG" ? Math.acos(x) * 180 / Math.PI : Math.acos(x); },
    atan: function (x) { return angleMode === "DEG" ? Math.atan(x) * 180 / Math.PI : Math.atan(x); },
    sqrt: Math.sqrt, log: function (x) { return Math.log10(x); }, ln: Math.log,
    abs: Math.abs, exp: Math.exp
  };
  function tokenize(source) {
    var tokens = [], re = /\s*([0-9]+(?:\.[0-9]*)?(?:e[+-]?[0-9]+)?|\.[0-9]+(?:e[+-]?[0-9]+)?|[a-zA-Z]+|[()+\-*/^%!])/gy, pos = 0;
    while (pos < source.length) {
      re.lastIndex = pos; var match = re.exec(source);
      if (!match) throw new Error("Unrecognized character near: " + source.slice(pos, pos + 8));
      tokens.push(match[1]); pos = re.lastIndex;
    }
    var expanded = [];
    function endsValue(t) { return /^[0-9]/.test(t) || t === "pi" || t === "e" || t === "ans" || t === ")" || t === "!"; }
    function startsValue(t) { return /^[0-9]/.test(t) || t === "pi" || t === "e" || t === "ans" || t === "(" || Object.prototype.hasOwnProperty.call(funcs, t); }
    tokens.forEach(function (t) {
      var prev = expanded.length ? expanded[expanded.length - 1] : "";
      if (prev && endsValue(prev) && startsValue(t)) expanded.push("*");
      expanded.push(t);
    });
    return expanded;
  }
  function evaluate(source) {
    var tokens = tokenize(source), i = 0;
    function peek() { return tokens[i]; }
    function take() { return tokens[i++]; }
    function expressionRule() {
      var value = term();
      while (peek() === "+" || peek() === "-") { var op = take(), right = term(); value = op === "+" ? value + right : value - right; }
      return value;
    }
    function term() {
      var value = unary();
      while (peek() === "*" || peek() === "/") {
        var op = take(), right = unary();
        if (op === "*") value *= right;
        else if (op === "/") value /= right;
      }
      return value;
    }
    function unary() {
      if (peek() === "+") { take(); return unary(); }
      if (peek() === "-") { take(); return -unary(); }
      return power();
    }
    function power() {
      var value = postfix();
      if (peek() === "^") { take(); value = Math.pow(value, unary()); }
      return value;
    }
    function postfix() {
      var value = primary();
      while (peek() === "!" || peek() === "%") { var suffix = take(); if (suffix === "%") value /= 100; else { if (value < 0 || value > 170 || Math.floor(value) !== value) throw new Error("Factorial requires an integer from 0 to 170."); var n = 1; for (var k = 2; k <= value; k++) n *= k; value = n; } }
      return value;
    }
    function primary() {
      var t = take();
      if (t === undefined) throw new Error("Enter an expression.");
      if (t === "(") { var v = expressionRule(); if (take() !== ")") throw new Error("Missing closing bracket."); return v; }
      if (/^[0-9]/.test(t) || /^\./.test(t)) return Number(t);
      if (t === "pi") return Math.PI;
      if (t === "e") return Math.E;
      if (t === "ans") return answer;
      if (Object.prototype.hasOwnProperty.call(funcs, t)) {
        if (take() !== "(") throw new Error(t + " requires parentheses.");
        var arg = expressionRule(); if (take() !== ")") throw new Error("Missing closing bracket after " + t + ".");
        return funcs[t](arg);
      }
      throw new Error("Unexpected token: " + t);
    }
    if (!tokens.length) return 0;
    var result = expressionRule();
    if (i < tokens.length) throw new Error("Unexpected token: " + tokens[i]);
    if (!Number.isFinite(result)) throw new Error("Result is not a finite real number.");
    return result;
  }
  function renderCalc() {
    $("calcExpression").textContent = expression || "0";
    $("calcResult").textContent = expression ? "…" : "0";
  }
  function appendKey(key) {
    if (key === "AC") { expression = ""; renderCalc(); $("calcResult").textContent = "0"; return; }
    if (key === "=") {
      try { answer = evaluate(expression); $("calcExpression").textContent = expression + " ="; $("calcResult").textContent = Number(answer.toPrecision(12)).toString(); expression = String(answer); }
      catch (e) { $("calcResult").textContent = e.message; }
      return;
    }
    if (key === "BACK") { expression = expression.slice(0, -1); renderCalc(); return; }
    if (key === "^2") key = "^2";
    expression += key; renderCalc();
    try { var value = evaluate(expression); $("calcResult").textContent = Number(value.toPrecision(10)).toString(); } catch (ignore) {}
  }
  $("keypad").addEventListener("click", function (event) { var button = event.target.closest("button[data-key]"); if (button) appendKey(button.dataset.key); });
  $("calcBack").addEventListener("click", function () { appendKey("BACK"); });
  $("angleMode").addEventListener("click", function () { angleMode = angleMode === "DEG" ? "RAD" : "DEG"; $("angleMode").textContent = angleMode; $("angleModeLabel").textContent = angleMode; });
  $("memoryClear").addEventListener("click", function () { memory = 0; });
  $("memoryRecall").addEventListener("click", function () { expression += String(memory); renderCalc(); });
  $("memoryAdd").addEventListener("click", function () { try { memory += evaluate(expression); } catch (ignore) {} });
  document.addEventListener("keydown", function (event) {
    if (!$("view-scientific").classList.contains("active")) return;
    if (/^[0-9.+\-*/^()%!]$/.test(event.key)) appendKey(event.key);
    else if (event.key === "Enter" || event.key === "=") { event.preventDefault(); appendKey("="); }
    else if (event.key === "Backspace") appendKey("BACK");
    else if (event.key === "Escape") appendKey("AC");
  });

  var unitSets = {
    length: { m: ["metre (m)", 1], mm: ["millimetre (mm)", .001], cm: ["centimetre (cm)", .01], km: ["kilometre (km)", 1000], inch: ["inch (in)", .0254], ft: ["foot (ft)", .3048], yd: ["yard (yd)", .9144] },
    area: { m2: ["square metre (m²)", 1], mm2: ["square millimetre (mm²)", .000001], cm2: ["square centimetre (cm²)", .0001], ft2: ["square foot (ft²)", .09290304], inch2: ["square inch (in²)", .00064516] },
    volume: { m3: ["cubic metre (m³)", 1], litre: ["litre (L)", .001], ml: ["millilitre (mL)", .000001], cm3: ["cubic centimetre (cm³)", .000001], ft3: ["cubic foot (ft³)", .0283168466], galUS: ["US gallon", .0037854118] },
    mass: { kg: ["kilogram (kg)", 1], g: ["gram (g)", .001], tonne: ["tonne (t)", 1000], lb: ["pound (lb)", .45359237], oz: ["ounce (oz)", .0283495231] },
    force: { N: ["newton (N)", 1], kN: ["kilonewton (kN)", 1000], kgf: ["kilogram-force (kgf)", 9.80665], lbf: ["pound-force (lbf)", 4.4482216153] },
    pressure: { Pa: ["pascal (Pa)", 1], kPa: ["kilopascal (kPa)", 1000], MPa: ["megapascal (MPa)", 1000000], bar: ["bar", 100000], atm: ["atmosphere (atm)", 101325], psi: ["psi", 6894.757293], mmHg: ["mmHg", 133.322387] },
    energy: { J: ["joule (J)", 1], kJ: ["kilojoule (kJ)", 1000], MJ: ["megajoule (MJ)", 1000000], Wh: ["watt-hour (Wh)", 3600], kWh: ["kilowatt-hour (kWh)", 3600000], cal: ["calorie (cal)", 4.184] },
    power: { W: ["watt (W)", 1], kW: ["kilowatt (kW)", 1000], MW: ["megawatt (MW)", 1000000], hp: ["mechanical horsepower (hp)", 745.699872], BTUh: ["BTU/hour", .29307107] },
    speed: { ms: ["metre per second (m/s)", 1], kmh: ["kilometre per hour (km/h)", 1/3.6], mph: ["mile per hour (mph)", .44704], fts: ["foot per second (ft/s)", .3048] },
    flow: { m3s: ["m³/s", 1], ls: ["L/s", .001], m3h: ["m³/h", 1/3600], lmin: ["L/min", .001/60], gpm: ["US gallon/min", .0037854118/60] },
    temperature: { C: ["Celsius (°C)", "temp"], F: ["Fahrenheit (°F)", "temp"], K: ["Kelvin (K)", "temp"] }
  };
  function populateUnits() {
    var category = $("unitCategory").value, set = unitSets[category];
    ["unitFrom", "unitTo"].forEach(function (id) {
      var select = $(id), previous = select.value; select.innerHTML = "";
      Object.keys(set).forEach(function (key) { var opt = document.createElement("option"); opt.value = key; opt.textContent = set[key][0]; select.appendChild(opt); });
      if (set[previous]) select.value = previous;
    });
    if (category === "length") { $("unitFrom").value = "m"; $("unitTo").value = "mm"; }
    else { var keys = Object.keys(set); $("unitFrom").value = keys[0]; $("unitTo").value = keys[1] || keys[0]; }
    convertUnits();
  }
  function convertTemperature(value, from, to) {
    var kelvin = from === "C" ? value + 273.15 : from === "F" ? (value - 32) * 5 / 9 + 273.15 : value;
    return to === "C" ? kelvin - 273.15 : to === "F" ? (kelvin - 273.15) * 9 / 5 + 32 : kelvin;
  }
  function convertUnits() {
    var category = $("unitCategory").value, from = $("unitFrom").value, to = $("unitTo").value, value = Number($("unitValue").value);
    if (!Number.isFinite(value)) { $("unitOutput").textContent = "—"; return; }
    var result = category === "temperature" ? convertTemperature(value, from, to) : value * unitSets[category][from][1] / unitSets[category][to][1];
    $("unitOutput").textContent = Number(result.toPrecision(10)).toLocaleString("en-IN", { maximumFractionDigits: 8 });
    $("conversionFormula").textContent = category === "temperature" ? "Temperature conversion: " + unitSets[category][from][0] + " → " + unitSets[category][to][0] : "1 " + from + " = " + Number((unitSets[category][from][1] / unitSets[category][to][1]).toPrecision(8)) + " " + to;
  }
  $("unitCategory").addEventListener("change", populateUnits);
  $("unitFrom").addEventListener("change", convertUnits); $("unitTo").addEventListener("change", convertUnits); $("unitValue").addEventListener("input", convertUnits);
  $("swapUnits").addEventListener("click", function () { var a = $("unitFrom").value; $("unitFrom").value = $("unitTo").value; $("unitTo").value = a; convertUnits(); });
  $("copyConversion").addEventListener("click", function () {
    var text = $("unitValue").value + " " + $("unitFrom").value + " = " + $("unitOutput").textContent + " " + $("unitTo").value;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { $("copyConversion").textContent = "Copied"; setTimeout(function () { $("copyConversion").textContent = "Copy result"; }, 1300); });
  });
  populateUnits();

  var selectedFiles = [];
  function renderFiles() { $("fileList").innerHTML = selectedFiles.map(function (file) { return '<span class="file-chip">' + escapeHtml(file.name) + ' · ' + Math.max(1, Math.round(file.size / 1024)) + ' KB</span>'; }).join(""); }
  function addFiles(files) {
    Array.prototype.forEach.call(files, function (file) {
      if (!(file.type.indexOf("image/") === 0 || file.type === "application/pdf" || /\.pdf$/i.test(file.name))) return;
      if (file.size > 15 * 1024 * 1024) return;
      if (selectedFiles.length < 5) selectedFiles.push(file);
    });
    renderFiles();
  }
  $("chooseQuestionFile").addEventListener("click", function () { $("questionFile").click(); });
  $("questionFile").addEventListener("change", function () { addFiles(this.files); });
  $("uploadZone").addEventListener("dragover", function (e) { e.preventDefault(); this.classList.add("dragover"); });
  $("uploadZone").addEventListener("dragleave", function () { this.classList.remove("dragover"); });
  $("uploadZone").addEventListener("drop", function (e) { e.preventDefault(); this.classList.remove("dragover"); addFiles(e.dataTransfer.files); });
  $("analyzeQuestion").addEventListener("click", function () {
    var text = $("questionText").value.trim();
    if (!text && !selectedFiles.length) { $("questionStatus").textContent = "Paste a question or attach an image/PDF first."; $("questionStatus").hidden = false; return; }
    var words = text.toLowerCase(), topic = "Not identified from text alone";
    if (/reciprocating pump|centrifugal pump|turbine|venturimeter|bernoulli|fluid|pipe flow/.test(words)) topic = "Fluid Mechanics / Hydraulic Machinery";
    else if (/stress|strain|bending|torsion|shear force|deflection/.test(words)) topic = "Strength of Materials";
    else if (/thermodynamic|entropy|enthalpy|otto cycle|diesel cycle|rankine/.test(words)) topic = "Thermodynamics";
    else if (/heat transfer|conduction|convection|radiation/.test(words)) topic = "Heat Transfer";
    else if (/gear|flywheel|governor|vibration|mechanism/.test(words)) topic = "Theory of Machines";
    var summary = "Question captured in this browser session. ";
    if (text) summary += "Text length: " + text.length + " characters. ";
    if (selectedFiles.length) summary += "Attachments: " + selectedFiles.length + " file(s). ";
    summary += "Possible subject from keyword scan: " + topic + ". ";
    summary += "Automated AI interpretation, diagram reading and PDF text extraction are not enabled in this release. No numerical solution has been generated. You can use the identified topic to choose an available calculator; do not treat this keyword scan as a verified classification.";
    $("questionStatus").textContent = summary; $("questionStatus").hidden = false;
  });
  $("clearQuestion").addEventListener("click", function () { $("questionText").value = ""; selectedFiles = []; $("questionFile").value = ""; renderFiles(); $("questionStatus").hidden = true; });

  // Course-wise and topic-wise engineering calculator directory.
  var courseCatalog = [
    { id:"fluid", name:"Fluid Mechanics", topics:[
      {id:"reciprocating-pump",name:"Reciprocating pump",detail:"Discharge, slip and efficiencies",available:true,group:"Hydraulic Machinery"},
      {id:"centrifugal-pump",name:"Centrifugal pump",detail:"Water power, efficiency and speed parameters",available:true,group:"Hydraulic Machinery"},
      {id:"hydraulic-turbines",name:"Hydraulic turbines",detail:"Impulse and reaction turbine calculations",group:"Hydraulic Machinery"},
      {id:"pipe-flow",name:"Pipe flow and losses",detail:"Continuity, friction and minor losses"},
      {id:"bernoulli",name:"Bernoulli equation",detail:"Energy equation and applications"},
      {id:"flow-measurement",name:"Flow measurement",detail:"Venturimeter, orifice meter and pitot tube"},
      {id:"dimensional-analysis",name:"Dimensional analysis",detail:"Buckingham π theorem and similitude"}
    ]},
    { id:"thermo", name:"Thermodynamics", topics:[
      {id:"first-law",name:"First law of thermodynamics",detail:"Closed and open system energy balances"},
      {id:"second-law",name:"Second law and entropy",detail:"Entropy changes and cycle analysis"},
      {id:"gas-processes",name:"Ideal-gas processes",detail:"Isothermal, adiabatic, polytropic processes"},
      {id:"otto-diesel",name:"Air-standard cycles",detail:"Otto, Diesel and Dual cycles"},
      {id:"rankine",name:"Rankine cycle",detail:"Steam power cycle performance"}
    ]},
    { id:"som", name:"Strength of Materials", topics:[
      {id:"stress-strain",name:"Stress and strain",detail:"Axial loading and deformation"},
      {id:"sfd-bmd",name:"Shear force and bending moment",detail:"Beam reactions, SFD and BMD"},
      {id:"bending",name:"Bending stresses",detail:"Flexure formula and section properties"},
      {id:"torsion",name:"Torsion of shafts",detail:"Shear stress and angle of twist"},
      {id:"columns",name:"Columns and buckling",detail:"Euler and Rankine formulae"}
    ]},
    { id:"tom", name:"Theory of Machines", topics:[
      {id:"kinematics",name:"Mechanism kinematics",detail:"Velocity and acceleration analysis"},
      {id:"gears",name:"Gear trains",detail:"Simple, compound and epicyclic gear trains"},
      {id:"flywheel",name:"Flywheel",detail:"Coefficient of fluctuation and energy"},
      {id:"governors",name:"Governors",detail:"Porter and Proell governor calculations"},
      {id:"vibrations",name:"Mechanical vibrations",detail:"Natural frequency and damping"}
    ]},
    { id:"heat", name:"Heat Transfer", topics:[
      {id:"conduction",name:"Heat conduction",detail:"Plane, cylindrical and composite walls"},
      {id:"convection",name:"Convection",detail:"Heat transfer coefficients and correlations"},
      {id:"radiation",name:"Thermal radiation",detail:"Radiative heat exchange"},
      {id:"heat-exchangers",name:"Heat exchangers",detail:"LMTD and effectiveness-NTU"}
    ]},
    { id:"design", name:"Machine Design", topics:[
      {id:"failure-theories",name:"Failure theories",detail:"Principal stresses and design criteria"},
      {id:"shafts",name:"Shaft design",detail:"Strength and rigidity design"},
      {id:"keys-couplings",name:"Keys and couplings",detail:"Torque transmission and sizing"},
      {id:"bearings",name:"Bearings",detail:"Rolling contact bearing life"},
      {id:"springs",name:"Springs",detail:"Helical spring stresses and deflection"}
    ]},
    { id:"manufacturing", name:"Manufacturing Technology", topics:[
      {id:"machining",name:"Machining calculations",detail:"Cutting speed, feed, time and MRR"},
      {id:"casting",name:"Casting",detail:"Solidification and riser design"},
      {id:"welding",name:"Welding",detail:"Weld strength and joint calculations"},
      {id:"forming",name:"Metal forming",detail:"Rolling, forging and extrusion"}
    ]},
    { id:"rac", name:"Refrigeration and Air Conditioning", topics:[
      {id:"vcrs",name:"Vapour compression system",detail:"COP, refrigerating effect and power"},
      {id:"psychrometry",name:"Psychrometry",detail:"Moist-air properties and processes"},
      {id:"cooling-load",name:"Cooling load",detail:"Sensible and latent heat loads"}
    ]},
    { id:"automobile", name:"Automobile Engineering", topics:[
      {id:"engine-performance",name:"IC engine performance",detail:"Brake power, indicated power and efficiencies"},
      {id:"vehicle-dynamics",name:"Vehicle dynamics",detail:"Tractive effort, power and gradeability"},
      {id:"transmission",name:"Transmission systems",detail:"Gear ratios and driveline calculations"}
    ]},
    { id:"power", name:"Power Plant Engineering", topics:[
      {id:"boiler",name:"Boiler performance",detail:"Equivalent evaporation and efficiency"},
      {id:"steam-plant",name:"Steam power plant",detail:"Plant heat rate and overall efficiency"},
      {id:"gas-turbine",name:"Gas turbine plants",detail:"Compressor and turbine work"}
    ]},
    { id:"metrology", name:"Metrology and Measurements", topics:[
      {id:"limits-fits",name:"Limits, fits and tolerances",detail:"Allowance and tolerance calculations"},
      {id:"measurement-errors",name:"Measurement and errors",detail:"Uncertainty and error propagation"}
    ]},
    { id:"materials", name:"Engineering Materials", topics:[
      {id:"material-properties",name:"Material properties",detail:"Density, hardness and mechanical properties"},
      {id:"composites",name:"Composite materials",detail:"Rule of mixtures calculations"}
    ]}
  ];
  var selectedCourseId = "fluid";
  var supportedCalculatorIds = ["reciprocating-pump","centrifugal-pump"];
  function renderCourses(filter) {
    var list = $("courseList"), q = (filter || "").toLowerCase();
    list.innerHTML = "";
    courseCatalog.filter(function(c){return c.name.toLowerCase().indexOf(q)>=0;}).forEach(function(course){
      var button = document.createElement("button");
      button.type = "button"; button.className = "course-option" + (course.id===selectedCourseId?" selected":"");
      button.dataset.course = course.id; button.setAttribute("role","option"); button.setAttribute("aria-selected",course.id===selectedCourseId?"true":"false");
      button.innerHTML = "<strong>"+escapeHtml(course.name)+"</strong><small>"+course.topics.length+" topics</small>";
      list.appendChild(button);
    });
  }
  function selectEngineeringCalc(name) {
    $("pumpWorkspace").hidden = name !== "reciprocating-pump";
    $("centrifugalWorkspace").hidden = name !== "centrifugal-pump";
    $("moduleNotice").hidden = supportedCalculatorIds.indexOf(name)>=0;
  }
  function renderTopics(course) {
    $("selectedCourseTitle").textContent = course.name;
    $("selectedCourseDescription").textContent = "Select a topic to view its calculator and required inputs";
    $("topicList").innerHTML = "";
    course.topics.forEach(function(topic){
      var button = document.createElement("button");
      button.type = "button"; button.className = "topic-option" + (topic.id==="reciprocating-pump"?" selected":"");
      button.dataset.topic = topic.id;
      button.innerHTML = '<span class="topic-copy"><strong>'+escapeHtml(topic.name)+'</strong><small>'+escapeHtml(topic.detail)+'</small></span><span class="topic-status">'+(topic.available?"Available":"Planned")+'</span>';
      button.addEventListener("click",function(){
        document.querySelectorAll(".topic-option").forEach(function(el){el.classList.toggle("selected",el===button);});
        if(topic.available){
          $("moduleNotice").hidden = true;
          selectEngineeringCalc(topic.id);
          (topic.id==="centrifugal-pump"?$("centrifugalWorkspace"):$("pumpWorkspace")).scrollIntoView({behavior:"smooth",block:"start"});
        } else {
          $("pumpWorkspace").hidden = true; $("centrifugalWorkspace").hidden = true;
          $("moduleNotice").innerHTML = "<strong>"+escapeHtml(topic.name)+"</strong><p>This calculator is listed in the course directory but has not been implemented yet. It will appear here with its own input fields, equations and worked solution when its calculation module is added.</p>";
          $("moduleNotice").hidden = false;
        }
      });
      $("topicList").appendChild(button);
    });
    var firstAvailable = course.topics.filter(function(t){return t.available;})[0];
    if(firstAvailable){
      selectEngineeringCalc(firstAvailable.id);
      document.querySelectorAll(".topic-option").forEach(function(el){el.classList.toggle("selected",el.dataset.topic===firstAvailable.id);});
    } else {
      $("pumpWorkspace").hidden = true; $("centrifugalWorkspace").hidden = true;
      $("moduleNotice").innerHTML = "<strong>Calculators for "+escapeHtml(course.name)+"</strong><p>Choose a topic to view its module status. Calculators will be added course by course.</p>";
      $("moduleNotice").hidden = false;
    }
  }
  $("courseList").addEventListener("click",function(event){
    var button=event.target.closest("[data-course]"); if(!button)return;
    selectedCourseId=button.dataset.course; renderCourses($("courseSearch").value);
    renderTopics(courseCatalog.filter(function(c){return c.id===selectedCourseId;})[0]);
  });
  $("courseSearch").addEventListener("input",function(){renderCourses(this.value);});
  renderCourses(""); renderTopics(courseCatalog[0]);

  function centrifugalInput() {
    return {
      flowRate: $("centQ").value, flowUnit: $("centQUnit").value,
      head: $("centH").value, headUnit: $("centHUnit").value,
      speed: $("centN").value, impellerDiameter: $("centD").value,
      diameterUnit: $("centDUnit").value, inputPower: $("centP").value,
      powerUnit: $("centPUnit").value, density: $("centRho").value,
      gravity: $("centG").value
    };
  }
  $("solveCentrifugal").addEventListener("click", function () {
    $("centrifugalError").hidden = true;
    try {
      var r = window.MechCalcEngineering.solveCentrifugalPump(centrifugalInput());
      var f = window.MechCalcEngineering.formatNumber;
      var html = '<div class="results-title"><h3>Calculated performance</h3><span class="level-label">SI RESULTS</span></div><div class="result-grid">';
      html += metric("Water power", f(r.waterPower), "W");
      html += metric("Overall efficiency", f(r.efficiency, 5), "%");
      html += metric("Metric specific speed", f(r.specificSpeed), "—");
      html += metric("Impeller tip speed", f(r.tipSpeed), "m/s");
      html += metric("Head coefficient", f(r.headCoefficient), "—");
      html += metric("Flow coefficient", f(r.flowCoefficient), "—");
      html += metric("Flow rate", f(r.flowRate * 1000), "L/s");
      html += metric("Shaft input power", f(r.inputPower), "W");
      html += '</div><div class="solution-steps"><h4>Step-by-step solution</h4>';
      html += step(1, "Convert all input data to SI units", "Q = " + f(r.flowRate) + " m³/s; H = " + f(r.headM) + " m; D = " + f(r.diameterM) + " m; Pin = " + f(r.inputPower) + " W.");
      html += step(2, "Calculate water power", "Pw = ρgQH = " + f(Number(centrifugalInput().density)) + " × " + f(Number(centrifugalInput().gravity)) + " × " + f(r.flowRate) + " × " + f(r.headM) + " = " + f(r.waterPower) + " W.");
      html += step(3, "Calculate overall efficiency", "ηo = (Pw / Pin) × 100 = (" + f(r.waterPower) + " / " + f(r.inputPower) + ") × 100 = " + f(r.efficiency, 5) + "%.");
      html += step(4, "Calculate impeller tip speed", "u = πDN/60 = π × " + f(r.diameterM) + " × " + f(r.speed) + " / 60 = " + f(r.tipSpeed) + " m/s.");
      html += step(5, "Calculate metric specific speed", "Ns = N√Q/H^(3/4) = " + f(r.speed) + " × √" + f(r.flowRate) + " / " + f(r.headM) + "^(3/4) = " + f(r.specificSpeed) + ".");
      html += step(6, "Calculate head coefficient", "ψ = gH/u² = " + f(Number(centrifugalInput().gravity)) + " × " + f(r.headM) + " / (" + f(r.tipSpeed) + ")² = " + f(r.headCoefficient) + ".");
      html += step(7, "Calculate flow coefficient", "φ = Q/(nD³), where n = N/60 rev/s. φ = " + f(r.flowRate) + " / (" + f(r.speed / 60) + " × " + f(r.diameterM) + "³) = " + f(r.flowCoefficient) + ".");
      html += '</div><div class="mini-callout"><strong>Assumptions:</strong> ' + r.assumptions.join(" ") + '</div>';
      if (r.warnings.length) html += '<div class="result-warning"><strong>Check these results</strong><br>' + r.warnings.map(escapeHtml).join("<br>") + '</div>';
      else html += '<div class="result-ok">No basic plausibility warning was triggered. This is not a pump-selection or professional design approval.</div>';
      $("centrifugalResults").innerHTML = html; $("centrifugalResults").hidden = false;
    } catch (error) {
      $("centrifugalError").textContent = error.message;
      $("centrifugalError").hidden = false;
      $("centrifugalResults").hidden = true;
    }
  });
  $("resetCentrifugal").addEventListener("click", function () {
    $("centQ").value = "20"; $("centQUnit").value = "ls";
    $("centH").value = "30"; $("centHUnit").value = "m";
    $("centN").value = "1450"; $("centD").value = "250"; $("centDUnit").value = "mm";
    $("centP").value = "10"; $("centPUnit").value = "kw";
    $("centRho").value = "1000"; $("centG").value = "9.81";
    $("centrifugalResults").hidden = true; $("centrifugalError").hidden = true;
  });

  // Small internal regression suite for the calculation engine.
  var tests = window.MechCalcEngineering.runSelfTests();
  var failed = tests.filter(function (test) { return !test.pass; });
  if (failed.length) console.error("MECHCALC calculation tests failed:", failed);
  else console.info("MECHCALC calculation self-tests passed:", tests.length, "tests.");
})();