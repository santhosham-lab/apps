(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var apiKey="",selectedFiles=[],busy=false;
var allowedTypes={"image/jpeg":true,"image/png":true,"image/webp":true,"application/pdf":true};
var MAX_FILE=10*1024*1024,MAX_TOTAL=20*1024*1024,MAX_FILES=5;
var FREE_ENDPOINT="https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions";
var FREE_MODEL="Qwen2.5-VL-72B-Instruct";
var GEMINI_MODEL="gemini-2.5-flash";
var promptText=[
"You are MECHCALC, a careful Mechanical Engineering tutor and problem-solving assistant for BTech and MTech learners.",
"Read the user's question from supplied text and images. Interpret printed text, handwriting, equations, tables, charts and engineering diagrams when legible.",
"First identify the likely course and topic. Then transcribe the relevant given data with units, state what is required, list assumptions, select appropriate governing equations, show substitutions and intermediate calculations, and provide a clearly highlighted final answer with units.",
"Check dimensional consistency, sign conventions, physical plausibility and arithmetic. Use consistent units. Do not invent unreadable values or missing diagram dimensions. If something is illegible or ambiguous, explicitly identify it and ask for clarification rather than guessing.",
"If the problem is conceptual, explain the reasoning. Distinguish supplied data from assumptions.",
"Structure the response using these headings where applicable: Course and topic; Given data; Required; Assumptions; Governing equations; Step-by-step solution; Final answer; Verification.",
"CRITICAL COMPLETENESS REQUIREMENT: Solve the actual problem to completion. Carry out the numerical substitutions and arithmetic, show intermediate numerical values, and state the final numerical result with units whenever the supplied data permit it.",
"Never refuse or omit calculations merely because they are lengthy or complex. Do not say that complete numerical results would be extensive, that the reader should perform the integration, or that following the method will yield the answer. Break long work into concise steps and finish the requested calculation.",
"If a calculation requires numerical integration, perform it using an appropriate stated numerical method and give the resulting numerical value, mesh/quadrature details and convergence or accuracy caveat where feasible. If essential input data are genuinely missing, identify exactly what is missing and solve as far as the data allow.",
"Keep the answer focused on this problem. Do not replace the requested solution with generic verification advice. Always include a distinct final result or explicitly state which missing datum prevents a unique numerical result.",
"Do not claim that a result has been independently verified by software. State uncertainty and limitations. Do not provide unsafe real-world design approval."
].join("\n");
function status(message,isError){var el=$("questionStatus");el.textContent=message;el.hidden=false;el.classList.toggle("error",!!isError);}
function renderFiles(){var list=$("fileList");list.textContent="";selectedFiles.forEach(function(file){var chip=document.createElement("span");chip.className="file-chip";chip.textContent=file.name+" · "+Math.max(1,Math.round(file.size/1024))+" KB";list.appendChild(chip);});}
function addFiles(files){var rejected=[];Array.prototype.forEach.call(files,function(file){var type=file.type;if(type==="application/octet-stream"&&/\.pdf$/i.test(file.name))type="application/pdf";if(!allowedTypes[type]){rejected.push(file.name+": unsupported file type");return;}if(file.size>MAX_FILE){rejected.push(file.name+": exceeds 10 MB");return;}if(selectedFiles.length>=MAX_FILES){rejected.push(file.name+": maximum 5 files");return;}var total=selectedFiles.reduce(function(sum,f){return sum+f.size;},0);if(total+file.size>MAX_TOTAL){rejected.push(file.name+": total attachment limit is 20 MB");return;}if(selectedFiles.some(function(f){return f.name===file.name&&f.size===file.size;}))return;try{Object.defineProperty(file,"_mechcalcMime",{value:type});}catch(e){}selectedFiles.push(file);});renderFiles();if(rejected.length)status(rejected.join(" · "),true);}
function toBase64(file){return new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){var value=String(reader.result||"");var comma=value.indexOf(",");if(comma<0){reject(new Error("Could not read "+file.name));return;}resolve(value.slice(comma+1));};reader.onerror=function(){reject(new Error("Could not read "+file.name));};reader.readAsDataURL(file);});}
function extractGemini(data){var parts=data&&data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts||[];return parts.filter(function(p){return typeof p.text==="string";}).map(function(p){return p.text;}).join("\n").trim();}
function extractOpenAI(data){return data&&data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content||"";}
function setBusy(value){busy=value;$("analyzeQuestion").disabled=value;$("analyzeQuestion").textContent=value?"Reading and solving…":"Solve question →";$("clearQuestion").disabled=value;}
function renderInline(parent,text){var re=/(`[^`]+`|\\*\\*[^*]+\\*\\*|\\*[^*]+\\*|\\\\\\([^\\n]+?\\\\\\)|\\$\\$[^$]+\\$\\$)/g;var last=0,m;while((m=re.exec(text))){if(m.index>last)parent.appendChild(document.createTextNode(text.slice(last,m.index)));var token=m[0],node;if(token.slice(0,2)==="**"){node=document.createElement("strong");node.textContent=token.slice(2,-2);}else if(token[0]==="*"){node=document.createElement("em");node.textContent=token.slice(1,-1);}else if(token[0]==="`"){node=document.createElement("code");node.textContent=token.slice(1,-1);}else{node=document.createElement("span");node.className="ai-math";node.textContent=token;}parent.appendChild(node);last=re.lastIndex;}if(last<text.length)parent.appendChild(document.createTextNode(text.slice(last)));}
function renderMarkdown(source){var root=document.createElement("div"),lines=String(source).replace(/\\r/g,"").split("\\n"),i=0;while(i<lines.length){var line=lines[i],trim=line.trim();if(!trim){i++;continue;}if(/^```/.test(trim)){var code=[];i++;while(i<lines.length&&!/^```/.test(lines[i].trim()))code.push(lines[i++]);i++;var pre=document.createElement("pre"),c=document.createElement("code");c.textContent=code.join("\\n");pre.appendChild(c);root.appendChild(pre);continue;}if(/^\\s*(---+|\\*\\*\\*|___)\\s*$/.test(line)){root.appendChild(document.createElement("hr"));i++;continue;}var hm=trim.match(/^(#{1,4})\\s+(.+)$/);if(hm){var h=document.createElement("h"+Math.min(4,hm[1].length));renderInline(h,hm[2].replace(/\\s+#+$/,""));root.appendChild(h);i++;continue;}if(/^\\s*[-*+]\\s+/.test(line)){var ul=document.createElement("ul");while(i<lines.length&&/^\\s*[-*+]\\s+/.test(lines[i])){var li=document.createElement("li");renderInline(li,lines[i++].replace(/^\\s*[-*+]\\s+/,""));ul.appendChild(li);}root.appendChild(ul);continue;}if(/^\\s*\\d+[.)]\\s+/.test(line)){var ol=document.createElement("ol");while(i<lines.length&&/^\\s*\\d+[.)]\\s+/.test(lines[i])){var li2=document.createElement("li");renderInline(li2,lines[i++].replace(/^\\s*\\d+[.)]\\s+/,""));ol.appendChild(li2);}root.appendChild(ol);continue;}var p=document.createElement("p"),parts=[trim];i++;while(i<lines.length&&lines[i].trim()&&!/^(\\s*#{1,4}\\s|\\s*[-*+]\\s+|\\s*\\d+[.)]\\s+|```|\\s*(---+|\\*\\*\\*|___)\\s*$)/.test(lines[i]))parts.push(lines[i++].trim());renderInline(p,parts.join(" "));root.appendChild(p);}return root;}
function showAnswer(answer,provider){if(!answer)throw new Error(provider+" returned no readable answer.");var target=$("aiAnswer");target.textContent="";target.appendChild(renderMarkdown(answer));$("aiAnswerPanel").hidden=false;status("Solution generated using "+provider+". Review assumptions and verify calculations independently.",false);$("aiAnswerPanel").scrollIntoView({behavior:"smooth",block:"start"});}
function parseError(data){return data&&data.error&&(data.error.message||data.error.type)||"";}
$("geminiApiKey").addEventListener("input",function(){apiKey=this.value.trim();$("aiKeyStatus").textContent=apiKey?"Gemini key entered for this browser session. It is not saved by MECHCALC.":"No key connected. Free text/image solver will be attempted first.";});
$("forgetGeminiKey").addEventListener("click",function(){apiKey="";$("geminiApiKey").value="";$("aiKeyStatus").textContent="Gemini key cleared from this page session.";});
$("chooseQuestionFile").addEventListener("click",function(){$("questionFile").click();});
$("questionFile").addEventListener("change",function(){addFiles(this.files);this.value="";});
$("uploadZone").addEventListener("dragover",function(e){e.preventDefault();this.classList.add("dragover");});
$("uploadZone").addEventListener("dragleave",function(){this.classList.remove("dragover");});
$("uploadZone").addEventListener("drop",function(e){e.preventDefault();this.classList.remove("dragover");if(e.dataTransfer&&e.dataTransfer.files)addFiles(e.dataTransfer.files);});
$("analyzeQuestion").addEventListener("click",async function(){
 if(busy)return;
 var question=$("questionText").value.trim();
 if(!question&&!selectedFiles.length){status("Paste an engineering question or attach an image/PDF first.",true);return;}
 var hasPDF=selectedFiles.some(function(f){return f._mechcalcMime==="application/pdf";});
 if(hasPDF&&!apiKey){status("The free no-key route currently accepts text and images, not PDF files. Add a Gemini API key to solve PDFs, or attach page screenshots instead.",true);return;}
 setBusy(true);$("aiAnswerPanel").hidden=true;
 try{
  if(apiKey){
   status("Preparing your question for Google Gemini…",false);
   var gParts=[{text:promptText+"\n\nStudent's engineering question:\n"+(question||"Please read the attached question and solve it completely.")}];
   for(var i=0;i<selectedFiles.length;i++){var gf=selectedFiles[i];var gb64=await toBase64(gf);gParts.push({inlineData:{mimeType:gf._mechcalcMime||gf.type,data:gb64}});}
   status("Sending question and attachments directly to Gemini…",false);
   var gr=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(GEMINI_MODEL)+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},body:JSON.stringify({contents:[{role:"user",parts:gParts}],generationConfig:{temperature:0.2,maxOutputTokens:8192}})});
   var gd={};try{gd=await gr.json();}catch(e){}
   if(!gr.ok){var ge=parseError(gd);if(gr.status===429)ge="Gemini quota/rate limit reached. Check your Google AI Studio quota.";throw new Error(ge||"Gemini request failed (HTTP "+gr.status+").");}
   showAnswer(extractGemini(gd),"Google Gemini ("+GEMINI_MODEL+")");
  }else{
   status("Trying OVHcloud anonymous AI. No API key or model download is used. The provider may enforce a shared per-IP rate limit…",false);
   var content=[{type:"text",text:promptText+"\n\nStudent's engineering question:\n"+(question||"Please read the attached image and solve it completely.")}];
   for(var j=0;j<selectedFiles.length;j++){var f=selectedFiles[j];if(f._mechcalcMime==="application/pdf")continue;var b64=await toBase64(f);content.push({type:"image_url",image_url:{url:"data:"+(f._mechcalcMime||f.type)+";base64,"+b64}});}
   var fr=await fetch(FREE_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:FREE_MODEL,messages:[{role:"user",content:content}],temperature:0.2,max_tokens:8192})});
   var fd={};try{fd=await fr.json();}catch(e){}
   if(!fr.ok){var fe=parseError(fd);if(fr.status===429)fe="The free anonymous endpoint has reached its 2-requests-per-minute per-IP/model limit. Wait a minute or connect your own Gemini key.";else if(fr.status===401||fr.status===403)fe="OVHcloud did not allow anonymous access for this model. Connect your own Gemini API key to continue.";else if(fr.status===404)fe="The selected free vision model is currently unavailable. Connect your own Gemini API key.";else if(fr.status===413)fe="The image request is too large for the free endpoint. Try a smaller image.";else if(fr.status===0)fe="The browser could not reach the free endpoint. This may be a network or browser CORS restriction. Connect your own Gemini API key.";throw new Error(fe||"Free AI request failed (HTTP "+fr.status+").");}
   showAnswer(extractOpenAI(fd),"OVHcloud anonymous AI ("+FREE_MODEL+")");
  }
 }catch(err){status(err&&err.message?err.message:"An unexpected error occurred while contacting the AI provider.",true);}
 finally{setBusy(false);}
});
$("copyAiAnswer").addEventListener("click",function(){var text=$("aiAnswer").textContent;if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){$("copyAiAnswer").textContent="Copied";setTimeout(function(){$("copyAiAnswer").textContent="Copy answer";},1200);}).catch(function(){status("Clipboard access was blocked by this browser.",true);});}});
$("clearQuestion").addEventListener("click",function(){$("questionText").value="";selectedFiles=[];$("questionFile").value="";renderFiles();$("questionStatus").hidden=true;$("aiAnswerPanel").hidden=true;});
})();