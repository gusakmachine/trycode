
let currEl

var selectedMode = document.getElementById("selected-mode")
var selectModeList = document.getElementById("select-mode__list")
var selectModeSelectedItem = document.getElementsByClassName("select-mode__item selected")[0]

var settings = document.getElementById('settings')

var profileOptions = document.getElementById("profile-options")

let editor = ace.edit("editor")
editor.setTheme("ace/theme/chrome")

let popup = new Popup();


tippy('#save-btn', {
    content: "Code saved! It will be saved automatically 🎉",
})
tippy('#edit-filename', {
    content: "Edit filename",
})
tippy('#fork-btn', {
    content: "Clone this code",
})
tippy('#profile__sign-in-btn', {
    content: "Sign in with GitHub",
})


const socket = io('ws://127.0.0.1:3000', {
    'sync disconnect on unload': true
})
let liveMode = new LiveMode(editor)
let unsavedContent = true
let synchronized = false
let passwordInput = document.getElementById('password-inpt')
let editFileNameInpt = document.getElementById('edit-filename__input')
let selectModeMame = document.getElementById('select-mode-name')
let modes = document.getElementsByClassName('select-mode__item')
let usersCounter = document.getElementById('user-counter')
let usrOnlineNumber = document.getElementById('users-number__online-number')

let room_id, user_id

let editorOnChangeHandler = function(delta) {
    socket.emit('changing-content', liveMode.changeFormat(delta))

    unsavedContent = true
}
function changeMode(currEl) {
    selectModeSelectedItem.classList.toggle('selected')
    selectModeSelectedItem = currEl

    selectModeSelectedItem.classList.toggle('selected')
    selectedMode.innerHTML = selectModeSelectedItem.innerHTML

    let currElChildren = selectModeSelectedItem.children

    for (let i = 0; i < currElChildren.length; i++)
        if (currElChildren[i].classList.contains('select-mode-name')) {
            selectedMode.dataset.mode = currEl.dataset.mode
            editor.session.setMode("ace/mode/" + currElChildren[i].innerHTML)
            break
        }
}

function join(password = '') {
    socket.emit('joining-to-room', {
        room_id: room_id = window.location.pathname.substr(1, window.location.pathname.length),
        user_id: user_id = window.localStorage.getItem('user_id'),
        password: password
    })

    console.log("Connecting...")
}
function getContent() {
    console.log('get content')
    socket.emit('get-content', {
        room_id: room_id
    })
}
function saveContent() {
    socket.emit('save-content', {
        room_id: room_id,
        user_id: user_id,
        content: editor.getValue()
    })
}
function setPassword() {
    socket.emit('set-password', {
        room_id: room_id,
        user_id: user_id,
        password: passwordInput.value
    })
}
function setMode() {
    socket.emit('set-mode', {
        room_id: room_id,
        user_id: user_id,
        mode: selectedMode.dataset.mode
    })
}
function setFileName() {
    socket.emit('set-file-name', {
        room_id: room_id,
        user_id: user_id,
        name: editFileNameInpt.innerHTML
    })
}
function setNumber(number) {
    usrOnlineNumber.innerHTML = number
}
function readonly() {
    socket.emit('readonly', {
        room_id: room_id,
        user_id: user_id
    })
}
function livemode() {
    usersCounter.classList.toggle('disabled')
    socket.emit('livemode', {
        room_id: room_id,
        user_id: user_id
    })
}

document.addEventListener('DOMContentLoaded', () => {
    socket.on('connect', () => {
        if (window.location.pathname === '/') {
            socket.emit('create-room', {
                content: editor.getValue(),
                user_id: window.localStorage.getItem('user_id'),
                password: ''
            })
        } join(window.localStorage.getItem('password'))

        window.addEventListener('beforeunload', () => {
            socket.emit('save', {
                room_id: room_id,
                user_id: user_id,
                content: editor.getValue()
            })
            socket.emit('save-content', {
                room_id: room_id,
                user_id: user_id,
                content: editor.getValue()
            })
            socket.emit('beforeunload', room_id)
        })

        socket.on('message', function (data) {
            switch (data.event) {
                case 'room-created':
                    console.log('Room created')
                    liveMode.roomCreated(data)
                    break
                case 'install-content':
                    console.log('Content set')
                    editor.session.off('change', editorOnChangeHandler)

                    liveMode.setContent(data)
                    setNumber(data.number)
                    synchronized = true

                    editor.session.setMode("ace/mode/" + selectModeMame.innerHTML)
                    editor.session.on('change', editorOnChangeHandler)
                    break
                case 'actual-content':
                    console.log('You are first. Actual content')
                    if (!synchronized)
                        getContent()
                    break
                case 'refused':
                    console.log('Refused')
                    break
            }
        })

        socket.on('join', (number) => {
            console.log('join')
            setNumber(number)
            saveContent()
        })
        socket.on('actual-content', () => {
            if (!synchronized) {
                console.log('Actual content')
                getContent()
            }
        })
        socket.on('set-mode', (mode) => {
            for (let i = 0; i < modes.length; i++) {
                if (modes[i].dataset.mode === mode)
                    changeMode(modes[i])
            }
        })
        socket.on('set-file-name', (name) => {
            editFileNameInpt.innerHTML = name
        })
        socket.on('leave', setNumber)
        socket.on('changing-content', async (data) => {
            editor.session.off('change', editorOnChangeHandler)
            console.log(data.lines)
            await liveMode.changeContent(data)
            editor.session.on('change', editorOnChangeHandler)
        })

        editor.session.on('change', editorOnChangeHandler)
    })

    if (passwordInput)
        passwordInput.addEventListener('focusout', setPassword)
    if (editFileNameInpt)
        editFileNameInpt.addEventListener('focusout', setFileName)

    document.body.addEventListener("click", function (e) {
        if (e.target.closest('.select-mode')) {
            if (currEl = e.target.closest('.select-mode__item')) {
                changeMode(currEl)
                setMode()
            }

            popup.toggle(selectModeList)
        } else if (e.target.closest('.profile')) {
            popup.toggle(profileOptions)
        } else if (e.target.closest('.settings-btn'))
            popup.toggle(settings)

        else if (currEl = e.target.closest('.settings-item')) {
            switch(currEl.id) {
                case 'readonly': readonly()
                    break
                case 'livemode': livemode()
                    break
            }

            currEl.querySelector('.toggle').classList.toggle('toggle-check')
            currEl.querySelector('.toggle-track').classList.toggle('toggle-track-check')

        }// else popup.disableAll()
    })
})