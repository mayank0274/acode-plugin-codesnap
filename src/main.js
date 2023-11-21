import plugin from "../plugin.json";
import style from "./style.scss";

const selectionMenu = acode.require("selectionMenu");
const fs = acode.require("fs");
const fileBrowser = acode.require("fileBrowser");

import domtoimage from "dom-to-image";

let self;

class CodeSnap {
  async init($page) {
    $page.id = "acode.plugin.codeSnap";
    $page.settitle("Code snap");
    this.$page = $page;
    self = this.$page;

    this.$githubDarkFile = tag("link", {
      rel: "stylesheet",
      href: this.baseUrl + "assets/github-dark.css",
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

    this.$page.header.append(this.$snapSaveBtn);
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
              <div id="window-title" contenteditable="true">Code editor</div>
            </div>
            <div id="snippet">
            <pre class="hljs codesArea"><code>${
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
      const blob = await domtoimage.toBlob(main);
      console.log(blob);
      const fileViewer = await fileBrowser(
        "folder",
        "Select location to save file",
        true
      );
      const url = fileViewer.url;

      const name = `Code_snap_${Math.floor(Math.random() * 1000)}.png`;
      const file = await fs(url).createFile(name, blob);
      self.hide();
      window.toast("Image saved sucessfully!!", 2000);
    } catch (error) {
      alert(error.message);
    }
  }

  async destroy() {}
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
