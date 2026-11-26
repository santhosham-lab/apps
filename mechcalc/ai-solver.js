(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var apiKey="",selectedFiles=[],busy=false;
var allowedTypes={"image/jpeg":true,"image/png":true,"image/webp":true,"application/pdf":true};
var MAX_FILE=10*1024*1024,MAX_TOTAL=20*1024*1024,MAX_FILES=5;
var promptText=[
"You are MECHCALC, a careful Mechanical Engineering tutor and problem-solving assistant for BTech and MTech learners.",
"Read the user's question from all supplied text, images and PDF pages. Interpret printed text, handwriting, equations, tables, charts and engineering diagrams when legible.",
"First identify the likely course and topic. Then transcribe the relevant given data with units, state what is required, list assumptions, select appropriate governing equations, show substitutions and intermediate calculations, and provide a clearly highlighted final answer with units.",
"Check dimensional consistency, sign conventions, physical plausibility and arithmetic. Use consistent units. Do not invent unreadable values or missing diagram dimensions. If something is illegible or ambiguous, explicitly identify it and ask for clarification rather than guessing.",
"If the problem is conceptual, explain the reasoning. If a diagram is needed for the solution, describe the relevant geometry and construction clearly. Distinguish supplied data from assumptions.",
"Structure the response using these headings where applicable: Course and topic; Given data; Required; Assumptions; Governing equations; Step-by-step solution; Final answer; Verification.",
"Do not claim that a result has been independently verified by software. State uncertainty and limitations. Do not provide unsafe real-world design approval."
].join("\n");
function status(message,isError){var el=$("questionStatus");el.textContent=message;el.hidden=false;el.classList.toggle("error",!!isError);}
function renderFiles(){var list=$("fileList");list.textContent="";selectedFiles.forEach(function(file){var chip=document.createElement("span");chip.className="file-chip";chip.textContent=file.name+" · "+Math.max(1,Math.round(file.size/1024))+" KB";list.appendChild(chip);});}
function addFiles(files){var rejected=[];Array.prototype.forEach.call(files,function(file){var type=file.type;if(type==="application/octet-stream"&&/\.pdf$/i.test(file.name))type="application/pdf";if(!allowedTypes[type]){rejected.push(file.name+": unsupported file type");return;}if(file.size>MAX_FILE){rejected.push(file.name+": exceeds 10 MB");return;}if(selectedFiles.length>=MAX_FILES){rejected.push(file.name+": maximum 5 files");return;}var total=selectedFiles.reduce(function(sum,f){return sum+f.size;},0);if(total+file.size>MAX_TOTAL){rejected.push(file.name+": total attachment limit is 20 MB");return;}if(selectedFiles.some(function(f){return f.name===file.name&&f.size===file.size;}))return;try{Object.defineProperty(file,"_mechcalcMime",{value:type});}catch(e){}selectedFiles.push(file);});renderFiles();if(rejected.length)status(rejected.join(" · "),true);}
function toBase64(file){return new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){var value=String(reader.result||"");var comma=value.indexOf(",");if(comma<0){reject(new Error("Could not read "+file.name));return;}resolve(value.slice(comma+1));};reader.onerror=function(){reject(new Error("Could not read "+file.name));};reader.readAsDataURL(file);});}
function extractText(data){var parts=data&&data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts||[];return parts.filter(function(p){return typeof p.text==="string";}).map(function(p){return p.text;}).join("\n").trim();}
function friendlyError(response,data){var msg=data&&data.error&&data.error.message;if(response.status===400)return "Gemini rejected the request: "+(msg||"Check the file type, size and model name.");if(response.status===401||response.status===403)return "Gemini did not accept this API key or the key lacks permission. Check the key and its Google AI Studio project.";if(response.status===404)return "The selected Gemini model or API endpoint was not found. Check the model name.";if(response.status===429)return "Your provider quota or rate limit has been reached. Wait or check usage and billing in your Google AI Studio account.";if(response.status>=500)return "Google Gemini is temporarily unavailable. Try again later.";return msg||("Gemini request failed (HTTP "+response.status+").");}
function setBusy(value){busy=value;$("analyzeQuestion").disabled=value;$("analyzeQuestion").textContent=value?"Reading and solving…":"Solve question →";$("clearQuestion").disabled=value;}
$("geminiApiKey").addEventListener("input",function(){apiKey=this.value.trim();$("aiKeyStatus").textContent=apiKey?"API key entered for this browser session. It will not be saved by MECHCALC.":"No key connected. No AI request can be made until you provide your own key.";});
$("forgetGeminiKey").addEventListener("click",function(){apiKey="";$("geminiApiKey").value="";$("aiKeyStatus").textContent="API key cleared from this page session.";});
$("chooseQuestionFile").addEventListener("click",function(){$("questionFile").click();});
$("questionFile").addEventListener("change",function(){addFiles(this.files);this.value="";});
$("uploadZone").addEventListener("dragover",function(e){e.preventDefault();this.classList.add("dragover");});
$("uploadZone").addEventListener("dragleave",function(){this.classList.remove("dragover");});
$("uploadZone").addEventListener("drop",function(e){e.preventDefault();this.classList.remove("dragover");if(e.dataTransfer&&e.dataTransfer.files)addFiles(e.dataTransfer.files);});
$("analyzeQuestion").addEventListener("click",async function(){
 if(busy)return;
 var question=$("questionText").value.trim();
 if(!apiKey){status("Enter your own Gemini API key above. MECHCALC does not provide or pay for a shared AI key.",true);$("geminiApiKey").focus();return;}
 if(!question&&!selectedFiles.length){status("Paste an engineering question or attach an image/PDF first.",true);return;}
 var model="gemini-2.5-flash";
 setBusy(true);$("aiAnswerPanel").hidden=true;status("Preparing your question and attachments for Google Gemini…",false);
 try{
  var parts=[{text:promptText+"\n\nStudent's engineering question:\n"+(question||"Please read the attached question and solve it completely.")}];
  for(var i=0;i<selectedFiles.length;i++){var file=selectedFiles[i];var b64=await toBase64(file);parts.push({inlineData:{mimeType:file._mechcalcMime||file.type,data:b64}});}
  status("Sending "+(selectedFiles.length?"question and "+selectedFiles.length+" attachment(s)":"question")+" to Gemini. Interpreting and solving…",false);
  var response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},body:JSON.stringify({contents:[{role:"user",parts:parts}],generationConfig:{temperature:0.2,maxOutputTokens:8192}})});
  var data={};try{data=await response.json();}catch(e){}
  if(!response.ok)throw new Error(friendlyError(response,data));
  var answer=extractText(data);
  if(!answer)throw new Error("Gemini returned no readable answer. The request may have been blocked or the model response may have been empty.");
  $("aiAnswer").textContent=answer;$("aiAnswerPanel").hidden=false;status("Solution generated by "+model+". Review the assumptions and verify the calculations independently.",false);
  $("aiAnswerPanel").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(err){status(err&&err.message?err.message:"An unexpected error occurred while contacting Gemini.",true);}
 finally{setBusy(false);}
});
$("copyAiAnswer").addEventListener("click",function(){var text=$("aiAnswer").textContent;if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){$("copyAiAnswer").textContent="Copied";setTimeout(function(){$("copyAiAnswer").textContent="Copy answer";},1200);}).catch(function(){status("Clipboard access was blocked by this browser.",true);});}});
$("clearQuestion").addEventListener("click",function(){$("questionText").value="";selectedFiles=[];$("questionFile").value="";renderFiles();$("questionStatus").hidden=true;$("aiAnswerPanel").hidden=true;});
})();