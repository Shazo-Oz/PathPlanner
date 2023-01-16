import { auth, user} from './fb-init.js'
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js'

export const READY={status:true}
// if (user) {
//     console.log("!");
//     location = location.href.slice(0, location.href.lastIndexOf("/")) + "/index.html"
// }

onAuthStateChanged(auth, ()=>{
    console.log(READY.status);
    if (user() && READY.status) {
        location = location.href.slice(0, location.href.lastIndexOf("/")) + "/index.html"
    }
})