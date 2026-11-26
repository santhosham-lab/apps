(function (global) {
  "use strict";

  function positive(value, label, allowZero) {
    var n = Number(value);
    if (!Number.isFinite(n) || (allowZero ? n < 0 : n <= 0)) {
      throw new Error(label + " must be a valid " + (allowZero ? "non-negative" : "positive") + " number.");
    }
    return n;
  }

  function toMetres(value, unit) { return unit === "mm" ? value / 1000 : value; }
  function flowToM3s(value, unit) {
    if (unit === "ls") return value / 1000;
    if (unit === "m3h") return value / 3600;
    return value;
  }
  function headToMetres(value, unit) { return unit === "ft" ? value * 0.3048 : value; }
  function powerToWatts(value, unit) { return unit === "kw" ? value * 1000 : value; }
  function fmt(value, digits) {
    if (!Number.isFinite(value)) return "—";
    return Number(value.toPrecision(digits || 6)).toLocaleString("en-IN", { maximumFractionDigits: digits || 6 });
  }

  function solveReciprocatingPump(input) {
    var D = positive(input.diameter, "Piston diameter", false);
    var L = positive(input.stroke, "Stroke length", false);
    var N = positive(input.speed, "Pump speed", false);
    var QactualInput = positive(input.actualDischarge, "Actual discharge", true);
    var Hinput = positive(input.head, "Total head", true);
    var rho = positive(input.density, "Fluid density", false);
    var g = positive(input.gravity, "Gravitational acceleration", false);
    var PinInput = positive(input.inputPower, "Shaft input power", false);

    D = toMetres(D, input.diameterUnit);
    L = toMetres(L, input.strokeUnit);
    var Qactual = flowToM3s(QactualInput, input.dischargeUnit);
    var H = headToMetres(Hinput, input.headUnit);
    var Pin = powerToWatts(PinInput, input.powerUnit);
    var A = Math.PI * D * D / 4;
    var rodDiameter = input.rodDiameter ? toMetres(positive(input.rodDiameter, "Piston rod diameter", true), input.rodUnit) : 0;
    if (rodDiameter >= D) throw new Error("Piston rod diameter must be smaller than piston diameter.");
    var rodArea = Math.PI * rodDiameter * rodDiameter / 4;
    var config = input.configuration === "double" ? "double" : "single";
    var displacementPerCycle = config === "double" ? (2 * A - rodArea) * L : A * L;
    var Qth = displacementPerCycle * N / 60;
    var slip = Qth - Qactual;
    var etaV = Qth > 0 ? Qactual / Qth * 100 : NaN;
    var waterPower = rho * g * Qactual * H;
    var etaOverall = waterPower / Pin * 100;
    var specificEnergy = rho * g * H;
    var warnings = [];
    if (etaV > 100) warnings.push("Volumetric efficiency exceeds 100%. Check the pump configuration, dimensions, speed and actual discharge. Negative slip may occur in some operating conditions, but this value needs verification.");
    if (etaOverall > 100) warnings.push("Overall efficiency exceeds 100%, which is not physically possible for the stated pump boundary. Check the input power, head, flow rate and units.");
    if (etaOverall < 0 || etaV < 0) warnings.push("A negative efficiency was calculated. Review the input values and sign conventions.");
    if (Qactual > 0 && Qth > 0 && Qactual / Qth > 0.95) warnings.push("The actual discharge is close to theoretical displacement. Confirm whether leakage and slip assumptions are appropriate.");
    if (config === "double" && rodDiameter === 0) warnings.push("Double-acting calculation assumes zero piston-rod area because no rod diameter was supplied. Enter rod diameter for a more accurate result.");
    if (H === 0) warnings.push("Head is zero, so calculated water power and overall efficiency are zero.");
    return {
      configuration: config, diameterM: D, strokeM: L, area: A, rodArea: rodArea,
      theoreticalDischarge: Qth, actualDischarge: Qactual, slip: slip,
      volumetricEfficiency: etaV, headM: H, waterPower: waterPower,
      inputPower: Pin, overallEfficiency: etaOverall, specificEnergy: specificEnergy,
      warnings: warnings,
      assumptions: [
        config === "single" ? "Single-acting pump: one delivery stroke per crank revolution." : "Double-acting pump: two working sides per revolution; rod-side area is deducted when rod diameter is supplied.",
        "Constant piston speed approximation is used for average theoretical discharge.",
        "Water power is calculated using actual discharge and total head.",
        "Overall efficiency uses the supplied shaft input power."
      ]
    };
  }

  function solveCentrifugalPump(input) {
    var Q = positive(input.flowRate, "Flow rate", false);
    var H = positive(input.head, "Manometric head", false);
    var N = positive(input.speed, "Pump speed", false);
    var D = positive(input.impellerDiameter, "Impeller diameter", false);
    var Pin = positive(input.inputPower, "Shaft input power", false);
    var rho = positive(input.density, "Fluid density", false);
    var g = positive(input.gravity, "Gravitational acceleration", false);
    if (input.flowUnit === "ls") Q /= 1000;
    else if (input.flowUnit === "m3h") Q /= 3600;
    if (input.headUnit === "ft") H *= 0.3048;
    if (input.diameterUnit === "mm") D /= 1000;
    if (input.powerUnit === "w") Pin /= 1000;
    Pin *= 1000;
    var waterPower = rho * g * Q * H;
    var efficiency = waterPower / Pin * 100;
    var tipSpeed = Math.PI * D * N / 60;
    var specificSpeed = N * Math.sqrt(Q) / Math.pow(H, 0.75);
    var headCoefficient = g * H / (tipSpeed * tipSpeed);
    var flowCoefficient = Q / ((N / 60) * Math.pow(D, 3));
    var warnings = [];
    if (efficiency > 100) warnings.push("Overall efficiency exceeds 100%. Check the flow rate, head, shaft power and units.");
    if (efficiency < 0) warnings.push("A negative efficiency was calculated. Review the input values and sign conventions.");
    if (specificSpeed < 5 || specificSpeed > 300) warnings.push("The calculated metric specific speed is outside a common preliminary range. Confirm units and the selected operating point; this is not a pump-selection verdict.");
    return {
      flowRate: Q, headM: H, speed: N, diameterM: D, inputPower: Pin,
      waterPower: waterPower, efficiency: efficiency, tipSpeed: tipSpeed,
      specificSpeed: specificSpeed, headCoefficient: headCoefficient,
      flowCoefficient: flowCoefficient, warnings: warnings,
      assumptions: [
        "Steady operating point with the supplied flow rate and manometric head.",
        "Water power is calculated as ρgQH; shaft input power is the pump input boundary.",
        "Metric specific speed uses N in rpm, Q in m³/s and H in metres. Values depend on the convention used.",
        "Velocity-triangle losses and pump characteristic curves are not inferred from these inputs."
      ]
    };
  }

  function runSelfTests() {
    var tests = [];
    function check(name, actual, expected, tolerance) {
      var pass = Math.abs(actual - expected) <= (tolerance || 1e-9) * Math.max(1, Math.abs(expected));
      tests.push({ name: name, pass: pass, actual: actual, expected: expected });
    }
    var result = solveReciprocatingPump({
      diameter: 150, diameterUnit: "mm", stroke: 300, strokeUnit: "mm", speed: 60,
      actualDischarge: 4, dischargeUnit: "ls", head: 20, headUnit: "m",
      inputPower: 1.5, powerUnit: "kw", density: 1000, gravity: 9.81,
      configuration: "single"
    });
    check("Piston area", result.area, Math.PI * 0.15 * 0.15 / 4);
    check("Theoretical discharge", result.theoreticalDischarge, Math.PI * 0.15 * 0.15 / 4 * 0.3);
    check("Volumetric efficiency", result.volumetricEfficiency, 4 / (Math.PI * 0.15 * 0.15 / 4 * 0.3) * 100);
    check("Water power", result.waterPower, 1000 * 9.81 * 0.004 * 20);
    check("Overall efficiency", result.overallEfficiency, (1000 * 9.81 * 0.004 * 20) / 1500 * 100);
    var doubleResult = solveReciprocatingPump({
      diameter: 0.15, diameterUnit: "m", stroke: 0.3, strokeUnit: "m", speed: 60,
      actualDischarge: 0.008, dischargeUnit: "m3s", head: 20, headUnit: "m",
      inputPower: 3, powerUnit: "kw", density: 1000, gravity: 9.81,
      configuration: "double", rodDiameter: 0.03, rodUnit: "m"
    });
    check("Double-acting discharge with rod area", doubleResult.theoreticalDischarge,
      (2 * Math.PI * 0.15 * 0.15 / 4 - Math.PI * 0.03 * 0.03 / 4) * 0.3);
    var centrifugal = solveCentrifugalPump({
      flowRate: 20, flowUnit: "ls", head: 30, headUnit: "m",
      speed: 1450, impellerDiameter: 250, diameterUnit: "mm",
      inputPower: 10, powerUnit: "kw", density: 1000, gravity: 9.81
    });
    check("Centrifugal pump water power", centrifugal.waterPower, 1000 * 9.81 * 0.02 * 30);
    check("Centrifugal pump overall efficiency", centrifugal.efficiency, 58.86);
    check("Centrifugal pump impeller tip speed", centrifugal.tipSpeed, Math.PI * 0.25 * 1450 / 60);
    return tests;
  }

  global.MechCalcEngineering = {
    solveReciprocatingPump: solveReciprocatingPump,
    solveCentrifugalPump: solveCentrifugalPump,
    runSelfTests: runSelfTests,
    formatNumber: fmt
  };
})(window);