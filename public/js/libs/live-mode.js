function LiveMode(editor, interval = 1000 * 60 * 5) {
    this.saveInterval = interval
    this.editor = editor
    this.content = false

    this.pushPath = function (path) {
        history.pushState(null, null, '/' + path)
    }
    this.addLine = function(row, column) {
        this.editor.getSession().insert({ row: row, column: column }, '\n')
    }
    this.addText = function(row, column, line) {
        this.editor.getSession().insert(
            {
                row: row,
                column: column
            },
            line
        )
    }
    this.changeFormat = function(delta) {
        let data = {
            action: delta.action,
            start: {
                row: delta.start.row,
                column: delta.start.column
            },
            end: {
                row: delta.end.row,
                column: delta.end.column
            },
            lines: delta.lines,
            room_id: window.location.pathname.substr(1, window.location.pathname.length),
            user_id: window.localStorage.getItem('user_id')
        }

        if (data.action !== 'insert')
            return data

        if (!data.lines[data.lines.length - 1] && !data.lines[data.lines.length - 2])
            data.lines.pop()

        return data
    }
    this.setContent = function (data) {
        if (this.content)
            return

        this.editor.setValue(data.content)

        if (!window.localStorage.getItem('user_id')) {
            window.localStorage.setItem('user_id', data.user_id)
            document.cookie = 'user_id=' + data.user_id
        }

        this.content = true
        console.log('Connected')
    }
    this.roomCreated = function (data) {
        if (!window.localStorage.getItem('user_id')) {
            window.localStorage.setItem('user_id', data.user_id)
            document.cookie = 'user_id=' + data.user_id
        }

        this.pushPath(data.room_id)
        window.location.href = document.URL
    }
    this.changeContent = function (data) {
        switch (data.action) {
            case 'insert':
                for (let i = 0, row = data.start.row; i < data.lines.length; i++, row++)
                    if (data.lines[i]) {
                        if (this.editor.session.getLength() < row + 1)
                            this.addLine(row, data.start.column)

                        this.addText(row, data.start.column, data.lines[i])
                    } else this.addLine(row, data.start.column)
                break
            case 'remove':
                this.editor.getSession().remove(
                    new ace.Range(
                        data.start.row,
                        data.start.column,
                        data.end.row,
                        data.end.column,
                    )
                )
                break
        }
    }
}