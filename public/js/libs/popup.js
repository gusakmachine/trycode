
class Popup {
    elements = new Set
    disabledClassName = 'disabled'
    enabledClassName = 'enabled'

    setClassNames(enabled, disabled) {
        this.enabledClassName = enabled
        this.disabledClassName = disabled
    }

    add(el) {
        this.elements.add(el)
    }

    toggle(el) {
        this.add(el)

        if (el.classList.contains(this.enabledClassName)) {
            el.classList.remove(this.enabledClassName)
            el.classList.add(this.disabledClassName)
        } else if (el.classList.contains(this.disabledClassName)) {
            el.classList.remove(this.disabledClassName)
            el.classList.add(this.enabledClassName)
        }
    }

    enable(el) {
        this.add(el)

        if (el.classList.contains(this.disabledClassName))
            this.toggle(el)
    }

    disable(el) {
        this.add(el)

        if (el.classList.contains(this.enabledClassName))
            this.toggle(el)
    }

    disableAll() {
        let enabled = this.enabledClassName
        let popup = this
        
        this.elements.forEach(function (val) {
            if (val.classList.contains(enabled))
                popup.toggle(val)
        })
    }
}