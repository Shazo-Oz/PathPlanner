import { auth, docRef} from './fb-init.js'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js'
import { setDoc } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js'
import { READY } from './fb-auth-login.js'

document.getElementById("loginBtn").addEventListener("click", login)
document.getElementById("registerBtn").addEventListener("click", register)

async function login(e) {
    e.preventDefault();
    const uMail = document.querySelector("input[name='userName']")
    const uPass = document.querySelector("input[name='userPass']")
    if (!(uMail.reportValidity() && uPass.reportValidity())) return
    try {
        READY.status=false
        await signInWithEmailAndPassword(auth, uMail.value, uPass.value)
        gotoIndex()
        READY.status=true
    } catch {
        popup('email or password are incorrect')
    }

}
document.querySelector("html").style.setProperty("--page-zoom", window.outerWidth/ window.innerWidth)

async function register(e) {
    e.preventDefault();
    const uName = document.querySelector("input[name='new_name']")
    const uMail = document.querySelector("input[name='new_userName']")
    const uPass = document.querySelector("input[name='new_userPass']")
    const uConPass = document.querySelector("input[name='new_userConfirmPass']")
    if (!(uName.reportValidity() && uMail.reportValidity() && uPass.reportValidity() && uConPass.reportValidity())) return
    if (!validateEmail(uMail.value)) return popup("Email is invalid")
    if (uPass.value !== uConPass.value) return popup("Passwords are not the same")
    try {
        READY.status=false
        await createUserWithEmailAndPassword(auth, uMail.value, uPass.value)
        setDoc(docRef(), {
            mail: uMail.value,
            name: uName.value,
            savedPoints: {}
        }).then(()=>{
            READY.status=true
            gotoIndex()
        })
    } catch (e) {
        popup(e.message.slice(10))
    }
}

function popup(msg) {
    const errDiv = document.querySelector(".error")
    errDiv.innerHTML = msg
    errDiv.style.opacity = '1'
    setTimeout(() => {
        errDiv.style.opacity = '0'
    }, 3000)
}

function validateEmail(email) /*bool*/ {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

function gotoIndex() {
    location = location.href.slice(0, location.href.lastIndexOf("/")) + "/index.html"
}

const loginText = document.querySelector(".title-text .login");
const loginForm = document.querySelector("form.login");
const loginBtn = document.querySelector("label.login");
const signupBtn = document.querySelector("label.signup");
const signupLink = document.querySelector("form .signup-link a");
const errorDiv = document.querySelector(".error");


signupBtn.onclick = (() => {
    loginForm.style.marginLeft = "-50%";
    loginText.style.marginLeft = "-50%";
});
loginBtn.onclick = (() => {
    loginForm.style.marginLeft = "0%";
    loginText.style.marginLeft = "0%";
});
signupLink.onclick = (() => {
    signupBtn.click();
    return false;
});
setTimeout(() => errorDiv.removeAttribute("style"), 1000)