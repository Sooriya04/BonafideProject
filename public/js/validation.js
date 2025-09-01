// validation.js

export function showAlert(message, type) {
  const alertPlaceholder = document.getElementById('alertPlaceholder');
  if (!alertPlaceholder) return;
  alertPlaceholder.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>${
        type === 'warning' ? 'Warning!' : 'Success!'
      }</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

export function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password');
  const toggleIcon = document.getElementById('togglePassword');
  if (!passwordInput || !toggleIcon) return;

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleIcon.classList.remove('bi-eye');
    toggleIcon.classList.add('bi-eye-slash');
  } else {
    passwordInput.type = 'password';
    toggleIcon.classList.remove('bi-eye-slash');
    toggleIcon.classList.add('bi-eye');
  }
}

export function validateSignupForm() {
  const email = document.forms['signupForm']['email'].value.trim();
  const password = document.forms['signupForm']['password'].value.trim();
  const name = document.forms['signupForm']['name'].value.trim();

  if (!name || !email || !password) {
    showAlert('All fields are required.', 'warning');
    return false;
  }
  if (!email.endsWith('@student.tce.edu')) {
    showAlert('Email must end with @student.tce.edu', 'warning');
    return false;
  }
  if (password.length < 6) {
    showAlert('Password must be at least 6 characters.', 'warning');
    return false;
  }
  return true;
}

export function validateLoginForm() {
  const email = document.forms['loginForm']['email'].value.trim();
  const password = document.forms['loginForm']['password'].value.trim();

  if (!email || !password) {
    showAlert('All fields are required.', 'warning');
    return false;
  }
  if (!email.endsWith('@student.tce.edu')) {
    showAlert('Email must end with @student.tce.edu', 'warning');
    return false;
  }
  if (password.length < 6) {
    showAlert('Password must be at least 6 characters.', 'warning');
    return false;
  }
  return true;
}
