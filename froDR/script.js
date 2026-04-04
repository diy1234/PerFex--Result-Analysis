function showLogin() {
    const login = document.getElementById("loginForm");
    const signup = document.getElementById("signupForm");

    signup.classList.add("hidden");

    setTimeout(() => {
        login.classList.remove("hidden");
    }, 200);
}

function showSignup() {
    const login = document.getElementById("loginForm");
    const signup = document.getElementById("signupForm");

    login.classList.add("hidden");

    setTimeout(() => {
        signup.classList.remove("hidden");
    }, 200);
}
function login() {
    let id = document.getElementById("loginId").value.trim();
    let password = document.getElementById("loginPassword").value.trim();

    if (id === "" || password === "") {
        alert("Please fill all fields!");
        return;
    }

    if (!id.includes("@")) {
        alert("University ID must contain '@'");
        return;
    }

    alert("Login Successful!");
}
function isStrongPassword(password) {
    let strongPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    return strongPattern.test(password);
}
function signup() {
    let name = document.getElementById("name").value.trim();
    let email = document.getElementById("email").value.trim();
    let newPass = document.getElementById("newPassword").value.trim();
    let confirmPass = document.getElementById("confirmPassword").value.trim();

    if (name === "" || email === "" || newPass === "" || confirmPass === "") {
        alert("Please fill all fields!");
        return;
    }

    if (!email.includes("@")) {
        alert("Email must contain '@'");
        return;
    }

    if (!isStrongPassword(newPass)) {
        alert("Password must contain:\n- 8 characters\n- Uppercase\n- Lowercase\n- Number\n- Special symbol");
        return;
    }

    if (newPass !== confirmPass) {
        alert("Passwords do not match!");
        return;
    }

    alert("Signup Successful!");
}


function forgotPassword() {
    let email = prompt("Enter your registered email:");

    if (email === null || email.trim() === "") {
        alert("Email is required!");
        return;
    }

    if (!email.includes("@")) {
        alert("Enter a valid email address!");
        return;
    }

    alert("Password reset link has been sent to " + email);
}
document.getElementById("newPassword").addEventListener("input", function() {
    let password = this.value;
    let strengthBar = document.getElementById("strengthBar");
    let strengthText = document.getElementById("strengthText");

    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    if (strength <= 2) {
        strengthBar.style.width = "30%";
        strengthBar.style.background = "red";
        strengthText.innerText = "Weak Password";
    }
    else if (strength === 3 || strength === 4) {
        strengthBar.style.width = "60%";
        strengthBar.style.background = "orange";
        strengthText.innerText = "Medium Password";
    }
    else {
        strengthBar.style.width = "100%";
        strengthBar.style.background = "green";
        strengthText.innerText = "Strong Password";
    }
});
let generatedOTP = "";

function sendOTP() {
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("newPassword").value.trim();
    let confirmPass = document.getElementById("confirmPassword").value.trim();

    if (email === "" || password === "" || confirmPass === "") {
        alert("Please fill all required fields!");
        return;
    }

    if (!email.includes("@")) {
        alert("Enter valid email!");
        return;
    }

    if (password !== confirmPass) {
        alert("Passwords do not match!");
        return;
    }

    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    alert("Your OTP is: " + generatedOTP);  // Demo purpose only

    document.getElementById("otpField").style.display = "block";
    document.getElementById("verifyBtn").style.display = "block";
}
function verifyOTP() {
    let userOTP = document.getElementById("otpField").value;

    if (userOTP === generatedOTP) {
        alert("Signup Successful! OTP Verified 🎉");
    } else {
        alert("Incorrect OTP. Try again.");
    }
}