(function () {
  "use strict";
  var courses = [
    { id:"fluid-mechanics", name:"Fluid Mechanics", topics:[
      {id:"fluid-properties",name:"Properties of fluids"},{id:"fluid-statics",name:"Fluid statics"},{id:"fluid-kinematics",name:"Fluid kinematics"},{id:"fluid-dynamics",name:"Fluid dynamics"},{id:"bernoulli",name:"Bernoulli equation"},{id:"flow-measurement",name:"Flow measurement"},{id:"pipe-flow",name:"Flow through pipes and losses"},{id:"boundary-layer",name:"Boundary layer theory"},{id:"dimensional-analysis",name:"Dimensional analysis"},{id:"reciprocating-pump",name:"Reciprocating pump",available:true,detail:"Discharge, slip, volumetric efficiency and overall efficiency calculator."},{id:"centrifugal-pump",name:"Centrifugal pump",detail:"The calculation engine contains a solver; the interactive calculator form is not yet implemented."},{id:"hydraulic-turbines",name:"Hydraulic turbines"}
    ]},
    { id:"thermodynamics", name:"Thermodynamics", topics:[{id:"thermo-basics",name:"Basic concepts and properties"},{id:"first-law",name:"First law of thermodynamics"},{id:"second-law",name:"Second law and entropy"},{id:"steam-properties",name:"Properties of steam"},{id:"gas-cycles",name:"Gas power cycles"},{id:"vapour-cycles",name:"Vapour power cycles"},{id:"ic-engine-cycles",name:"IC engine air-standard cycles"}]},
    { id:"strength-of-materials", name:"Strength of Materials", topics:[{id:"stress-strain",name:"Stress and strain"},{id:"elastic-constants",name:"Elastic constants"},{id:"axial-loading",name:"Axially loaded members"},{id:"shear-moment",name:"Shear force and bending moment"},{id:"bending-stress",name:"Bending stress"},{id:"torsion",name:"Torsion of circular shafts"},{id:"deflection",name:"Beam deflection"},{id:"columns",name:"Columns and struts"}]},
    { id:"theory-of-machines", name:"Theory of Machines", topics:[{id:"mechanisms",name:"Kinematic mechanisms"},{id:"velocity-acceleration",name:"Velocity and acceleration analysis"},{id:"gears",name:"Gear trains"},{id:"flywheel",name:"Flywheel"},{id:"governors",name:"Governors"},{id:"balancing",name:"Balancing of rotating masses"},{id:"vibrations",name:"Mechanical vibrations"}]},
    { id:"heat-transfer", name:"Heat Transfer", topics:[{id:"conduction",name:"Heat conduction"},{id:"convection",name:"Convection"},{id:"radiation",name:"Thermal radiation"},{id:"heat-exchangers",name:"Heat exchangers"},{id:"extended-surfaces",name:"Extended surfaces (fins)"},{id:"boiling-condensation",name:"Boiling and condensation"}]},
    { id:"machine-design", name:"Machine Design", topics:[{id:"design-basics",name:"Design fundamentals and failure theories"},{id:"shafts",name:"Shaft design"},{id:"keys-couplings",name:"Keys and couplings"},{id:"springs",name:"Spring design"},{id:"bearings",name:"Bearing selection"},{id:"welded-joints",name:"Welded and riveted joints"},{id:"gears-design",name:"Gear design"}]},
    { id:"manufacturing", name:"Manufacturing Technology", topics:[{id:"casting",name:"Casting processes"},{id:"forming",name:"Metal forming processes"},{id:"welding",name:"Welding processes"},{id:"machining",name:"Machining and cutting tools"},{id:"tool-life",name:"Tool life and machining time"},{id:"cnc",name:"CNC and automation"}]},
    { id:"refrigeration-ac", name:"Refrigeration and Air Conditioning", topics:[{id:"refrigeration-basics",name:"Refrigeration fundamentals"},{id:"vcrs",name:"Vapour compression system"},{id:"vas",name:"Vapour absorption system"},{id:"psychrometry",name:"Psychrometry"},{id:"cooling-load",name:"Cooling load estimation"},{id:"air-conditioning",name:"Air-conditioning systems"}]},
    { id:"automobile", name:"Automobile Engineering", topics:[{id:"vehicle-basics",name:"Vehicle systems and layout"},{id:"engines",name:"Automotive engines"},{id:"transmission",name:"Transmission systems"},{id:"brakes",name:"Braking systems"},{id:"suspension",name:"Suspension and steering"},{id:"vehicle-performance",name:"Vehicle performance"}]},
    { id:"power-plant", name:"Power Plant Engineering", topics:[{id:"steam-power",name:"Steam power plants"},{id:"gas-turbine",name:"Gas turbine plants"},{id:"hydro-power",name:"Hydroelectric plants"},{id:"nuclear-power",name:"Nuclear power plants"},{id:"renewables",name:"Renewable energy systems"},{id:"economics",name:"Power plant economics"}]},
    { id:"metrology", name:"Metrology and Measurements", topics:[{id:"measurement-basics",name:"Measurement fundamentals and errors"},{id:"linear-measurement",name:"Linear measurement instruments"},{id:"angular-measurement",name:"Angular measurement"},{id:"limits-fits",name:"Limits, fits and tolerances"},{id:"gauges",name:"Gauge design"},{id:"surface-finish",name:"Surface roughness"}]},
    { id:"engineering-materials", name:"Engineering Materials", topics:[{id:"material-structure",name:"Structure of materials"},{id:"ferrous",name:"Ferrous alloys"},{id:"non-ferrous",name:"Non-ferrous alloys"},{id:"heat-treatment",name:"Heat treatment"},{id:"material-testing",name:"Mechanical testing of materials"},{id:"composites",name:"Polymers and composites"}]}
  ];
  var courseList=document.getElementById("courseSelector");
  var topicList=document.getElementById("topicSelector");
  var topicCount=document.getElementById("topicCount");
  var workspace=document.getElementById("pumpWorkspace");
  var status=document.getElementById("topicStatus");
  if(!courseList||!topicList||!workspace||!status)return;
  var selectedCourse="fluid-mechanics";
  var selectedTopic="";
  function button(className,label,selected,index,meta,state){
    var b=document.createElement("button");
    b.type="button";b.className="selector-option";b.setAttribute("role","option");b.setAttribute("aria-selected",selected?"true":"false");
    var number=document.createElement("span");number.className="selector-index";number.textContent=String(index+1).padStart(2,"0");b.appendChild(number);
    var copy=document.createElement("span");copy.className="selector-option-copy";
    var title=document.createElement("strong");title.textContent=label;copy.appendChild(title);
    if(meta){var sub=document.createElement("small");sub.textContent=meta;copy.appendChild(sub);}
    b.appendChild(copy);
    if(state){var tag=document.createElement("span");tag.className="topic-state"+(state==="Available"?" available":"");tag.textContent=state;b.appendChild(tag);}
    return b;
  }
  function renderCourses(){
    courseList.textContent="";
    courses.forEach(function(course,index){
      var b=button("selector-option",course.name,course.id===selectedCourse,index,"", "");
      b.dataset.course=course.id;courseList.appendChild(b);
    });
  }
  function renderTopics(){
    var course=courses.find(function(item){return item.id===selectedCourse;});
    topicList.textContent="";topicCount.textContent=course.topics.length+" topics";
    course.topics.forEach(function(topic,index){
      var available=!!topic.available;
      var b=button("selector-option",topic.name,topic.id===selectedTopic,index,available?"Calculator ready":"",available?"Available":"Planned");
      b.dataset.topic=topic.id;topicList.appendChild(b);
    });
    var selected=course.topics.find(function(item){return item.id===selectedTopic;});
    if(selected)showTopic(selected);
    else showPrompt();
  }
  function showPrompt(){
    workspace.hidden=true;status.hidden=false;status.textContent="Select a topic to open its calculator or view its implementation status.";
  }
  function showTopic(topic){
    if(topic.available){
      status.hidden=true;workspace.hidden=false;
      workspace.scrollIntoView({behavior:"smooth",block:"start"});
    }else{
      workspace.hidden=true;status.hidden=false;
      var heading=document.createElement("strong");heading.textContent=topic.name+" — planned module";
      var detail=document.createElement("span");detail.textContent=topic.detail||"This topic is listed in the course directory. Its dedicated calculator is not implemented yet.";
      status.textContent="";status.appendChild(heading);status.appendChild(detail);
    }
  }
  courseList.addEventListener("click",function(event){
    var target=event.target.closest("button[data-course]");if(!target)return;
    selectedCourse=target.dataset.course;
    var course=courses.find(function(item){return item.id===selectedCourse;});
    selectedTopic="";
    renderCourses();renderTopics();
  });
  topicList.addEventListener("click",function(event){
    var target=event.target.closest("button[data-topic]");if(!target)return;
    selectedTopic=target.dataset.topic;renderTopics();
  });
  renderCourses();renderTopics();
  selectedTopic="reciprocating-pump";renderTopics();
})();