passwordForm = document.getElementById('password-form')
passwordInput = document.getElementById('password-inpt')

passwordForm.addEventListener('submit', (e) => {
    e.preventDefault()
    document.cookie = "password=" + passwordInput.value
    window.localStorage.setItem('password', passwordInput.value)
    window.location.href = document.URL
})