import { auth, user } from './fb-init.js'
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js'

document.getElementById('logOut').addEventListener("click", signOut.bind(null, auth))

onAuthStateChanged(auth, () => {
    if (!user()) {
        location = location.href.slice(0, location.href.lastIndexOf("/")) + "/login.html"
    }
})

document.querySelector("html").style.setProperty("--page-zoom", window.outerWidth/ window.innerWidth)