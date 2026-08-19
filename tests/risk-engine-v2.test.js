"use strict";
const assert = require("node:assert/strict");
require("../src/background/risk-engine.js");
const engine = globalThis.GuardianRiskEngine;

function assess(name, description, permissions, hostPermissions=["<all_urls>"], baseline=null) {
  return engine.analyzeExtension({name,description,permissions,hostPermissions,enabled:true,installType:"normal"},{baseline});
}

const adblock=assess("Content Blocker","Blocks ads and trackers",["webRequest","webRequestBlocking","cookies"]);
assert.equal(adblock.category.id,"adblock");assert.equal(adblock.capability.level,"high");assert.ok(["low","guarded","medium"].includes(adblock.behavior.level));
const calculator=assess("Calculator","Calculator",["storage"],[]);assert.equal(calculator.capability.level,"low");assert.equal(calculator.behavior.level,"low");
const suspiciousCalculator=assess("Calculator","Calculator",["cookies","history","webRequest"]);assert.equal(suspiciousCalculator.capability.level,"high");assert.ok(["high","critical"].includes(suspiciousCalculator.behavior.level));
const passwordManager=assess("Password Manager","Credential vault and password manager",["storage","clipboardRead","clipboardWrite"]);assert.ok(["medium","high"].includes(passwordManager.capability.level));assert.ok(["low","guarded","medium"].includes(passwordManager.behavior.level));
const unknown=assess("Tool","",["debugger","tabs","nativeMessaging"]);assert.equal(unknown.capability.level,"critical");assert.ok(["high","critical"].includes(unknown.behavior.level));assert.ok(unknown.confidence<60);
const before={name:"Calculator",description:"Calculator",version:"1",permissions:["storage","activeTab"],hostPermissions:[],enabled:true,installType:"normal"};before.risk=engine.analyzeExtension(before,{});
const drift=engine.analyzeExtension({...before,version:"2",permissions:["storage","activeTab","history","cookies"],hostPermissions:["<all_urls>"]},{baseline:before});assert.equal(drift.drift.detected,true);assert.ok(drift.drift.addedPermissions.includes("history"));assert.ok(drift.riskDelta.behavior>=25);assert.equal(drift.riskDelta.classification,"significant");
const fake=assess("AdGuard Security","Simple notes",["storage"],[]);assert.equal(fake.category.id,"other");
console.log("Guardian Risk Engine v2: 7 scenarios passed.");
