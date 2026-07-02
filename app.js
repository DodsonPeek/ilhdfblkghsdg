/*=========================================
 AI Wallpaper Studio
 app.js
=========================================*/

const $ = (e) => document.querySelector(e);
const $$ = (e) => document.querySelectorAll(e);

const tabs = $$(".tab");
const buttons = $$(".nav-button");

const upload = $("#imageUpload");
const dropZone = $("#dropZone");

const selectedImages = $("#selectedImages");
const preview = $("#wallpaperPreview");

const generatedGallery = $("#generatedGallery");

const viewer = $("#imageViewer");
const viewerImage = $("#viewerImage");

let uploadedImages = [];
let generatedImages = [];

/*================================*/

window.addEventListener("load", () => {

setTimeout(() => {

$("#loading-screen").style.display = "none";

},900);

});

/*================================*/
/* Tabs */
/*================================*/

buttons.forEach(btn=>{

btn.onclick=()=>{

buttons.forEach(b=>b.classList.remove("active"));

tabs.forEach(t=>t.classList.remove("active"));

btn.classList.add("active");

document
.getElementById(btn.dataset.tab+"Tab")
.classList.add("active");

$("#pageTitle").textContent=btn.textContent.trim();

}

});

/*================================*/
/* Theme */
/*================================*/

$("#themeToggle").onclick=()=>{

document.body.classList.toggle("light");

};

/*================================*/
/* Upload */
/*================================*/

upload.addEventListener("change",e=>{

handleFiles(e.target.files);

});

/*================================*/

[
"dragenter",
"dragover"
].forEach(event=>{

dropZone.addEventListener(event,e=>{

e.preventDefault();

dropZone.classList.add("drag");

});

});

[
"dragleave",
"drop"
].forEach(event=>{

dropZone.addEventListener(event,e=>{

e.preventDefault();

dropZone.classList.remove("drag");

});

});

/*================================*/

dropZone.addEventListener("drop",e=>{

handleFiles(e.dataTransfer.files);

});

/*================================*/

function handleFiles(files){

[...files].forEach(file=>{

if(!file.type.startsWith("image")) return;

const reader=new FileReader();

reader.onload=e=>{

uploadedImages.push(e.target.result);

createThumbnail(e.target.result);

notify(file.name+" added");

};

reader.readAsDataURL(file);

});

}

/*================================*/

function createThumbnail(src){

const img=document.createElement("img");

img.src=src;

img.onclick=()=>openViewer(src);

selectedImages.appendChild(img);

}

/*================================*/

function openViewer(src){

viewer.classList.remove("hidden");

viewerImage.src=src;

}

$("#closeViewer").onclick=()=>{

viewer.classList.add("hidden");

};

viewer.onclick=e=>{

if(e.target===viewer)

viewer.classList.add("hidden");

};

/*================================*/
/* Notifications */
/*================================*/

function notify(text){

const n=document.createElement("div");

n.className="notification";

n.textContent=text;

$("#notifications").appendChild(n);

setTimeout(()=>{

n.remove();

},3000);

}

/*================================*/
/* Wallpaper Preview */
/*================================*/

$("#generateWallpaper").onclick=()=>{

if(uploadedImages.length===0){

notify("Upload images first.");

return;

}

$("#progressModal").classList.remove("hidden");

let p=0;

const timer=setInterval(()=>{

p+=5;

$("#progressFill").style.width=p+"%";

$("#progressText").textContent=
"Analyzing images... "+p+"%";

if(p>=100){

clearInterval(timer);

$("#progressModal").classList.add("hidden");

showWallpaper(uploadedImages[0]);

}

},60);

};

function showWallpaper(src){

preview.innerHTML="";

const img=document.createElement("img");

img.src=src;

preview.appendChild(img);

notify("Wallpaper generated.");

}

/*================================*/
/* Download */
/*================================*/

$("#downloadWallpaper").onclick=()=>{

const img=preview.querySelector("img");

if(!img){

notify("Nothing to download.");

return;

}

const a=document.createElement("a");

a.href=img.src;

a.download="wallpaper.png";

a.click();

};

/*================================*/
/* Regenerate */
/*================================*/

$("#regenerateWallpaper").onclick=()=>{

$("#generateWallpaper").click();

};

/*=========================================
    APP.JS PART 2
=========================================*/

let selectedWallpaperImages = new Set();
let favoriteImages = new Set();

/*============================*/
/* Image Selection */
/*============================*/

function refreshSelection(){

    document
    .querySelectorAll("#selectedImages img")
    .forEach((img,index)=>{

        img.classList.toggle(
            "selected",
            selectedWallpaperImages.has(index)
        );

    });

}

function attachSelection(img,index){

    img.addEventListener("click",()=>{

        if(selectedWallpaperImages.has(index))
            selectedWallpaperImages.delete(index);
        else
            selectedWallpaperImages.add(index);

        refreshSelection();

    });

}

/*============================*/

const oldCreateThumbnail = createThumbnail;

createThumbnail = function(src){

    const img=document.createElement("img");

    img.src=src;

    img.draggable=false;

    img.addEventListener("dblclick",()=>{

        openViewer(src);

    });

    selectedImages.appendChild(img);

    attachSelection(
        img,
        uploadedImages.length-1
    );

};

/*============================*/
/* Fullscreen */
/*============================*/

$("#fullscreenPreview").onclick=()=>{

    const img=preview.querySelector("img");

    if(!img){

        notify("Nothing to preview.");

        return;

    }

    openViewer(img.src);

};

/*============================*/
/* Export */
/*============================*/

$("#confirmExport").onclick=()=>{

    $("#exportModal")
    .classList.add("hidden");

    $("#downloadWallpaper")
    .click();

};

$("#cancelExport").onclick=()=>{

    $("#exportModal")
    .classList.add("hidden");

};

/*============================*/
/* Search */
/*============================*/

const search=$("#searchLibrary");

if(search){

search.addEventListener("input",()=>{

const value=
search.value.toLowerCase();

document
.querySelectorAll("#libraryGrid img")
.forEach(img=>{

const name=
img.dataset.name||"";

img.style.display=

name.includes(value)

?

"block"

:

"none";

});

});

}

/*============================*/
/* Favorites */
/*============================*/

function toggleFavorite(src){

if(favoriteImages.has(src)){

favoriteImages.delete(src);

notify("Removed Favorite");

}

else{

favoriteImages.add(src);

notify("Added Favorite");

}

}

/*============================*/
/* Generated Images */
/*============================*/

function addGeneratedImage(src){

generatedImages.push(src);

const img=document.createElement("img");

img.src=src;

img.onclick=()=>{

openViewer(src);

};

img.addEventListener("contextmenu",e=>{

e.preventDefault();

showGeneratedMenu(src);

});

generatedGallery.appendChild(img);

}

function showGeneratedMenu(src){

const action=

prompt(

"1 = Use For Wallpaper\n2 = Download"

);

if(action==="1"){

uploadedImages.push(src);

createThumbnail(src);

notify("Added to Wallpaper");

}

if(action==="2"){

const a=document.createElement("a");

a.href=src;

a.download="generated.png";

a.click();

}

}

/*============================*/
/* Delete Selected */
/*============================*/

function removeSelected(){

uploadedImages=

uploadedImages.filter(

(i,index)=>!

selectedWallpaperImages.has(index)

);

selectedWallpaperImages.clear();

selectedImages.innerHTML="";

uploadedImages.forEach(createThumbnail);

}

/*============================*/
/* Keyboard */
/*============================*/

document.addEventListener(

"keydown",

e=>{

if(e.key==="Delete"){

removeSelected();

}

if(e.ctrlKey&&e.key==="e"){

e.preventDefault();

$("#exportModal")

.classList.remove("hidden");

}

if(e.key==="Escape"){

viewer.classList.add("hidden");

}

}

/*============================*/
/* Clear Generated */
/*============================*/

const clear=$("#clearGenerated");

if(clear){

clear.onclick=()=>{

generatedImages=[];

generatedGallery.innerHTML="";

notify("Gallery Cleared");

};

}

/*============================*/
/* Library */
/*============================*/

function addToLibrary(src){

const img=document.createElement("img");

img.src=src;

img.dataset.name="image";

img.onclick=()=>{

openViewer(src);

};

$("#libraryGrid").appendChild(img);

}

/*============================*/

function syncLibrary(){

$("#libraryGrid").innerHTML="";

uploadedImages.forEach(addToLibrary);

generatedImages.forEach(addToLibrary);

}

/*============================*/

setInterval(syncLibrary,3000);

/*============================*/
/* Drag Sort (basic) */
/*============================*/

let dragItem=null;

selectedImages.addEventListener(

"dragstart",

e=>{

dragItem=e.target;

});

selectedImages.addEventListener(

"dragover",

e=>{

e.preventDefault();

});

selectedImages.addEventListener(

"drop",

e=>{

e.preventDefault();

if(

dragItem&&

e.target.tagName==="IMG"

){

selectedImages.insertBefore(

dragItem,

e.target

);

}

});

/*============================*/

notify(

"AI Wallpaper Studio Ready"

);
