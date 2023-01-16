import { auth, user, docRef } from './fb-init.js'
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js'
import { getDoc } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js'

onAuthStateChanged(auth, async () => {
    if (user()) {
        document.getElementById('blessUser').outerHTML = await blessUser()
        const welcomeEl=document.querySelector('.welcome');
        welcomeEl.style.width=`${welcomeEl.scrollWidth}px`
    }
})

async function getUserName() {
    const docSnap = await getDoc(docRef())
    if (!docSnap.exists()) return "{stranger}"
    return docSnap.data().name || "{anonymous}"
}

async function blessUser() {
    const hours = (new Date).getHours();
    let bless = "good" + " "
    switch (hours) { // add morning/afternoon/evening/night 
        case 4: case 5: case 6: case 7: case 8: case 9: case 10: case 11:
            bless += "morning"
            break;
        case 12: case 13: case 14: case 15: case 16:
            bless += "afternoon"
            break;
        case 17: case 18: case 19: case 20:
            bless += "evening"
            break;
        case 21: case 22: case 23: case 0: case 1: case 2: case 3:
            bless += "night"
            break;
        default:
            bless = "hello"
            break;
    }
    const userName = await getUserName()
    return bless + " " + userName
}
