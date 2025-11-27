import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBNZR3MHVLAj8bqPMqNsmGFKyWMnmrt7Hg",
  authDomain: "abdullahprotfolio.firebaseapp.com",
  projectId: "abdullahprotfolio",
  storageBucket: "abdullahprotfolio.firebasestorage.app",
  messagingSenderId: "314684931200",
  appId: "1:314684931200:web:81d83daa4a2c91c14f7a65",
  measurementId: "G-XVBCZ4HKNE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Form handling
const form = document.getElementById('main_contact_form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = form['name'].value;
  const email = form['email'].value;
  const subject = form['subject'].value;
  const message = form['message'].value;

  try {
    await addDoc(collection(db, "contacts"), {
      name,
      email,
      subject,
      message,
      timestamp: serverTimestamp()
    });

    // SweetAlert success
    Swal.fire({
      icon: 'success',
      title: 'Message Sent!',
      text: 'Your message has been sent successfully.',
      confirmButtonText: 'OK'
    });

    form.reset();
  } catch (error) {
    // SweetAlert error
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: `Error sending message: ${error.message}`,
      confirmButtonText: 'OK'
    });
  }
});
