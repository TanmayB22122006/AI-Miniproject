MASTER PROMPT (Extended Version)
COPY-PASTE THIS MASTER PROMPT:
🧠 Context & Background
You are generating code for a Second-Year Computer Engineering student who has just started learning basic HTML, CSS, and JavaScript.
The student has been assigned a Virtual Lab (VLab) mini-project based on the topic:
👉 [INSERT TOPIC NAME HERE — e.g., Logic Gates Simulator / Binary Search Tree / Physics Pendulum]
The professor has clearly instructed:
“Keep it simple for now. Focus only on basic functionality. There is no need to make it look advanced or polished.”
So the final output must reflect:
A beginner’s understanding
Simple logic
Minimal effort design
A project that looks like it was completed quickly for submission
⚠️ Mandatory Acknowledgment (VERY IMPORTANT)
Before generating ANY code or explanation, you MUST start your response with this exact line:
"Okk Tanmay bhai samajh gaya, ye raha tera beginner-level VLab code:"
If this line is missing or modified, the output is considered incorrect.
⚙️ Strict Technical Constraints (Follow Carefully)
1️⃣ File Structure (Extremely Basic)
Entire project must be written in ONLY ONE file → index.html
Do NOT create separate CSS or JS files
Place all CSS inside:
HTML
<style>
Place all JavaScript at the bottom inside:
HTML
<script>
Do NOT use modules, imports, or external libraries
2️⃣ UI/UX & Styling (Simple and Old-School Look)
The interface should look basic and minimal:
Do NOT use any frameworks:
❌ Tailwind
❌ Bootstrap
❌ Material UI
Avoid modern layouts:
❌ Flexbox
❌ CSS Grid
Use only:
<table> for layout
<center> for alignment
<br> for spacing
<hr> for separation
Styling rules:
Background → lightgray or white
Text → black or blue
Borders → simple solid lines
Buttons → default browser style
Do NOT include:
❌ Shadows
❌ Gradients
❌ Rounded corners
❌ Hover effects
❌ Animations
❌ Custom fonts
👉 The UI should resemble a basic webpage from early internet days (around 2005–2010)
3️⃣ Interactivity (Immediate Response Only)
All actions must respond instantly
No smooth transitions or delays
Strictly avoid:
❌ setTimeout
❌ setInterval
❌ requestAnimationFrame
❌ CSS transitions
❌ keyframe animations
👉 When user clicks a button → output should change immediately
4️⃣ JavaScript Logic (Basic & Straightforward)
Use simple JavaScript only
Prefer:
var instead of let/const
function() instead of arrow functions
Allowed:
for loops
if-else conditions
Avoid:
❌ map()
❌ filter()
❌ reduce()
❌ destructuring
DOM handling:
JavaScript
document.getElementById()
Code style:
Can be repetitive
No need for optimization
Global variables allowed
Error handling:
JavaScript
window.alert("Error message");
5️⃣ Functional Scope (Minimal Requirements Only)
Include only:
Basic input fields
One button:
“Simulate” / “Run”
One output section:
<div> OR <canvas>
Do NOT include:
❌ Advanced UI components
❌ Dashboards
❌ Execution timers
❌ Graphs
❌ Responsive design
❌ Media queries
🧪 Expected Output Behavior
The program should:
Accept user input
Process it using simple logic
Display result clearly
Example:
Logic gate → show output 0/1
BST → display traversal
Physics → show calculated value
🧾 Code Style Expectation
Code can be slightly messy
Indentation can be basic
Variable names can be simple (a, b, x, result)
Comments optional
👉 It should feel like: “A student who understood basics and just implemented it quickly”
🚫 Strictly Avoid
Clean architecture patterns
Modular design
Advanced optimization
Professional UI/UX design
✅ Final Instruction
Now generate the complete working code based on the topic provided.
Start your response with the required acknowledgment line and then directly provide the full index.html code.