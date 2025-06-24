"use strict";
window.addEventListener("load", (event) => {
    addRules();
    buildReferences();
});
function addRules() {
    const headers = [
        ...document.getElementsByTagName("h1"),
        ...document.getElementsByTagName("h2"),
    ];
    for (const header of headers) {
        const hr = document.createElement("hr");
        header.after(hr);
    }
}
function buildReferences() {
    for (const e of document.getElementsByClassName("reference")) {
        const index = e.href;
        const ref = document.getElementById(index);
        if (!ref)
            return;
        const refIndex = indexInParent(ref) + 1;
        if (refIndex < 1)
            return;
        e.textContent = "[" + refIndex + "]";
    }
}
function indexInParent(node) {
    const parent = node.parentNode;
    if (!parent)
        return -1;
    const children = parent.childNodes;
    let num = 0;
    for (let i = 0; i < children.length; i++) {
        if (children[i] == node)
            return num;
        if (children[i].nodeType == 1)
            num++;
    }
    return -1;
}
