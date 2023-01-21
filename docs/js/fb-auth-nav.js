import { auth, user } from './fb-init.js'
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js'

function includeHTML() {
    var file, xhttp;
    /* Loop through a collection of all HTML elements: */
    document.querySelectorAll("*[include-html]").forEach(elmnt => {
        file = elmnt.getAttribute("include-html");
        if (file) {
            /* Make an HTTP request using the attribute value as the file name: */
            xhttp = new XMLHttpRequest();
            xhttp.file = `PathPlanner/${file}`;
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        elmnt.outerHTML = this.responseText;
                        const nav = elmnt.getAttribute("navActive")
                        if (nav) {
                            document.querySelector(`nav ul a[href*="${nav}"]`)?.classList.add('active')
                        }
                        if (document.getElementById('logOut')) {
                            document.getElementById('logOut').onclick=()=>{signOut(auth)}
                        }
                    }
                    if (this.status == 404) {
                        const retryInterval = 60
                        elmnt.innerHTML = `Snippet not found. retry in ${retryInterval} seconds`;
                        setTimeout(() => {
                            /* call this function once more: */
                            includeHTML()
                        }, retryInterval * 1000)
                    };
                }
            }
            xhttp.open("GET", file, true);
            xhttp.send();
            /* Exit the function: */
            return;
        }
    })

}
includeHTML()

onAuthStateChanged(auth, () => {
    if (!user()) {
        location = location.href.slice(0, location.href.lastIndexOf("/")) + "/login.html"
    }
})

document.querySelector("html").style.setProperty("--page-zoom", window.outerWidth / window.innerWidth)