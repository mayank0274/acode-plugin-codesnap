import plugin from "../plugin.json";
import style from "./style.scss";
import { dataURLToBlob, blobToArrayBuffer } from "blob-util";

const selectionMenu = acode.require("selectionMenu");
const fs = acode.require("fs");
const fileBrowser = acode.require("fileBrowser");
const settings = acode.require("settings");
const select = acode.require("select");

import html2canvas from 'html2canvas';

let self;

const THEMES = [
  [
    // them-file-name, background-color-of-theme, forground-color-of-theme
    "atom-one-dark.min.css,#282c34,#abb2bf",
    "Atom One Dark",
    "icon color_lenspalette",
    true
  ],
  [
    "atom-one-light.min.css,#fafafa,#383a42",
    "Atom One Light",
    "icon color_lenspalette",
    true
  ],
  [
    "chalk.min.css,#151515,#d0d0d0",
    "Chalk",
    "icon color_lenspalette",
    true
  ],
  [
    "darcula.min.css,#2b2b2b,#a9b7c6",
    "Darcula",
    "icon color_lenspalette",
    true
  ],
  [
    "fruit-soda.min.css,#f1ecf1,#515151",
    "Fruit Soda 🍓",
    "icon color_lenspalette",
    true
  ],
  [
    "github-dark.min.css,#010033,#c9d1d9",
    "Github Dark",
    "icon color_lenspalette",
    true
  ],
  [
    "monokai.min.css,#272822,#f8f8f2",
    "Monokai",
    "icon color_lenspalette",
    true
  ],
  [
    "nord.min.css,#2e3440,#d8dee9",
    "Nord",
    "icon color_lenspalette",
    true
  ],
  [
    "one-light.min.css,#fafafa,#383a42",
    "One Light",
    "icon color_lenspalette",
    true
  ],
  [
    "onedark.min.css,#282c34,#abb2bf",
    "One Dark",
    "icon color_lenspalette",
    true
  ],
  [
    "tokyo-night-dark.min.css,#1a1b26,#a9b1d6",
    "Tokyo Night Dark",
    "icon color_lenspalette",
    true
  ],
  [
    "tokyo-night-light.min.css,#d5d6db,#343b59",
    "Tokyo Night Light",
    "icon color_lenspalette",
    true
  ]
]

class CodeSnap {
  async init($page) {
    $page.id = "acode.plugin.codeSnap";
    $page.settitle("Code snap");
    this.$page = $page;
    self = this.$page;

    this.$githubDarkFile = tag("link", {
      className: "highlightjs-theme",
      rel: "stylesheet",
      href: this.baseUrl + "assets/github-dark.min.css",
    });
    this.$higlightJsFile = tag("script", {
      src: this.baseUrl + "assets/highlight.min.js",
    });

    this.$style = tag("style", {
      textContent: style,
    });

    document.head.append(
      this.$style,
      this.$githubDarkFile,
      this.$higlightJsFile
    );

    this.$snapSaveBtn = tag("span", {
      className: "icon save snapsave",
      dataset: {
        action: "save-snap",
      },
    });
    this.$changeThemeBtn = tag("span", {
      className: "icon color_lenspalette",
      dataset: {
        action: "change-theme",
      },
    });
    
    this.$changeThemeBtn.onclick = this._changeTheme.bind(this);

    this.$page.header.append(this.$changeThemeBtn,this.$snapSaveBtn);
    this.$snapSaveBtn.onclick = this.saveCodeSnap;

    this.$main = tag("div", {
      className: "codeSnap-main",
    });

    this.$page.append(this.$main);

    this.$cameraIcon = tag("img", {
      className: "showSnap",
      src: this.baseUrl + "assets/cam-icon.svg",
      dataset: {
        action: "show-snap",
      },
    });
    
    selectionMenu.add(this.createSnap.bind(this), this.$cameraIcon, "all");
  }
  
  async _changeTheme(){
    const themeSelector = await select('Select Theme', THEMES);
    if(!themeSelector) return;
    // Remove existing style elements with class 'highlightjs-theme'
    const existingThemes = document.querySelectorAll('.highlightjs-theme');
    existingThemes.forEach(function(themeElement) {
      themeElement.parentNode.removeChild(themeElement);
    });
    
    const [ themeNme, bgColor, fgColor ] = themeSelector.split(",");
    
    document.querySelector("#window").style.backgroundColor = bgColor;
    document.querySelector("#window-title").style.color = fgColor;
    // Dynamically load the selected theme
    const themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = this.baseUrl + "assets/"+themeNme;
    themeLink.className = 'highlightjs-theme';
  
    document.head.appendChild(themeLink);
  }

  createSnap() {
    this.$main.innerHTML = "";
    const { editor } = editorManager;
    let selectedText = editor.session.getTextRange(editor.getSelectionRange());
    let textArray = selectedText.split("\n");
    let lines = "";
    for (let i = 0; i < textArray.length; i++) {
      lines += `${textArray[i].trim()}\n`;
    }
    
    let htmlSnippet = `<div id="snippet-scroll">
        
          <div id="window">
            <div id="navbar">
              <div id="window-controls">
                <div class="red dot"></div>
                <div class="yellow dot"></div>
                <div class="green dot"></div>
              </div>
              <div id="window-title" contenteditable="true">${editorManager.activeFile.filename}</div>
            </div>
            <div id="snippet">
            <pre class="hljs codesArea"><code style="font-family: ${settings.get("editorFont")};">${
              hljs.highlightAuto(lines).value
            }</code></pre>   
            </div>
          </div>
     
      </div>
    `;
    this.$main.innerHTML += htmlSnippet;
    this.$page.show();
  }

  async saveCodeSnap() {
    try {
      const main = document.querySelector(".codeSnap-main");
      const imageCanvas = await html2canvas(main, {
        backgroundColor: "transparent",
        logging: "false"
      });
      
      const imageDataURL = imageCanvas.toDataURL('image/png');
      const fileViewer = await fileBrowser(
        "folder",
        "Select location to save file",
        true
      );
      const url = fileViewer.url;

      const name = `Code_snap_${Math.floor(Math.random() * 1000)}.png`;
      const blob = dataURLToBlob(imageDataURL)
      const buffer = await blobToArrayBuffer(blob)
      const file = await fs(url).createFile(name, buffer);
      self.hide();
      // a feedback after saving image in the form of vibration 
      navigator.vibrate(500);
      window.toast("Image saved sucessfully!!", 2000);
    } catch (error) {
      alert(error.message);
    }
  }

  async destroy() {
      this.$style.remove();
      this.$githubDarkFile.remove();
      this.$higlightJsFile.remove();
  }
}

if (window.acode) {
  const acodePlugin = new CodeSnap();
  acode.setPluginInit(
    plugin.id,
    async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
      if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
      }
      acodePlugin.baseUrl = baseUrl;
      await acodePlugin.init($page, cacheFile, cacheFileUrl);
    }
  );
  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
}
