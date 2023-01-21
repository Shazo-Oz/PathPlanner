import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import fbConfig from "./fb-env.js"
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js'
import { getFirestore, doc } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js'

const firebaseConfig=JSON.parse(atob(fbConfig.key))
export const app = initializeApp(firebaseConfig);
export const auth = getAuth()
export const db = getFirestore(app);
export const user = () => auth.currentUser
export const docRef = () => {
    try {
        return doc(db, "users", user().uid)
    } catch {
        return null
    }
}